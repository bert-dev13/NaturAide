const fs = require('fs');

const code = fs.readFileSync('scripts/test-chatbot-upgrades.ts', 'utf8');
const lines = code.split('\n');
console.log(lines.slice(lines.length - 25).join('\n'));
