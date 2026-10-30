const fs = require('fs');

console.log('=== src/lib/record-images.ts ===');
console.log(fs.readFileSync('src/lib/record-images.ts', 'utf8'));

if (fs.existsSync('src/components/community/RecordImage.tsx')) {
  console.log('=== src/components/community/RecordImage.tsx ===');
  console.log(fs.readFileSync('src/components/community/RecordImage.tsx', 'utf8'));
}
