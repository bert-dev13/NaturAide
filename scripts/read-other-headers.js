const fs = require('fs');

console.log("=== src/components/researcher/ResearcherHeader.tsx ===");
if (fs.existsSync('src/components/researcher/ResearcherHeader.tsx')) {
  console.log(fs.readFileSync('src/components/researcher/ResearcherHeader.tsx', 'utf8').substring(0, 1000));
}

console.log("\n=== src/components/reviewer/ReviewerHeader.tsx ===");
if (fs.existsSync('src/components/reviewer/ReviewerHeader.tsx')) {
  console.log(fs.readFileSync('src/components/reviewer/ReviewerHeader.tsx', 'utf8').substring(0, 1000));
}
