const fs = require('fs');

const dir = 'website/_data/products';
const slugs = fs.readdirSync(dir)
  .filter(f => f.endsWith('.json'))
  .map(f => f.replace('.json', ''))
  .sort();

fs.writeFileSync(
  'website/_data/products-index.json',
  JSON.stringify(slugs)
);

// Bundle every product into a single file so the page needs one request, not hundreds
const products = slugs.map(slug =>
  JSON.parse(fs.readFileSync(`${dir}/${slug}.json`, 'utf8'))
);

fs.writeFileSync(
  'website/_data/products-all.json',
  JSON.stringify(products)
);

console.log(`Generated products-index.json and products-all.json with ${slugs.length} products`);
