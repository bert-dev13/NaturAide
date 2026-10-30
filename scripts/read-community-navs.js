const fs = require('fs');

console.log("=== src/components/community/CommunityMobileNav.tsx ===");
if (fs.existsSync('src/components/community/CommunityMobileNav.tsx')) {
  console.log(fs.readFileSync('src/components/community/CommunityMobileNav.tsx', 'utf8').substring(0, 1000));
}

console.log("\n=== src/components/community/CommunitySidebar.tsx ===");
if (fs.existsSync('src/components/community/CommunitySidebar.tsx')) {
  console.log(fs.readFileSync('src/components/community/CommunitySidebar.tsx', 'utf8').substring(0, 1000));
}
