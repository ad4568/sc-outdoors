const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'sc-outdoors-secret-2026';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'Admin@2026';

const WEBSITE_DIR = path.join(__dirname, '../website');
const PRODUCTS_DIR = path.join(WEBSITE_DIR, '_data/products');
const SETTINGS_FILE = path.join(WEBSITE_DIR, '_data/settings.json');
const PRODUCTS_INDEX = path.join(WEBSITE_DIR, '_data/products-index.json');
const IMAGES_DIR = path.join(WEBSITE_DIR, 'images/products');

app.use(cors());
app.use(express.json());

// 图片上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, IMAGES_DIR),
  filename: (req, file, cb) => {
    const slug = req.params.slug || req.body.slug || Date.now();
    cb(null, slug + path.extname(file.originalname).toLowerCase());
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'));
  },
});

// 认证中间件
function auth(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// 重建产品索引
function rebuildIndex() {
  const slugs = fs.readdirSync(PRODUCTS_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('.json', ''))
    .sort();
  fs.writeFileSync(PRODUCTS_INDEX, JSON.stringify(slugs));
}

// ── 路由 ──────────────────────────────────────────────────

// 登录
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// 获取所有产品
app.get('/products', auth, (req, res) => {
  const files = fs.readdirSync(PRODUCTS_DIR).filter(f => f.endsWith('.json'));
  const products = files.map(f => {
    const slug = f.replace('.json', '');
    const data = JSON.parse(fs.readFileSync(path.join(PRODUCTS_DIR, f), 'utf-8'));
    return { slug, ...data };
  }).sort((a, b) => a.slug.localeCompare(b.slug));
  res.json(products);
});

// 获取单个产品
app.get('/products/:slug', auth, (req, res) => {
  const file = path.join(PRODUCTS_DIR, req.params.slug + '.json');
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'Not found' });
  res.json(JSON.parse(fs.readFileSync(file, 'utf-8')));
});

// 新增产品
app.post('/products', auth, (req, res) => {
  const { slug, ...data } = req.body;
  if (!slug) return res.status(400).json({ error: 'slug required' });
  const file = path.join(PRODUCTS_DIR, slug + '.json');
  if (fs.existsSync(file)) return res.status(409).json({ error: 'Product already exists' });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  rebuildIndex();
  res.json({ ok: true });
});

// 更新产品
app.put('/products/:slug', auth, (req, res) => {
  const file = path.join(PRODUCTS_DIR, req.params.slug + '.json');
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'Not found' });
  fs.writeFileSync(file, JSON.stringify(req.body, null, 2));
  res.json({ ok: true });
});

// 删除产品
app.delete('/products/:slug', auth, (req, res) => {
  const file = path.join(PRODUCTS_DIR, req.params.slug + '.json');
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'Not found' });
  fs.unlinkSync(file);
  // 删除对应图片
  ['jpg', 'jpeg', 'png', 'webp'].forEach(ext => {
    const img = path.join(IMAGES_DIR, req.params.slug + '.' + ext);
    if (fs.existsSync(img)) fs.unlinkSync(img);
  });
  rebuildIndex();
  res.json({ ok: true });
});

// 上传图片
app.post('/upload/:slug', auth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  res.json({ url: '/images/products/' + req.file.filename });
});

// 读取设置
app.get('/settings', auth, (req, res) => {
  res.json(JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8')));
});

// 保存设置
app.put('/settings', auth, (req, res) => {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(req.body, null, 2));
  res.json({ ok: true });
});

// 重建索引
app.post('/rebuild', auth, (req, res) => {
  rebuildIndex();
  res.json({ ok: true });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Admin API running on port ${PORT}`);
});
