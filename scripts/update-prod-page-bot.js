const fs = require('fs');

const path = 'src/app/community/products/[slug]/page.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add Bot to lucide-react import
code = code.replace(
  '  AlertCircle,\n} from "lucide-react";',
  '  AlertCircle,\n  Bot,\n} from "lucide-react";'
);

// 2. Add Ask NatureAide button right before the Back Navigation Button
const oldBackNav = `        {/* Back Navigation Button */}
        <div className="pt-2">
          <Link
            href={`;

const newBackNav = `        {/* Contextual Ask NatureAide Button */}
        <div className="pt-2">
          <Link
            href={\`/community/ask?product=\${product.id}\`}
            className="w-full py-3.5 px-5 rounded-2xl bg-teal-50 hover:bg-teal-100 text-teal-950 border border-teal-200 font-heading font-extrabold text-sm shadow-2xs transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
          >
            <Bot className="w-4 h-4 text-teal-700" />
            <span>Ask NatureAide About This Product</span>
          </Link>
        </div>

        {/* Back Navigation Button */}
        <div className="pt-1">
          <Link
            href={`;

code = code.replace(oldBackNav, newBackNav);

fs.writeFileSync(path, code, 'utf8');
console.log('Successfully updated src/app/community/products/[slug]/page.tsx');
