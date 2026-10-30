const fs = require('fs');

const path = 'src/components/reviewer/ReviewerHeader.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add Image to imports
code = code.replace(
  'import Link from "next/link";',
  'import Link from "next/link";\nimport Image from "next/image";'
);

// 2. Add Logo to top bar
const oldBlock = `          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-900 border border-teal-200 text-xs font-bold">`;

const newBlock = `          <Link href="/reviewer" className="flex items-center gap-2.5 group">
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden bg-white p-0.5 border border-[#dde6df] shadow-2xs group-hover:scale-105 transition-transform shrink-0">
              <Image
                src="/images/nature-logo.png"
                alt="NatureAide logo"
                fill
                className="object-contain p-0.5"
                priority
              />
            </div>
            <span className="font-heading font-extrabold text-base tracking-tight text-[#0f2c20] hidden sm:inline">
              NatureAide
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-900 border border-teal-200 text-xs font-bold">`;

code = code.replace(oldBlock, newBlock);
fs.writeFileSync(path, code, 'utf8');
console.log('Successfully updated ReviewerHeader.tsx');
