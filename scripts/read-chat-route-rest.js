const fs = require('fs');

console.log("=== Rest of src/app/api/community/chat/route.ts ===");
const code = fs.readFileSync('src/app/api/community/chat/route.ts', 'utf8');
console.log(code.substring(2500));
