const fs = require('fs');
const path = require('path');

const dir = 'website/_data/products';
const slugs = fs.readdirSync(dir)
  .filter(f => f.endsWith('.json'))
  .map(f => f.replace('.json', ''))
  .sort();

fs.writeFileSync(
  'website/_data/products-index.json',
  JSON.stringify(slugs)
);

console.log(`Generated products-index.json with ${slugs.length} products`);
