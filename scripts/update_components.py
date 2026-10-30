# Python script to update RelatedProductsSection.tsx and ProductDetailPage

related_products_tsx = '''" use client\;

import React, { useState, useMemo } from \react\;
import RecordImage from \@/components/community/RecordImage\;
import Link from \next/link\;
import {
 Package,
 ShieldCheck,
 ArrowRight,
 Info,
 Pill,
 Building,
 CheckCircle2,
 AlertCircle,
 Filter,
 Layers,
 Sparkles,
 Calendar,
} from \lucide-react\;

export interface RelatedProductItem {
 id: string;
 slug: string;
 name: string;
 brandName: string;
 manufacturer: string;
 productType: string;
 productClassification?: string | null;
 dosageForm: string;
 dosageStrength?: string | null;
 isMultiIngredient?: number | boolean | null;
 imageUrl?: string | null;
 image_path?: string | null;
 image_verified?: number | boolean | null;
 image_source?: string | null;
 registrationNumber?: string | null;
 registrationStatus?: string | null;
 regulatoryAgency?: string | null;
 issuanceDate?: string | null;
 expiryDate?: string | null;
 ingredientsList?: string | null;
}

interface RelatedProductsSectionProps {
 plantName: string;
 products: RelatedProductItem[];
}

export default function RelatedProductsSection({
 plantName,
 products = [],
}: RelatedProductsSectionProps) {
 const [selectedCategory, setSelectedCategory] = useState<string>(\ALL\);
 const [onlyActive, setOnlyActive] = useState<boolean>(false);
 const [selectedManufacturer, setSelectedManufacturer] = useState<string>(\ALL\);
 const [selectedDosageForm, setSelectedDosageForm] = useState<string>(\ALL\);

 const manufacturers = useMemo(() => {
 const set = new Set<string>();
 products.forEach((p) => {
 if (p.manufacturer) set.add(p.manufacturer.trim());
 });
 return Array.from(set).sort();
 }, [products]);

 const dosageForms = useMemo(() => {
 const set = new Set<string>();
 products.forEach((p) => {
 if (p.dosageForm) set.add(p.dosageForm.trim());
 });
 return Array.from(set).sort();
 }, [products]);

 const getNormalizedCategory = (prod: RelatedProductItem): string => {
 const cls = (prod.productClassification || prod.productType || \\).toUpperCase();
 if (cls.includes(\HERBAL_MEDICINE\) || cls.includes(\MEDICINE\) || cls.includes(\DRUG\)) {
 return \HERBAL_MEDICINE\;
 }
 if (cls.includes(\TRADITIONAL\)) {
 return \TRADITIONALLY_USED_HERBAL_PRODUCT\;
 }
 if (cls.includes(\SUPPLEMENT\) || cls.includes(\FOOD\)) {
 return \FOOD_SUPPLEMENT\;
 }
 return \OTHER_REGULATED_PRODUCT\;
 };

 const filteredProducts = useMemo(() => {
 return products.filter((prod) => {
 if (selectedCategory !== \ALL\) {
 if (getNormalizedCategory(prod) !== selectedCategory) {
 return false;
 }
 }
 if (onlyActive) {
 const status = (prod.registrationStatus || \\).toUpperCase();
 if (status !== \ACTIVE\) {
 return false;
 }
 }
 if (selectedManufacturer !== \ALL\ && prod.manufacturer !== selectedManufacturer) {
 return false;
 }
 if (selectedDosageForm !== \ALL\ && prod.dosageForm !== selectedDosageForm) {
 return false;
 }
 return true;
 });
 }, [products, selectedCategory, onlyActive, selectedManufacturer, selectedDosageForm]);

 const categorizedProducts = useMemo(() => {
 const groups: {
 herbalMedicines: RelatedProductItem[];
 traditionalHerbal: RelatedProductItem[];
 foodSupplements: RelatedProductItem[];
 otherRegulated: RelatedProductItem[];
 } = {
 herbalMedicines: [],
 traditionalHerbal: [],
 foodSupplements: [],
 otherRegulated: [],
 };

 filteredProducts.forEach((p) => {
 const cat = getNormalizedCategory(p);
 if (cat === \HERBAL_MEDICINE\) {
 groups.herbalMedicines.push(p);
 } else if (cat === \TRADITIONALLY_USED_HERBAL_PRODUCT\) {
 groups.traditionalHerbal.push(p);
 } else if (cat === \FOOD_SUPPLEMENT\) {
 groups.foodSupplements.push(p);
 } else {
 groups.otherRegulated.push(p);
 }
 });

 return groups;
 }, [filteredProducts]);

 const formatDateStr = (dateVal: string | null | undefined) => {
 if (!dateVal) return null;
 try {
 const d = new Date(dateVal);
 if (isNaN(d.getTime())) return String(dateVal);
 return d.toLocaleDateString(\en-US\, { year: \numeric\, month: \short\, day: \numeric\ });
 } catch {
 return String(dateVal);
 }
 };

 return (
 <div className=\rounded-3xl bg-white border border-[#dde6df] overflow-hidden shadow-2xs p-5 sm:p-6 space-y-5\>
 {/* Dynamic Header with Product Count */}
 <div className=\flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#dde6df]\>
 <div className=\space-y-1\>
 <div className=\flex items-center gap-2\>
 <div className=\w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0\>
 <Package className=\w-4 h-4 text-emerald-700\ />
 </div>
 <h3 className=\font-heading font-extrabold text-base sm:text-lg text-[#0f2c20]\>
 Products Associated With {plantName}
 </h3>
 </div>
 <p className=\text-xs text-[#52796f] leading-relaxed\>
 Verified Philippine commercial products, pharmaceuticals, and preparations containing {plantName}.
 </p>
 </div>

 <span className=\px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-extrabold self-start sm:self-center shrink-0\>
 {products.length} {products.length === 1 ? \Verified Product\ : \Verified Products\}
 </span>
 </div>

 {/* Mandatory Non-Prescription Educational Disclaimer */}
 <div className=\p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-950 text-[11px] leading-relaxed flex items-start gap-2.5\>
 <Info className=\w-4 h-4 text-amber-700 shrink-0 mt-0.5\ />
 <p>
 <strong>Educational Reference &amp; Regulatory Transparency Notice:</strong> Products displayed
 are sourced from the Philippine FDA Verification Portal and PITAHC official databases. NatureAide
 does not endorse, advertise, or prescribe commercial products. Herbal medicines require clinical consultation;
 products classified as food supplements have <em>no approved therapeutic claims</em>.
 </p>
 </div>

 {/* When no products exist for this plant: Strict honest zero-fabrication fallback */}
 {products.length === 0 ? (
 <div className=\py-12 px-6 text-center bg-[#faf9f5] rounded-2xl border border-dashed border-[#dde6df] space-y-2\>
 <Package className=\w-8 h-8 text-[#78997f] mx-auto opacity-60\ />
 <p className=\text-sm font-semibold text-[#0f2c20]\>
 No currently verified commercial products associated with this plant were found in the NatureAide knowledge base.
 </p>
 <p className=\text-xs text-[#52796f] max-w-md mx-auto\>
 NatureAide strictly publishes products verified through authoritative Philippine regulatory sources (FDA, PITAHC). Unregistered commercial formulations or unverified marketplace listings are systematically excluded.
 </p>
 </div>
 ) : (
 <>
 {/* Interactive Filtering Controls */}
 <div className=\p-3.5 rounded-2xl bg-[#faf9f5] border border-[#dde6df] space-y-3\>
 <div className=\flex items-center justify-between text-xs font-bold text-[#0f2c20]\>
 <span className=\flex items-center gap-1.5\>
 <Filter className=\w-3.5 h-3.5 text-emerald-700\ />
 <span>Filter Verified Products</span>
 </span>
 <span className=\text-[11px] font-medium text-[#52796f]\>
 Showing {filteredProducts.length} of {products.length}
 </span>
 </div>

 {/* Category Filter Pills */}
 <div className=\flex flex-wrap gap-1.5\>
 {[
 { id: \ALL\, label: \All Categories\ },
 { id: \HERBAL_MEDICINE\, label: \Herbal Medicines\ },
 { id: \TRADITIONALLY_USED_HERBAL_PRODUCT\, label: \Traditionally Used\ },
 { id: \FOOD_SUPPLEMENT\, label: \Food Supplements\ },
 { id: \OTHER_REGULATED_PRODUCT\, label: \Other Regulated\ },
 ].map((tab) => (
 <button
 key={tab.id}
 onClick={() => setSelectedCategory(tab.id)}
 type=\button\
 className={px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer }
 >
 {tab.label}
 </button>
 ))}
 </div>

 {/* Additional Filter Dropdowns & Active Toggle */}
 <div className=\grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1\>
 {/* Active Registration Checkbox */}
 <label className=\flex items-center gap-2 p-2 rounded-xl bg-white border border-[#dde6df] text-xs text-[#0f2c20] cursor-pointer\>
 <input
 type=\checkbox\
 checked={onlyActive}
 onChange={(e) => setOnlyActive(e.target.checked)}
 className=\rounded border-[#dde6df] text-emerald-700 focus:ring-emerald-500 h-3.5 w-3.5\
 />
 <span className=\font-semibold text-[11px]\>Active Registrations Only</span>
 </label>

 {/* Manufacturer Filter */}
 <select
 value={selectedManufacturer}
 onChange={(e) => setSelectedManufacturer(e.target.value)}
 className=\p-2 rounded-xl bg-white border border-[#dde6df] text-[11px] text-[#0f2c20] font-medium focus:outline-emerald-600\
 >
 <option value=\ALL\>All Manufacturers ({manufacturers.length})</option>
 {manufacturers.map((m) => (
 <option key={m} value={m}>
 {m}
 </option>
 ))}
 </select>

 {/* Dosage Form Filter */}
 <select
 value={selectedDosageForm}
 onChange={(e) => setSelectedDosageForm(e.target.value)}
 className=\p-2 rounded-xl bg-white border border-[#dde6df] text-[11px] text-[#0f2c20] font-medium focus:outline-emerald-600\
 >
 <option value=\ALL\>All Dosage Forms ({dosageForms.length})</option>
 {dosageForms.map((d) => (
 <option key={d} value={d}>
 {d}
 </option>
 ))}
 </select>
 </div>
 </div>

 {/* Grouped Products Display by Category */}
 {filteredProducts.length === 0 ? (
 <div className=\py-8 px-4 text-center text-xs text-[#78997f] bg-[#faf9f5] rounded-2xl border border-dashed border-[#dde6df]\>
 No products match the selected filters. Try resetting the category or manufacturer filters.
 </div>
 ) : (
 <div className=\space-y-6 pt-1\>
 {/* 1. REGISTERED HERBAL MEDICINES */}
 {categorizedProducts.herbalMedicines.length > 0 && (
 <div className=\space-y-3\>
 <div className=\flex items-center justify-between\>
 <h4 className=\text-xs font-extrabold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5\>
 <ShieldCheck className=\w-4 h-4 text-emerald-700\ />
 <span>Registered Herbal Medicines ({categorizedProducts.herbalMedicines.length})</span>
 </h4>
 <span className=\text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200\>
 Approved Therapeutic Indications
 </span>
 </div>
 <div className=\grid grid-cols-1 gap-3.5\>
 {categorizedProducts.herbalMedicines.map((prod) => (
 <ProductCard key={prod.id} prod={prod} plantName={plantName} formatDateStr={formatDateStr} />
 ))}
 </div>
 </div>
 )}

 {/* 2. TRADITIONALLY USED HERBAL PRODUCTS */}
 {categorizedProducts.traditionalHerbal.length > 0 && (
 <div className=\space-y-3\>
 <div className=\flex items-center justify-between\>
 <h4 className=\text-xs font-extrabold uppercase tracking-wider text-teal-950 flex items-center gap-1.5\>
 <Pill className=\w-4 h-4 text-teal-700\ />
 <span>Traditionally Used Herbal Products ({categorizedProducts.traditionalHerbal.length})</span>
 </h4>
 <span className=\text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200\>
 Traditional Clinical Use
 </span>
 </div>
 <div className=\grid grid-cols-1 gap-3.5\>
 {categorizedProducts.traditionalHerbal.map((prod) => (
 <ProductCard key={prod.id} prod={prod} plantName={plantName} formatDateStr={formatDateStr} />
 ))}
 </div>
 </div>
 )}

 {/* 3. FOOD SUPPLEMENTS */}
 {categorizedProducts.foodSupplements.length > 0 && (
 <div className=\space-y-3\>
 <div className=\flex items-center justify-between\>
 <h4 className=\text-xs font-extrabold uppercase tracking-wider text-amber-950 flex items-center gap-1.5\>
 <Layers className=\w-4 h-4 text-amber-700\ />
 <span>Food Supplements ({categorizedProducts.foodSupplements.length})</span>
 </h4>
 <span className=\text-[10px] font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200\>
 No Approved Therapeutic Claims
 </span>
 </div>
 <div className=\grid grid-cols-1 gap-3.5\>
 {categorizedProducts.foodSupplements.map((prod) => (
 <ProductCard key={prod.id} prod={prod} plantName={plantName} formatDateStr={formatDateStr} />
 ))}
 </div>
 </div>
 )}

 {/* 4. OTHER VERIFIED PRODUCTS */}
 {categorizedProducts.otherRegulated.length > 0 && (
 <div className=\space-y-3\>
 <div className=\flex items-center justify-between\>
 <h4 className=\text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5\>
 <Sparkles className=\w-4 h-4 text-slate-700\ />
 <span>Other Regulated Herbal Products ({categorizedProducts.otherRegulated.length})</span>
 </h4>
 <span className=\text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full\>
 Topical / Cosmetic / Household
 </span>
 </div>
 <div className=\grid grid-cols-1 gap-3.5\>
 {categorizedProducts.otherRegulated.map((prod) => (
 <ProductCard key={prod.id} prod={prod} plantName={plantName} formatDateStr={formatDateStr} />
 ))}
 </div>
 </div>
 )}
 </div>
 )}
 </>
 )}
 </div>
 );
}

function ProductCard({
 prod,
 plantName,
 formatDateStr,
}: {
 prod: RelatedProductItem;
 plantName: string;
 formatDateStr: (dateVal: string | null | undefined) => string | null;
}) {
 const isFoodSupplement = (prod.productClassification || prod.productType || \\).toUpperCase().includes(\SUPPLEMENT\) ||
 (prod.productClassification || \\).toUpperCase().includes(\FOOD\);
 const isMulti = Boolean(prod.isMultiIngredient);
 const isActive = (prod.registrationStatus || \\).toUpperCase() === \ACTIVE\;

 return (
 <div className=\p-4 sm:p-5 rounded-2xl bg-[#faf9f5] border border-[#dde6df] hover:border-emerald-300 transition-all space-y-3 shadow-2xs\>
 <div className=\flex items-start gap-3.5\>
 <div className=\w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-white border border-[#dde6df] overflow-hidden shrink-0 relative flex items-center justify-center\>
 <RecordImage
 kind=\product\
 src={prod.image_verified ? (prod.image_path || prod.imageUrl) : null}
 isVerified={Boolean(prod.image_verified)}
 alt={prod.name}
 sizes=\80px\
 />
 </div>

 <div className=\space-y-1 flex-1 min-w-0\>
 <div className=\flex flex-wrap items-center gap-1.5\>
 <span
 className={px-2 py-0.5 rounded-full text-[10px] font-extrabold }
 >
 {prod.productClassification || prod.productType}
 </span>

 {prod.dosageStrength && (
 <span className=\px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200 text-[10px] font-bold\>
 {prod.dosageStrength}
 </span>
 )}
 <span className=\px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 text-[10px] font-bold\>
 {prod.dosageForm}
 </span>

 {isMulti && (
 <span className=\px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-900 text-[10px] font-extrabold\>
 MULTI-INGREDIENT PRODUCT
 </span>
 )}
 </div>

 <h5 className=\font-heading font-extrabold text-sm sm:text-base text-[#0f2c20] leading-snug\>
 {prod.name}
 </h5>

 <p className=\text-xs text-[#52796f] flex items-center gap-1\>
 <Building className=\w-3 h-3 text-[#78997f]\ />
 <span>
 <strong>{prod.brandName}</strong> &bull; {prod.manufacturer}
 </span>
 </p>

 {isMulti && prod.ingredientsList && (
 <div className=\p-2 rounded-xl bg-indigo-50/50 border border-indigo-100 text-[11px] text-indigo-950 leading-tight space-y-0.5\>
 <span className=\font-bold block\>Active Herbal Ingredients:</span>
 <p className=\text-[#3d4a45]\>{prod.ingredientsList}</p>
 <p className=\text-[10px] text-indigo-800 italic\>
 *Note: Observed clinical effect cannot be attributed exclusively to {plantName}.
 </p>
 </div>
 )}

 {isFoodSupplement && (
 <div className=\p-1.5 px-2 rounded-lg bg-amber-50 border border-amber-200 text-[10px] font-bold text-amber-900 tracking-wide uppercase inline-block\>
 NO APPROVED THERAPEUTIC CLAIMS
 </div>
 )}
 </div>
 </div>

 {prod.registrationNumber && (
 <div className=\px-3 py-2 rounded-xl bg-white border border-[#dde6df] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#3d4a45]\>
 <div className=\flex items-center gap-1.5 truncate\>
 <ShieldCheck className=\w-3.5 h-3.5 text-emerald-700 shrink-0\ />
 <span className=\font-bold text-[#0f2c20]\>
 {prod.regulatoryAgency || \FDA Philippines\}:
 </span>
 <span className=\font-mono text-slate-800 font-bold truncate\>
 {prod.registrationNumber}
 </span>
 </div>

 <div className=\flex items-center gap-2\>
 {prod.expiryDate && (
 <span className=\text-[10px] text-[#52796f] flex items-center gap-1\>
 <Calendar className=\w-3 h-3\ />
 <span>Exp: {formatDateStr(prod.expiryDate)}</span>
 </span>
 )}
 <span
 className={ ext-[10px] font-extrabold px-2 py-0.5 rounded-full }
 >
 {prod.registrationStatus || \UNKNOWN\}
 </span>
 </div>
 </div>
 )}

 <div className=\pt-1\>
 <Link
 href={/community/products/}
 className=\w-full py-2.5 px-4 rounded-xl bg-[#0f2c20] hover:bg-[#1e5c44] text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer\
 >
 <span>View Product Details &amp; Evidence</span>
 <ArrowRight className=\w-3.5 h-3.5 text-emerald-300\ />
 </Link>
 </div>
 </div>
 );
}
'''

with open('src/components/community/RelatedProductsSection.tsx', 'w', encoding='utf-8') as f:
 f.write(related_products_tsx)

print('Updated RelatedProductsSection.tsx successfully')
