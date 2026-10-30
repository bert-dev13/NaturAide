const fs = require('fs');
const content = fs.readFileSync('src/lib/ai-assistant-service.ts', 'utf8');
console.log('src/lib/ai-assistant-service.ts length:', content.length);
console.log('First 200 chars:\n', content.substring(0, 200));
console.log('Last 200 chars:\n', content.substring(content.length - 200));
