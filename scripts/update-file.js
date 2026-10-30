const fs = require('fs');
const [,, targetPath, b64Content] = process.argv;
const content = Buffer.from(b64Content, 'base64').toString('utf8');
fs.writeFileSync(targetPath, content, 'utf8');
console.log('Updated:', targetPath, 'Bytes:', fs.statSync(targetPath).size);