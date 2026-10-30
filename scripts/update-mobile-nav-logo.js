const fs = require('fs');

const path = 'src/components/community/CommunityMobileNav.tsx';
let code = fs.readFileSync(path, 'utf8');

const oldLogo = `        <Link href="/community" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#0f2c20] p-1 shadow-2xs">
            <Image
              src="/images/nature-logo.png"
              alt="NatureAide logo"
              width={26}
              height={26}
              className="object-contain w-full h-full invert brightness-200"
            />
          </div>
          <span className="font-heading font-extrabold text-lg text-[#0f2c20] tracking-tight">
            NatureAide
          </span>
        </Link>`;

const newLogo = `        <Link href="/community" className="flex items-center gap-2.5 group">
          <div className="relative w-8 h-8 rounded-xl overflow-hidden bg-white p-0.5 border border-[#dde6df] shadow-2xs group-hover:scale-105 transition-transform">
            <Image
              src="/images/nature-logo.png"
              alt="NatureAide logo"
              fill
              className="object-contain p-0.5"
            />
          </div>
          <span className="font-heading font-extrabold text-lg text-[#0f2c20] tracking-tight">
            NatureAide
          </span>
        </Link>`;

code = code.replace(oldLogo, newLogo);
fs.writeFileSync(path, code, 'utf8');
console.log('Successfully updated CommunityMobileNav.tsx');
