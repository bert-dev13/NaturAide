const fs = require('fs');

console.log("=== src/lib/ai-assistant-service.ts ===");
const code = fs.readFileSync('src/lib/ai-assistant-service.ts', 'utf8');
console.log(code.substring(0, 3000));
