const fs = require('fs');

const path = 'src/components/researcher/ResearcherHeader.tsx';
let code = fs.readFileSync(path, 'utf8');

const oldBlock = `          {/* Brand on Mobile */}
          <Link href="/researcher" className="flex lg:hidden items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-[#0f2c20] p-1 flex items-center justify-center">
              <Image
                src="/images/nature-logo.png"
                alt="NatureAide logo"
                width={24}
                height={24}
                className="object-contain w-full h-full invert brightness-200"
              />
            </div>
            <span className="font-heading font-extrabold text-base tracking-tight text-[#0f2c20]">
              NatureAide <span className="text-xs font-bold text-emerald-700">Lab</span>
            </span>
          </Link>`;

const newBlock = `          {/* Brand on Top Bar */}
          <Link href="/researcher" className="flex items-center gap-2 group">
            <div className="relative w-8 h-8 rounded-xl overflow-hidden bg-white p-0.5 border border-[#dde6df] shadow-2xs group-hover:scale-105 transition-transform shrink-0">
              <Image
                src="/images/nature-logo.png"
                alt="NatureAide logo"
                fill
                className="object-contain p-0.5"
                priority
              />
            </div>
            <span className="font-heading font-extrabold text-base tracking-tight text-[#0f2c20]">
              NatureAide <span className="text-xs font-bold text-emerald-700">Lab</span>
            </span>
          </Link>`;

code = code.replace(oldBlock, newBlock);
fs.writeFileSync(path, code, 'utf8');
console.log('Successfully updated ResearcherHeader.tsx');
