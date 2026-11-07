import fs from "node:fs/promises";
import path from "node:path";
import zlib from "node:zlib";
import { getManuscriptRecord, getManuscriptStorageDir } from "@/lib/manuscript-upload-service";

export interface ExtractedManuscriptPage {
  pageNumber: number;
  text: string;
}

export interface ExtractedManuscriptSection {
  heading: string;
  content: string;
  pageNumber: number | null;
}

export interface ManuscriptExtractionResult {
  extracted: boolean;
  fileName: string | null;
  fileType: "pdf" | "docx" | "metadata_only" | "none";
  pageCount: number;
  pages: ExtractedManuscriptPage[];
  sections: ExtractedManuscriptSection[];
  fullText: string;
  summarizedForPrompt: string;
  warnings: string[];
}

/**
 * Decode standard XML/HTML entities in DOCX XML text runs.
 */
function decodeXmlEntities(input: string): string {
  return input
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      const code = parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : " ";
    })
    .replace(/&#(\d+);/g, (_, dec) => {
      const code = parseInt(dec, 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : " ";
    })
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

/**
 * Strip prompt-injection directives and control characters from untrusted manuscript text.
 * Uploaded manuscripts must be treated strictly as untrusted data, never as LLM instructions.
 */
export function sanitizeUntrustedManuscriptText(raw: string): string {
  if (!raw) return "";
  let cleaned = raw
    // Remove control characters except newline and tab
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, " ")
    // Neutralize chat-template / role-injection delimiters
    .replace(/<\|im_start\|>|<\|im_end\|>|<\|system\|>|<\|user\|>|<\|assistant\|>/gi, "[REDACTED_TOKEN]")
    // Neutralize prompt injection phrases attempting to override reviewer instructions
    .replace(
      /\b(ignore\s+(all\s+)?(previous|prior|above)\s+instructions?|disregard\s+(all\s+)?instructions?|system\s+override|you\s+must\s+approve\s+this\s+research)\b/gi,
      "[UNTRUSTED_DIRECTIVE_REMOVED]"
    );

  // Normalize excessive blank lines and spaces
  cleaned = cleaned
    .replace(/[ \t]+/g, " ")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return cleaned;
}

/**
 * Extract XML text from a DOCX (ZIP) buffer by locating `word/document.xml`.
 */
export function extractTextFromDocxBuffer(buffer: Buffer): {
  pages: ExtractedManuscriptPage[];
  fullText: string;
} {
  if (!buffer || buffer.length < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
    throw new Error("Invalid DOCX container header.");
  }

  let documentXml = "";

  // Strategy 1: Read ZIP Central Directory from End of Central Directory (EOCD) record
  let eocdOffset = -1;
  const maxSearch = Math.max(0, buffer.length - 65557);
  for (let i = buffer.length - 22; i >= maxSearch; i--) {
    if (
      buffer[i] === 0x50 &&
      buffer[i + 1] === 0x4b &&
      buffer[i + 2] === 0x05 &&
      buffer[i + 3] === 0x06
    ) {
      eocdOffset = i;
      break;
    }
  }

  if (eocdOffset !== -1) {
    const cdEntries = buffer.readUInt16LE(eocdOffset + 10);
    const cdOffset = buffer.readUInt32LE(eocdOffset + 16);
    let ptr = cdOffset;
    for (let e = 0; e < cdEntries && ptr + 46 <= buffer.length; e++) {
      const sig = buffer.readUInt32LE(ptr);
      if (sig !== 0x02014b50) break;
      const compressionMethod = buffer.readUInt16LE(ptr + 10);
      const compressedSize = buffer.readUInt32LE(ptr + 20);
      const fileNameLen = buffer.readUInt16LE(ptr + 28);
      const extraLen = buffer.readUInt16LE(ptr + 30);
      const commentLen = buffer.readUInt16LE(ptr + 32);
      const localHeaderOffset = buffer.readUInt32LE(ptr + 42);
      const entryName = buffer.subarray(ptr + 46, ptr + 46 + fileNameLen).toString("utf8");

      if (entryName === "word/document.xml" && localHeaderOffset + 30 <= buffer.length) {
        const lfhFileNameLen = buffer.readUInt16LE(localHeaderOffset + 26);
        const lfhExtraLen = buffer.readUInt16LE(localHeaderOffset + 28);
        const dataStart = localHeaderOffset + 30 + lfhFileNameLen + lfhExtraLen;
        const compressedSlice = buffer.subarray(dataStart, dataStart + compressedSize);
        if (compressionMethod === 0) {
          documentXml = compressedSlice.toString("utf8");
        } else if (compressionMethod === 8) {
          documentXml = zlib.inflateRawSync(compressedSlice).toString("utf8");
        }
        break;
      }

      ptr += 46 + fileNameLen + extraLen + commentLen;
    }
  }

  // Strategy 2: Fallback scan of Local File Headers (PK\x03\x04)
  if (!documentXml) {
    let offset = 0;
    while (offset + 30 <= buffer.length) {
      if (
        buffer[offset] !== 0x50 ||
        buffer[offset + 1] !== 0x4b ||
        buffer[offset + 2] !== 0x03 ||
        buffer[offset + 3] !== 0x04
      ) {
        offset++;
        continue;
      }
      const compressionMethod = buffer.readUInt16LE(offset + 8);
      const compressedSize = buffer.readUInt32LE(offset + 18);
      const fileNameLen = buffer.readUInt16LE(offset + 26);
      const extraLen = buffer.readUInt16LE(offset + 28);
      const entryName = buffer.subarray(offset + 30, offset + 30 + fileNameLen).toString("utf8");
      const dataStart = offset + 30 + fileNameLen + extraLen;

      if (entryName === "word/document.xml") {
        const slice =
          compressedSize > 0
            ? buffer.subarray(dataStart, dataStart + compressedSize)
            : buffer.subarray(dataStart);
        if (compressionMethod === 0) {
          documentXml = slice.toString("utf8");
        } else if (compressionMethod === 8) {
          documentXml = zlib.inflateRawSync(slice).toString("utf8");
        }
        break;
      }
      offset = dataStart + Math.max(1, compressedSize);
    }
  }

  if (!documentXml) {
    throw new Error("Could not locate word/document.xml in DOCX file.");
  }

  // Mark explicit DOCX page breaks so we can preserve page numbers
  const withPageMarkers = documentXml
    .replace(/<w:br[^>]*w:type=["']page["'][^>]*\/?>/gi, "\n[[PAGE_BREAK]]\n")
    .replace(/<w:lastRenderedPageBreak\s*\/?>/gi, "\n[[PAGE_BREAK]]\n")
    .replace(/<w:tab\s*\/?>/gi, "\t")
    .replace(/<\/w:p>/gi, "\n")
    .replace(/<\/w:tr>/gi, "\n")
    .replace(/<\/w:tc>/gi, " | ")
    .replace(/<[^>]+>/g, "");

  const decoded = decodeXmlEntities(withPageMarkers);
  const rawPages = decoded
    .split("[[PAGE_BREAK]]")
    .map((p) => sanitizeUntrustedManuscriptText(p))
    .filter(Boolean);

  // If no explicit page breaks were embedded in XML, segment into ~2,400-char logical pages
  const pages: ExtractedManuscriptPage[] = [];
  if (rawPages.length > 1) {
    rawPages.forEach((txt, idx) => {
      pages.push({ pageNumber: idx + 1, text: txt });
    });
  } else if (rawPages.length === 1) {
    const single = rawPages[0];
    if (single.length <= 2800) {
      pages.push({ pageNumber: 1, text: single });
    } else {
      const paragraphs = single.split(/\n+/);
      let currentChunk = "";
      let pageNo = 1;
      for (const para of paragraphs) {
        if ((currentChunk + "\n" + para).length > 2600 && currentChunk.trim()) {
          pages.push({ pageNumber: pageNo++, text: currentChunk.trim() });
          currentChunk = para;
        } else {
          currentChunk = currentChunk ? `${currentChunk}\n${para}` : para;
        }
      }
      if (currentChunk.trim()) {
        pages.push({ pageNumber: pageNo, text: currentChunk.trim() });
      }
    }
  }

  const fullText = pages.map((p) => p.text).join("\n\n");
  return { pages, fullText };
}

/**
 * Decode a PDF literal string `(...)` handling backslash escapes and octal sequences.
 */
function decodePdfLiteralString(raw: string): string {
  let out = "";
  let i = 0;
  while (i < raw.length) {
    const ch = raw[i];
    if (ch === "\\" && i + 1 < raw.length) {
      const next = raw[i + 1];
      if (next >= "0" && next <= "7") {
        const oct = raw.slice(i + 1, i + 4).match(/^[0-7]{1,3}/)?.[0] || next;
        out += String.fromCharCode(parseInt(oct, 8));
        i += 1 + oct.length;
        continue;
      }
      switch (next) {
        case "n":
          out += "\n";
          break;
        case "r":
          out += "\r";
          break;
        case "t":
          out += "\t";
          break;
        case "b":
          out += "\b";
          break;
        case "f":
          out += "\f";
          break;
        case "(":
        case ")":
        case "\\":
          out += next;
          break;
        default:
          out += next;
          break;
      }
      i += 2;
    } else {
      out += ch;
      i++;
    }
  }
  return out;
}

/**
 * Decode a PDF hex string `<...>`.
 */
function decodePdfHexString(hexRaw: string): string {
  const cleanHex = hexRaw.replace(/\s+/g, "");
  if (!cleanHex) return "";
  const padded = cleanHex.length % 2 === 1 ? `${cleanHex}0` : cleanHex;
  const bytes = Buffer.from(padded, "hex");
  // Check for UTF-16BE BOM (0xFE 0xFF)
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    let str = "";
    for (let i = 2; i + 1 < bytes.length; i += 2) {
      str += String.fromCharCode((bytes[i] << 8) | bytes[i + 1]);
    }
    return str;
  }
  return bytes.toString("latin1");
}

/**
 * Extract readable text from a decompressed PDF content stream.
 */
function extractTextFromPdfContentStream(content: string): string {
  const lines: string[] = [];

  // Extract BT ... ET text blocks first
  const btEtRegex = /\bBT\b([\s\S]*?)\bET\b/g;
  let match: RegExpExecArray | null;
  let foundBtEt = false;

  while ((match = btEtRegex.exec(content)) !== null) {
    foundBtEt = true;
    const block = match[1];
    const blockParts: string[] = [];

    // Match TJ arrays `[ ... ] TJ` or single string operators `(...) Tj`, `(...) '`, `(...) "`
    const tokenRegex = /\[([\s\S]*?)\]\s*TJ|\((?:\\.|[^\\)])*\)\s*(?:Tj|'|")|<([0-9A-Fa-f\s]+)>\s*Tj|\b(T\*|TD|Td)\b/g;
    let tm: RegExpExecArray | null;
    while ((tm = tokenRegex.exec(block)) !== null) {
      const full = tm[0];
      if (tm[1] !== undefined) {
        // Array inside TJ
        const arrContent = tm[1];
        const subRegex = /\((?:\\.|[^\\)])*\)|<([0-9A-Fa-f\s]+)>/g;
        let sm: RegExpExecArray | null;
        while ((sm = subRegex.exec(arrContent)) !== null) {
          if (sm[0].startsWith("(")) {
            blockParts.push(decodePdfLiteralString(sm[0].slice(1, -1)));
          } else if (sm[1]) {
            blockParts.push(decodePdfHexString(sm[1]));
          }
        }
      } else if (full.startsWith("(")) {
        const closeIdx = full.lastIndexOf(")");
        if (closeIdx > 0) {
          blockParts.push(decodePdfLiteralString(full.slice(1, closeIdx)));
        }
      } else if (tm[2] !== undefined) {
        blockParts.push(decodePdfHexString(tm[2]));
      } else if (tm[3]) {
        blockParts.push("\n");
      }
    }

    const joined = blockParts.join("").replace(/[ \t]+/g, " ").trim();
    if (joined) lines.push(joined);
  }

  // Fallback: if stream didn't use BT/ET boundaries, scan literal strings directly
  if (!foundBtEt || lines.length === 0) {
    const strRegex = /\((?:\\.|[^\\)]){2,}\)\s*(?:Tj|'|")?/g;
    let sm: RegExpExecArray | null;
    const fallbackParts: string[] = [];
    while ((sm = strRegex.exec(content)) !== null) {
      const rawToken = sm[0];
      const closeParen = rawToken.lastIndexOf(")");
      if (closeParen > 1) {
        const decoded = decodePdfLiteralString(rawToken.slice(1, closeParen));
        if (/[a-zA-Z0-9]{2,}/.test(decoded)) {
          fallbackParts.push(decoded);
        }
      }
    }
    if (fallbackParts.length > 0) {
      lines.push(fallbackParts.join(" "));
    }
  }

  return sanitizeUntrustedManuscriptText(lines.join("\n"));
}

/**
 * Extract text and page structure from a PDF buffer.
 */
export function extractTextFromPdfBuffer(buffer: Buffer): {
  pages: ExtractedManuscriptPage[];
  fullText: string;
} {
  if (!buffer || buffer.length < 5 || buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
    throw new Error("Invalid PDF header.");
  }

  const rawLatin1 = buffer.toString("latin1");
  const streamTexts: string[] = [];

  // Iterate over all `stream ... endstream` blocks in the PDF
  let searchPos = 0;
  while (searchPos < rawLatin1.length) {
    const streamIdx = rawLatin1.indexOf("stream", searchPos);
    if (streamIdx === -1) break;

    // Verify `stream` is not part of `endstream`
    if (streamIdx >= 3 && rawLatin1.slice(streamIdx - 3, streamIdx) === "end") {
      searchPos = streamIdx + 6;
      continue;
    }

    // Advance past `stream\r\n` or `stream\n`
    let dataStart = streamIdx + 6;
    if (rawLatin1[dataStart] === "\r" && rawLatin1[dataStart + 1] === "\n") {
      dataStart += 2;
    } else if (rawLatin1[dataStart] === "\n" || rawLatin1[dataStart] === "\r") {
      dataStart += 1;
    } else {
      // Not a valid stream keyword boundary
      searchPos = streamIdx + 6;
      continue;
    }

    const endStreamIdx = rawLatin1.indexOf("endstream", dataStart);
    if (endStreamIdx === -1) break;

    let dataEnd = endStreamIdx;
    if (rawLatin1[dataEnd - 2] === "\r" && rawLatin1[dataEnd - 1] === "\n") {
      dataEnd -= 2;
    } else if (rawLatin1[dataEnd - 1] === "\n" || rawLatin1[dataEnd - 1] === "\r") {
      dataEnd -= 1;
    }

    const dictHeader = rawLatin1.slice(Math.max(0, streamIdx - 350), streamIdx);
    const streamSlice = buffer.subarray(dataStart, Math.max(dataStart, dataEnd));

    // Skip image/font binary streams
    const isImageOrFont = /\/Subtype\s*\/Image|\/FontFile|\/Type\s*\/XRef|\/Type\s*\/Metadata/i.test(
      dictHeader
    );

    if (!isImageOrFont && streamSlice.length > 0) {
      let decodedContent = "";
      const isFlate = /\/FlateDecode|\/Fl\b/.test(dictHeader);
      if (isFlate) {
        try {
          decodedContent = zlib.inflateSync(streamSlice).toString("latin1");
        } catch {
          try {
            decodedContent = zlib.inflateRawSync(streamSlice).toString("latin1");
          } catch {
            decodedContent = "";
          }
        }
      } else {
        decodedContent = streamSlice.toString("latin1");
      }

      if (decodedContent) {
        const extracted = extractTextFromPdfContentStream(decodedContent);
        if (extracted && extracted.length >= 3) {
          streamTexts.push(extracted);
        }
      }
    }

    searchPos = endStreamIdx + 9;
  }

  const pages: ExtractedManuscriptPage[] = [];
  if (streamTexts.length > 0) {
    streamTexts.forEach((txt, idx) => {
      pages.push({
        pageNumber: idx + 1,
        text: txt,
      });
    });
  }

  const fullText = pages.map((p) => p.text).join("\n\n");
  return { pages, fullText };
}

/**
 * Segment extracted manuscript text into named scientific sections with page numbers.
 */
export function segmentManuscriptIntoSections(
  pages: ExtractedManuscriptPage[]
): ExtractedManuscriptSection[] {
  if (!pages || pages.length === 0) return [];

  const sections: ExtractedManuscriptSection[] = [];
  const headingPatterns = [
    /^(?:\d+\.?\s*)?(abstract|executive\s+summary)\b/i,
    /^(?:\d+\.?\s*)?(introduction|background|botanical\s+overview)\b/i,
    /^(?:\d+\.?\s*)?(materials?\s*(?:and|&)\s*methods?|methodology|extraction\s+protocol|plant\s+material)\b/i,
    /^(?:\d+\.?\s*)?(formulation|quality\s+control|batch\s+analysis)\b/i,
    /^(?:\d+\.?\s*)?(in[-\s]?silico|molecular\s+docking|computational\s+screening)\b/i,
    /^(?:\d+\.?\s*)?(results?\s*(?:and|&)?\s*discussion|findings)\b/i,
    /^(?:\d+\.?\s*)?(safety|toxicology|clinical\s+safety|limitations?)\b/i,
    /^(?:\d+\.?\s*)?(conclusion|recommendations?)\b/i,
    /^(?:\d+\.?\s*)?(references?|bibliography|literature\s+cited)\b/i,
  ];

  let currentHeading = "Manuscript Overview";
  let currentPage: number | null = pages[0]?.pageNumber || 1;
  let currentLines: string[] = [];

  for (const page of pages) {
    const lines = page.text.split(/\n+/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const isHeading =
        trimmed.length <= 90 &&
        headingPatterns.some((regex) => regex.test(trimmed));

      if (isHeading) {
        if (currentLines.length > 0) {
          sections.push({
            heading: currentHeading,
            content: currentLines.join("\n").trim(),
            pageNumber: currentPage,
          });
          currentLines = [];
        }
        currentHeading = trimmed;
        currentPage = page.pageNumber;
      } else {
        if (currentLines.length === 0) {
          currentPage = page.pageNumber;
        }
        currentLines.push(trimmed);
      }
    }
  }

  if (currentLines.length > 0) {
    sections.push({
      heading: currentHeading,
      content: currentLines.join("\n").trim(),
      pageNumber: currentPage,
    });
  }

  return sections;
}

/**
 * Extract supported text from the project's uploaded manuscript (PDF or DOCX)
 * or fallback to structured manuscript metadata in MySQL.
 */
export async function extractManuscriptTextForProject(
  projectId: number,
  snapshotManuscript?: any
): Promise<ManuscriptExtractionResult> {
  const warnings: string[] = [];
  const dbManuscript = await getManuscriptRecord(projectId);
  const manuscript = dbManuscript || snapshotManuscript || null;

  if (!manuscript) {
    return {
      extracted: false,
      fileName: null,
      fileType: "none",
      pageCount: 0,
      pages: [],
      sections: [],
      fullText: "",
      summarizedForPrompt: "No research manuscript file has been uploaded.",
      warnings: ["No research manuscript record found."],
    };
  }

  const fileName: string | null = manuscript.fileName || snapshotManuscript?.fileName || null;
  let storagePath: string | null = manuscript.storagePath || snapshotManuscript?.storagePath || null;

  // Verify if storagePath exists on disk, or find latest file in storage/manuscripts/project-:id
  let fileBuffer: Buffer | null = null;
  if (storagePath) {
    try {
      fileBuffer = await fs.readFile(/*turbopackIgnore: true*/ storagePath);
    } catch {
      fileBuffer = null;
    }
  }

  if (!fileBuffer) {
    try {
      const dir = getManuscriptStorageDir(projectId);
      const entries = await fs.readdir(/*turbopackIgnore: true*/ dir);
      const docFiles = entries
        .filter((f) => f.toLowerCase().endsWith(".pdf") || f.toLowerCase().endsWith(".docx"))
        .sort()
        .reverse();
      if (docFiles.length > 0) {
        storagePath = path.join(/*turbopackIgnore: true*/ dir, docFiles[0]);
        fileBuffer = await fs.readFile(/*turbopackIgnore: true*/ storagePath);
      }
    } catch {
      fileBuffer = null;
    }
  }

  let pages: ExtractedManuscriptPage[] = [];
  let fullText = "";
  let fileType: "pdf" | "docx" | "metadata_only" | "none" = "none";

  if (fileBuffer && fileBuffer.length > 0) {
    const ext = path.extname(fileName || storagePath || "").toLowerCase();
    const isPdf =
      ext === ".pdf" ||
      manuscript.mimeType === "application/pdf" ||
      fileBuffer.subarray(0, 5).toString("ascii") === "%PDF-";
    const isDocx =
      ext === ".docx" ||
      manuscript.mimeType?.includes("wordprocessingml") ||
      (fileBuffer[0] === 0x50 && fileBuffer[1] === 0x4b);

    try {
      if (isPdf) {
        fileType = "pdf";
        const res = extractTextFromPdfBuffer(fileBuffer);
        pages = res.pages;
        fullText = res.fullText;
      } else if (isDocx) {
        fileType = "docx";
        const res = extractTextFromDocxBuffer(fileBuffer);
        pages = res.pages;
        fullText = res.fullText;
      }
    } catch (err: any) {
      warnings.push(`Manuscript binary parsing notice: ${err?.message || "Partial extraction"}`);
    }
  }

  // Also check structured text columns on research_manuscripts if binary stream had no text
  if (!fullText.trim()) {
    const structuredParts: string[] = [];
    if (manuscript.abstract) structuredParts.push(`Abstract:\n${manuscript.abstract}`);
    if (manuscript.introduction) structuredParts.push(`Introduction:\n${manuscript.introduction}`);
    if (manuscript.materialsMethods)
      structuredParts.push(`Materials and Methods:\n${manuscript.materialsMethods}`);
    if (manuscript.resultsDiscussion)
      structuredParts.push(`Results and Discussion:\n${manuscript.resultsDiscussion}`);
    if (manuscript.conclusion) structuredParts.push(`Conclusion:\n${manuscript.conclusion}`);
    if (manuscript.referencesText)
      structuredParts.push(`References:\n${manuscript.referencesText}`);

    if (structuredParts.length > 0) {
      fullText = sanitizeUntrustedManuscriptText(structuredParts.join("\n\n"));
      pages = [{ pageNumber: 1, text: fullText }];
      if (fileType === "none") fileType = "metadata_only";
    }
  }

  const sections = segmentManuscriptIntoSections(pages);

  // Build a concise, page-referenced summary for Together AI (capped to ~6,000 chars so long papers never overflow)
  let summarizedForPrompt = "";
  if (pages.length > 0 && fullText.trim()) {
    const pageSnippets = pages.slice(0, 12).map((p) => {
      const snippet = p.text.length > 900 ? `${p.text.slice(0, 900)}...` : p.text;
      return `[Page ${p.pageNumber}]\n${snippet}`;
    });
    summarizedForPrompt = `<untrusted_manuscript_content file="${
      fileName || "Uploaded_Manuscript"
    }" pages="${pages.length}">\n${pageSnippets.join("\n\n")}\n</untrusted_manuscript_content>`;
  } else if (fileName) {
    summarizedForPrompt = `Uploaded manuscript file "${fileName}" (${fileType.toUpperCase()}) is attached on disk, but contained no extractable machine-readable text streams (e.g., scanned image-only PDF or empty template).`;
  } else {
    summarizedForPrompt = "No uploaded research manuscript file is present.";
  }

  return {
    extracted: Boolean(fullText.trim()),
    fileName,
    fileType,
    pageCount: pages.length,
    pages,
    sections,
    fullText,
    summarizedForPrompt,
    warnings,
  };
}

