const fs = require('fs');

const path = 'src/components/community/PlantDetailSections.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add Bot to lucide-react import
code = code.replace(
  '  BookOpen,\n  ExternalLink,\n} from "lucide-react";',
  '  BookOpen,\n  ExternalLink,\n  Bot,\n} from "lucide-react";'
);

// 2. Add the contextual Ask NatureAide button in the sticky bottom container
const oldStickyBottom = `      {/* 5. STICKY BOTTOM ACTION CTA */}
      <div className="sticky bottom-16 sm:bottom-20 z-30 px-4 sm:px-6 pt-2 pb-1 bg-gradient-to-t from-[#faf9f5] via-[#faf9f5]/90 to-transparent pointer-events-none">
        <button
          onClick={handleToggleSave}`;

const newStickyBottom = `      {/* 5. STICKY BOTTOM ACTION CTA */}
      <div className="sticky bottom-16 sm:bottom-20 z-30 px-4 sm:px-6 pt-2 pb-1 bg-gradient-to-t from-[#faf9f5] via-[#faf9f5]/90 to-transparent pointer-events-none space-y-2">
        <Link
          href={\`/community/ask?plant=\${plant.id}\`}
          className="w-full py-3 px-5 rounded-2xl bg-teal-50 hover:bg-teal-100 text-teal-950 border border-teal-200 font-heading font-extrabold text-sm shadow-2xs transition-all active:scale-[0.98] cursor-pointer pointer-events-auto flex items-center justify-center gap-2"
        >
          <Bot className="w-4 h-4 text-teal-700" />
          <span>Ask NatureAide About This Plant</span>
        </Link>
        <button
          onClick={handleToggleSave}`;

code = code.replace(oldStickyBottom, newStickyBottom);

fs.writeFileSync(path, code, 'utf8');
console.log('Successfully updated PlantDetailSections.tsx');
