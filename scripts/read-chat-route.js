const fs = require('fs');

console.log("=== src/app/api/community/chat/route.ts ===");
if (fs.existsSync('src/app/api/community/chat/route.ts')) {
  console.log(fs.readFileSync('src/app/api/community/chat/route.ts', 'utf8').substring(0, 3000));
} else {
  console.log("File not found");
}
