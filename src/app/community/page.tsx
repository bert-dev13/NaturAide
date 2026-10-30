import React from "react";
import Link from "next/link";
import RecordImage from "@/components/community/RecordImage";
import ProductImageBadge from "@/components/community/ProductImageBadge";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import pool from "@/lib/db";
import { getLatestUserScreening } from "@/lib/safety-server";
import MobileAppHeader from "@/components/community/MobileAppHeader";
import PlantCard from "@/components/community/PlantCard";
import SectionHeader from "@/components/community/SectionHeader";
import SafetyNotice from "@/components/community/SafetyNotice";
import {
  Search,
  BookOpen,
  Coffee,
  Sparkles,
  ChevronRight,
  BookmarkCheck,
  Leaf,
  Pill,
  ShieldCheck,
  Package,
  ArrowRight,
  Bot,
  Bookmark,
  HeartPulse,
} from "lucide-react";

export const instant = false;

export default async function CommunityHomePage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?redirect=/community");
  }

  // Check valid health screening in MySQL
  const screening = await getLatestUserScreening(session.id);
  if (!screening) {
    redirect("/community/screening?force=true");
  }

  if (screening.evaluationResult === "PROFESSIONAL_GUIDANCE_REQUIRED") {
    redirect("/community/guidance");
  }

  const userId = session.id;
  const firstName = session.firstName || session.name?.split(" ")[0] || "Friend";

  let popularPlants: any[] = [];
  let herbalProducts: any[] = [];
  let savedPlants: any[] = [];
  let savedGuides: any[] = [];
  let savedProducts: any[] = [];

  try {
    // Fetch popular DOH/PITAHC plants from MySQL
    const [plants]: any = await pool.query(
      `SELECT id, slug, commonName, scientificName, category, simpleUse, badge, imageUrl, safetyNote
       FROM plants WHERE is_pitahc = 1 ORDER BY commonName ASC`
    );
    popularPlants = plants || [];
  } catch (err) {
    console.error("Error fetching plants for Community Home:", err);
    popularPlants = [];
  }

  try {
    // Fetch published herbal products from MySQL with linked plant and registration info
    const [products]: any = await pool.query(
      `SELECT hp.id, hp.slug, hp.name, hp.brandName, hp.manufacturer, hp.productType, hp.dosageForm,
              hp.imageUrl, hp.image_path, hp.image_type, hp.image_verified, hp.image_source,
              lp.plantName, lp.plantSlug,
              prr.registrationNumber, prr.regulatoryAgency
       FROM herbal_products hp
       LEFT JOIN (
         SELECT productId, MIN(registrationNumber) as registrationNumber, MIN(regulatoryAgency) as regulatoryAgency
         FROM product_regulatory_records
         GROUP BY productId
       ) prr ON hp.id = prr.productId
       LEFT JOIN (
         SELECT pp.productId, MIN(pl.commonName) as plantName, MIN(pl.slug) as plantSlug
         FROM product_plants pp
         JOIN plants pl ON pp.plantId = pl.id
         GROUP BY pp.productId
       ) lp ON hp.id = lp.productId
       WHERE hp.publicationStatus = 'PUBLISHED' AND hp.isPublished = 1
       ORDER BY hp.image_verified DESC, hp.name ASC
       LIMIT 6`
    );
    herbalProducts = products || [];
  } catch (err) {
    console.error("Error fetching herbal products for Community Home:", err);
    herbalProducts = [];
  }

  if (userId) {
    try {
      const [savedP]: any = await pool.query(
        `SELECT p.id, p.slug, p.commonName, p.scientificName, p.category, p.badge, p.imageUrl, p.simpleUse
         FROM saved_plants sp
         JOIN plants p ON sp.plantId = p.id
         WHERE sp.userId = ?
         ORDER BY sp.createdAt DESC
         LIMIT 4`,
        [userId]
      );
      savedPlants = savedP || [];

      const [savedG]: any = await pool.query(
        `SELECT pg.id, pg.title, pg.category, p.commonName as plantName
         FROM saved_preparation_guides spg
         JOIN preparation_guides pg ON spg.guideId = pg.id
         LEFT JOIN plants p ON pg.plantId = p.id
         WHERE spg.userId = ?
         ORDER BY spg.createdAt DESC
         LIMIT 3`,
        [userId]
      );
      savedGuides = savedG || [];

      const [savedPr]: any = await pool.query(
        `SELECT hp.id, hp.slug, hp.name, hp.brandName, hp.dosageForm, hp.imageUrl, hp.image_path, hp.image_type, hp.image_verified
         FROM saved_products sp
         JOIN herbal_products hp ON sp.productId = hp.id
         WHERE sp.userId = ?
         ORDER BY sp.createdAt DESC
         LIMIT 4`,
        [userId]
      );
      savedProducts = savedPr || [];
    } catch (err) {
      console.error("Error fetching user saved guides:", err);
      savedPlants = [];
      savedGuides = [];
      savedProducts = [];
    }
  }

  const totalSavedCount = savedPlants.length + savedGuides.length + savedProducts.length;

  return (
    <div className="flex flex-col min-h-screen bg-[#faf7f2] text-[#0f2c20]">
      {/* 1. TOP MOBILE-APP HEADER */}
      <MobileAppHeader user={session} />

      {/* 2. MAIN SCROLLABLE WRAPPER (max-w-4xl) */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-3.5 sm:px-6 py-4 space-y-6 pb-28">
        {/* ==================================================================== */}
        {/* 1. WELCOME HERO CARD & SEARCH                                        */}
        {/* ==================================================================== */}
        <section className="p-5 sm:p-7 rounded-3xl bg-gradient-to-br from-[#0f2c20] via-[#164a35] to-[#0a1e16] text-white shadow-md relative overflow-hidden space-y-4">
          {/* Subtle botanical decorative ambient glow */}
          <div className="absolute -top-12 -right-12 w-56 h-56 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-teal-400/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-300 text-xs font-bold border border-emerald-400/20 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>DOH/PITAHC Botanical Directory &amp; Evidence Base</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-white leading-tight">
              Kumusta, {firstName}!
            </h1>

            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed max-w-xl">
              Explore Philippine medicinal plants, verified traditional preparations, and
              commercial herbal products backed by peer-reviewed science.
            </p>
          </div>

          {/* Search Herbal Information Input */}
          <div className="relative z-10 pt-1">
            <form
              action="/community/herbal-guide"
              method="GET"
              className="relative flex items-center"
            >
              <Search className="absolute left-4 w-5 h-5 text-[#52796f] pointer-events-none" />
              <input
                type="text"
                name="q"
                placeholder="Search medicinal plants, products, or health concerns..."
                className="w-full bg-white text-[#0f2c20] placeholder-[#6b7c76] text-xs sm:text-sm pl-11 pr-24 py-3.5 sm:py-4 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-emerald-400/30 transition-all font-medium border border-transparent focus:border-emerald-500"
              />
              <button
                type="submit"
                className="absolute right-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-700 to-[#0f2c20] hover:brightness-110 active:scale-95 text-white text-xs font-extrabold transition-all cursor-pointer shadow-2xs"
              >
                Search
              </button>
            </form>
          </div>

          {/* Quick Search Chips - Single Row */}
          <div className="relative z-10 pt-1 flex items-center gap-1.5 text-[11px] overflow-x-auto whitespace-nowrap scrollbar-none pb-0.5">
            <span className="text-emerald-200/90 font-bold pr-1 shrink-0">Popular:</span>
            <Link
              href="/community/herbal-guide?filter=pitahc"
              className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-emerald-100 font-semibold transition-all shrink-0 active:scale-95"
            >
              🌿 DOH 10 Plants
            </Link>
            <Link
              href="/community/herbal-guide?q=cough"
              className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-emerald-100 font-semibold transition-all shrink-0 active:scale-95"
            >
              💨 Cough &amp; Colds
            </Link>
            <Link
              href="/community/herbal-guide?q=fungal"
              className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-emerald-100 font-semibold transition-all shrink-0 active:scale-95"
            >
              🧴 Skin &amp; Antifungal
            </Link>
            <Link
              href="/community/herbal-guide?q=kidney"
              className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-emerald-100 font-semibold transition-all shrink-0 active:scale-95"
            >
              💧 Kidney &amp; Urinary
            </Link>
            <Link
              href="/community/herbal-guide?tab=products"
              className="px-2.5 py-1 rounded-full bg-emerald-500/30 hover:bg-emerald-500/40 text-emerald-100 font-bold transition-all border border-emerald-400/30 shrink-0 active:scale-95"
            >
              💊 Herbal Products
            </Link>
          </div>
        </section>

        {/* ==================================================================== */}
        {/* 2. HERBAL GUIDES & TOOLS (QUICK ACTIONS 4-GRID)                      */}
        {/* ==================================================================== */}
        <section className="space-y-3">
          <SectionHeader
            title="Herbal Guides & Tools"
            subtitle="Access verified botanical knowledge and interactive guides"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Action 1: Herbal Guide */}
            <Link
              href="/community/herbal-guide"
              className="p-4 sm:p-5 rounded-3xl bg-white border border-[#dde6df] hover:border-emerald-500 shadow-2xs hover:shadow-xs transition-all active:scale-[0.98] group flex flex-col justify-between space-y-3.5 cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-900 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                  <BookOpen className="w-5 h-5 text-emerald-800" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold uppercase shrink-0">
                  Directory
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="font-heading font-black text-[#0f2c20] text-sm sm:text-base tracking-tight leading-snug">
                  Herbal Guide
                </h3>
                <p className="text-xs text-[#52796f] line-clamp-2 leading-relaxed font-medium">
                  12 plants &amp; 40 commercial products
                </p>
              </div>

              <div className="pt-1 flex items-center justify-between text-xs font-bold text-emerald-800 group-hover:text-emerald-950">
                <span>Explore Directory</span>
                <ChevronRight className="w-4 h-4 text-emerald-700 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            {/* Action 2: Traditional Preparation */}
            <Link
              href="/community/preparation-guide"
              className="p-4 sm:p-5 rounded-3xl bg-white border border-[#dde6df] hover:border-amber-500 shadow-2xs hover:shadow-xs transition-all active:scale-[0.98] group flex flex-col justify-between space-y-3.5 cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                  <Coffee className="w-5 h-5 text-amber-800" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-extrabold uppercase shrink-0">
                  Steps
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="font-heading font-black text-[#0f2c20] text-sm sm:text-base tracking-tight leading-snug">
                  Preparation
                </h3>
                <p className="text-xs text-[#52796f] line-clamp-2 leading-relaxed font-medium">
                  Teas, decoctions &amp; poultices
                </p>
              </div>

              <div className="pt-1 flex items-center justify-between text-xs font-bold text-amber-800 group-hover:text-amber-950">
                <span>View Methods</span>
                <ChevronRight className="w-4 h-4 text-amber-700 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            {/* Action 3: Ask NaturAide */}
            <Link
              href="/community/ask"
              className="p-4 sm:p-5 rounded-3xl bg-white border border-[#dde6df] hover:border-teal-500 shadow-2xs hover:shadow-xs transition-all active:scale-[0.98] group flex flex-col justify-between space-y-3.5 cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="w-11 h-11 rounded-2xl bg-teal-100 text-teal-900 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                  <Bot className="w-5 h-5 text-teal-800" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-[10px] font-extrabold uppercase shrink-0">
                  AI Assistant
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="font-heading font-black text-[#0f2c20] text-sm sm:text-base tracking-tight leading-snug">
                  Ask NaturAide
                </h3>
                <p className="text-xs text-[#52796f] line-clamp-2 leading-relaxed font-medium">
                  Safety guidance &amp; uses
                </p>
              </div>

              <div className="pt-1 flex items-center justify-between text-xs font-bold text-teal-800 group-hover:text-teal-950">
                <span>Chat Assistant</span>
                <ChevronRight className="w-4 h-4 text-teal-700 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            {/* Action 4: My Saved Guide */}
            <Link
              href="/community/my-guide"
              className="p-4 sm:p-5 rounded-3xl bg-white border border-[#dde6df] hover:border-indigo-500 shadow-2xs hover:shadow-xs transition-all active:scale-[0.98] group flex flex-col justify-between space-y-3.5 cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-900 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                  <BookmarkCheck className="w-5 h-5 text-indigo-800" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 text-[10px] font-extrabold uppercase shrink-0">
                  {totalSavedCount > 0 ? `${totalSavedCount} Saved` : "Bookmarks"}
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="font-heading font-black text-[#0f2c20] text-sm sm:text-base tracking-tight leading-snug">
                  My Guide
                </h3>
                <p className="text-xs text-[#52796f] line-clamp-2 leading-relaxed font-medium">
                  Bookmarked plants &amp; items
                </p>
              </div>

              <div className="pt-1 flex items-center justify-between text-xs font-bold text-indigo-800 group-hover:text-indigo-950">
                <span>View Saved</span>
                <ChevronRight className="w-4 h-4 text-indigo-700 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          </div>
        </section>

        {/* ==================================================================== */}
        {/* 3. EXPLORE MEDICINAL PLANTS                                          */}
        {/* ==================================================================== */}
        <section className="space-y-3">
          <SectionHeader
            title="Explore Medicinal Plants"
            subtitle="Philippine DOH/PITAHC verified medicinal plants with documented evidence"
            seeAllHref="/community/herbal-guide?tab=plants"
            seeAllLabel="View All Plants"
          />

          {popularPlants.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-2 pt-1 -mx-3.5 px-3.5 sm:-mx-6 sm:px-6 snap-x snap-mandatory scrollbar-none">
              {popularPlants.map((plant: any) => (
                <div key={plant.id} className="snap-start shrink-0">
                  <PlantCard
                    id={plant.id}
                    slug={plant.slug}
                    commonName={plant.commonName}
                    scientificName={plant.scientificName}
                    category={plant.category}
                    simpleUse={plant.simpleUse}
                    badge={plant.badge}
                    imageUrl={plant.imageUrl}
                    safetyNote={plant.safetyNote}
                    horizontal={true}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-3xl bg-white border border-[#dde6df] text-center space-y-2 shadow-2xs">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
                <Leaf className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-extrabold text-sm text-[#0f2c20]">
                No medicinal plants cataloged yet
              </h3>
              <p className="text-xs text-[#52796f] max-w-sm mx-auto">
                Botanical researchers have not yet published plant profiles to the database.
              </p>
            </div>
          )}
        </section>

        {/* ==================================================================== */}
        {/* 4. COMMERCIAL HERBAL PRODUCTS                                        */}
        {/* ==================================================================== */}
        <section className="space-y-3">
          <SectionHeader
            title="Commercial Herbal Products"
            subtitle="Commercial preparations with verifiable CPR records and scientific evidence"
            seeAllHref="/community/herbal-guide?tab=products"
            seeAllLabel="View All 40 Products"
          />

          {herbalProducts.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-2 pt-1 -mx-3.5 px-3.5 sm:-mx-6 sm:px-6 snap-x snap-mandatory scrollbar-none">
              {herbalProducts.map((product: any) => (
                <div
                  key={product.id}
                  className="snap-start shrink-0 w-64 sm:w-72 bg-white rounded-3xl overflow-hidden border border-[#dde6df] hover:border-emerald-500 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group active:scale-[0.99]"
                >
                  <div className="relative h-40 w-full bg-[#faf9f5] border-b border-[#dde6df] overflow-hidden flex items-center justify-center p-3">
                    <RecordImage
                      kind="product"
                      src={product.image_path || product.imageUrl}
                      isVerified={Boolean(product.image_verified)}
                      imageType={product.image_type}
                      alt={product.name}
                      sizes="(max-width: 640px) 256px, 288px"
                      className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Top Badges */}
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1 z-10">
                      {product.dosageForm ? (
                        <span className="px-2 py-0.5 rounded-full bg-white/95 backdrop-blur-md text-[10px] font-extrabold text-[#0f2c20] shadow-2xs flex items-center gap-1 border border-slate-200">
                          <Pill className="w-2.5 h-2.5 text-emerald-700" />
                          <span>{product.dosageForm}</span>
                        </span>
                      ) : (
                        <span />
                      )}

                      <ProductImageBadge imageType={product.image_type} />
                    </div>

                    {/* Linked Herb pill */}
                    {product.plantName && (
                      <div className="absolute bottom-2 left-2.5 right-2.5 z-10">
                        <span className="text-[10px] font-bold text-[#0f2c20] bg-white/95 border border-[#dde6df] px-2 py-0.5 rounded-full backdrop-blur-md shadow-2xs flex items-center gap-1 w-fit truncate max-w-full">
                          <Leaf className="w-2.5 h-2.5 text-emerald-700 shrink-0" />
                          <span className="truncate">Herb: {product.plantName}</span>
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-900 border border-teal-200 text-[9px] font-extrabold">
                          {product.productType || "HERBAL_MEDICINE"}
                        </span>
                        {product.registrationNumber && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[9px] font-bold">
                            ✓ Registered
                          </span>
                        )}
                      </div>

                      <h4 className="font-heading font-black text-sm text-[#0f2c20] line-clamp-2 leading-snug">
                        {product.name}
                      </h4>

                      <p className="text-xs text-[#52796f] truncate font-medium">
                        {product.brandName || product.manufacturer}
                      </p>
                    </div>

                    <Link
                      href={`/community/products/${product.slug || product.id}`}
                      className="inline-flex items-center justify-between w-full px-3.5 py-2.5 rounded-2xl bg-[#0f2c20] hover:bg-[#1a4b36] active:scale-95 text-white text-xs font-black transition-all shadow-2xs cursor-pointer"
                    >
                      <span>View Product &amp; Evidence</span>
                      <ChevronRight className="w-3.5 h-3.5 text-emerald-300" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-3xl bg-white border border-[#dde6df] text-center space-y-2 shadow-2xs">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-extrabold text-sm text-[#0f2c20]">
                No commercial herbal products cataloged yet
              </h3>
              <p className="text-xs text-[#52796f] max-w-sm mx-auto">
                Verified commercial products linked to medicinal plants will appear here once registered.
              </p>
            </div>
          )}
        </section>

        {/* ==================================================================== */}
        {/* 5. MY SAVED REMEDIES & PRODUCTS                                      */}
        {/* ==================================================================== */}
        <section className="space-y-3">
          <SectionHeader
            title="My Saved Guide"
            subtitle="Quick access to your bookmarked plants, preparations, and commercial products"
            seeAllHref="/community/my-guide"
            seeAllLabel="Manage Saved"
          />

          {savedPlants.length === 0 && savedGuides.length === 0 && savedProducts.length === 0 ? (
            <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#dde6df] text-center space-y-3 shadow-2xs">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto">
                <BookmarkCheck className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="space-y-1">
                <h3 className="font-heading font-black text-sm sm:text-base text-[#0f2c20]">
                  No saved remedies or products yet
                </h3>
                <p className="text-xs text-[#52796f] max-w-sm mx-auto leading-relaxed">
                  Bookmark plants, preparation guides, and herbal products while browsing to keep them
                  handy in your personal wellness guide.
                </p>
              </div>
              <Link
                href="/community/herbal-guide"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#0f2c20] text-white text-xs font-black hover:bg-[#1a4b36] transition-all shadow-2xs"
              >
                <span>Explore Herbal Guide</span>
                <ChevronRight className="w-3.5 h-3.5 text-emerald-300" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Saved Plants */}
              {savedPlants.slice(0, 2).map((sp: any) => (
                <Link
                  key={sp.id}
                  href={`/community/plants/${sp.slug || sp.id}`}
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-[#dde6df] hover:border-emerald-500 shadow-2xs group transition-all"
                >
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-[#edf2ee] shrink-0 border border-[#dde6df]">
                    <RecordImage kind="plant" src={sp.imageUrl} alt={sp.commonName} sizes="56px" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] font-black text-emerald-800 uppercase tracking-wider block">
                      Medicinal Plant
                    </span>
                    <h4 className="font-heading font-black text-sm text-[#0f2c20] truncate">
                      {sp.commonName}
                    </h4>
                    <p className="text-xs text-[#52796f] italic truncate">{sp.scientificName}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#78997f] group-hover:text-[#0f2c20] shrink-0" />
                </Link>
              ))}

              {/* Saved Products */}
              {savedProducts.slice(0, 2).map((spr: any) => (
                <Link
                  key={spr.id}
                  href={`/community/products/${spr.slug || spr.id}`}
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-[#dde6df] hover:border-teal-500 shadow-2xs group transition-all"
                >
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-[#faf9f5] shrink-0 border border-[#dde6df] p-1 flex items-center justify-center">
                    <RecordImage
                      kind="product"
                      src={spr.image_path || spr.imageUrl}
                      alt={spr.name}
                      isVerified={Boolean(spr.image_verified)}
                      imageType={spr.image_type}
                      sizes="56px"
                      className="object-contain w-full h-full"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] font-black text-teal-800 uppercase tracking-wider block">
                      Herbal Product
                    </span>
                    <h4 className="font-heading font-black text-sm text-[#0f2c20] truncate">
                      {spr.name}
                    </h4>
                    <p className="text-xs text-[#52796f] truncate">{spr.dosageForm}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#78997f] group-hover:text-[#0f2c20] shrink-0" />
                </Link>
              ))}

              {/* Saved Preparation Guides */}
              {savedGuides.slice(0, 2).map((sg: any) => (
                <Link
                  key={sg.id}
                  href="/community/preparation-guide"
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-[#dde6df] hover:border-amber-500 shadow-2xs group transition-all"
                >
                  <div className="w-14 h-14 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200">
                    <Coffee className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] font-black text-amber-800 uppercase tracking-wider block">
                      Preparation Method
                    </span>
                    <h4 className="font-heading font-black text-sm text-[#0f2c20] truncate">
                      {sg.title}
                    </h4>
                    <p className="text-xs text-[#52796f] truncate">
                      {sg.plantName || sg.category}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#78997f] group-hover:text-[#0f2c20] shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ==================================================================== */}
        {/* 6. EDUCATIONAL SAFETY NOTICE                                         */}
        {/* ==================================================================== */}
        <section className="pt-1">
          <SafetyNotice />
        </section>
      </main>
    </div>
  );
}
