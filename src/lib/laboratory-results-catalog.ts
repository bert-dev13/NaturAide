/**
 * Suggested laboratory test catalog for Paper Submission → Laboratory Results.
 * Options are selectable helpers, not mandatory tests for every formulation.
 */

export type LabTestCategoryKey =
  | "PHYSICAL_ORGANOLEPTIC"
  | "PHYSICOCHEMICAL"
  | "PHYTOCHEMICAL"
  | "MICROBIOLOGICAL"
  | "STABILITY"
  | "ANTIOXIDANT"
  | "OTHER_CUSTOM";

export interface LabTestCategory {
  key: LabTestCategoryKey;
  label: string;
  tests: string[];
}

export const LAB_TEST_CATEGORIES: LabTestCategory[] = [
  {
    key: "PHYSICAL_ORGANOLEPTIC",
    label: "Physical & Organoleptic",
    tests: ["Color", "Odor", "Appearance", "Texture", "Other"],
  },
  {
    key: "PHYSICOCHEMICAL",
    label: "Physicochemical",
    tests: ["pH", "Viscosity", "Moisture Content", "Solubility", "Density", "Other"],
  },
  {
    key: "PHYTOCHEMICAL",
    label: "Phytochemical",
    tests: [
      "Total Phenolic Content (TPC)",
      "Total Flavonoid Content (TFC)",
      "Alkaloid Test",
      "Flavonoid Test",
      "Saponin Test",
      "Tannin Test",
      "Other",
    ],
  },
  {
    key: "MICROBIOLOGICAL",
    label: "Microbiological",
    tests: [
      "Total Plate Count",
      "Yeast and Mold Count",
      "E. coli Test",
      "Staphylococcus aureus Test",
      "Other",
    ],
  },
  {
    key: "STABILITY",
    label: "Stability Testing",
    tests: [
      "Accelerated Stability",
      "Temperature Stability",
      "Physical Stability",
      "Other",
    ],
  },
  {
    key: "ANTIOXIDANT",
    label: "Antioxidant",
    tests: ["DPPH Assay", "FRAP Assay", "ABTS Assay", "Other"],
  },
  {
    key: "OTHER_CUSTOM",
    label: "Other / Custom Test",
    tests: ["Other"],
  },
];

export const COMMON_LAB_UNITS = [
  "",
  "%",
  "mg/g",
  "mg GAE/g",
  "mg QE/g",
  "CFU/g",
  "CFU/mL",
  "cP",
  "mPa·s",
  "g/mL",
  "mm",
  "°C",
  "Pass / Fail (manual)",
  "N/A",
] as const;

export function getLabCategoryLabel(key: string): string {
  return LAB_TEST_CATEGORIES.find((c) => c.key === key)?.label || key || "Other";
}

export function getTestsForCategory(key: string): string[] {
  return LAB_TEST_CATEGORIES.find((c) => c.key === key)?.tests || ["Other"];
}
