const fs = require('fs');

console.log("=== Rest of src/lib/ai-assistant-service.ts ===");
const code = fs.readFileSync('src/lib/ai-assistant-service.ts', 'utf8');
console.log(code.substring(2500));
