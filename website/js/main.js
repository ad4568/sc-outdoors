// Hero Slider
(function() {
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.hero-dot');
  if (!slides.length) return;
  let cur = 0, timer;
  function go(n) {
    slides[cur].classList.remove('active');
    dots[cur] && dots[cur].classList.remove('active');
    cur = (n + slides.length) % slides.length;
    slides[cur].classList.add('active');
    dots[cur] && dots[cur].classList.add('active');
  }
  function start() { timer = setInterval(() => go(cur + 1), 5000); }
  function stop() { clearInterval(timer); }
  const prev = document.querySelector('.hero-arrow.prev');
  const next = document.querySelector('.hero-arrow.next');
  if (prev) prev.addEventListener('click', () => { stop(); go(cur - 1); start(); });
  if (next) next.addEventListener('click', () => { stop(); go(cur + 1); start(); });
  dots.forEach((d, i) => d.addEventListener('click', () => { stop(); go(i); start(); }));
  start();
})();

// Product page: load from JSON files
const productMain = document.getElementById('productMain');
if (productMain) {
  const CATEGORIES = [
    { id: 'chairs',   label: '🪑 Camping Chairs' },
    { id: 'tables',   label: '🏕 Camping Tables' },
    { id: 'tents',    label: '⛺ Tents & Shelters' },
    { id: 'poles',    label: '🏃 Trekking Poles' },
    { id: 'lighting', label: '💡 Camping Lighting' },
    { id: 'bags',     label: '🎒 Bags & Packs' },
    { id: 'hammocks', label: '🏚 Hammocks' },
    { id: 'cooking',  label: '🍳 Cooking Equipment' },
    { id: 'covers',   label: '🚗 Covers & Canopies' },
    { id: 'pet',      label: '🐶 Pet Products' },
  ];

  function cardHTML(p) {
    const icon = p.image
      ? `<img src="${p.image}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;">`
      : '📦';
    return `<div class="product-card" data-sku="${p.sku}" data-name="${p.name}" data-image="${p.image || ''}" data-specs='${JSON.stringify(p.specs || [])}'>
      <div class="product-img">${icon}</div>
      <div class="product-info">
        <div class="product-sku">${p.sku}</div>
        <div class="product-name">${p.name}</div>
        <div class="product-spec">${p.shortDesc || ''}</div>
        <button class="btn-inq">Send Inquiry</button>
      </div>
    </div>`;
  }

  async function loadProducts() {
    const indexRes = await fetch('_data/products-index.json').catch(() => null);
    if (!indexRes || !indexRes.ok) {
      productMain.innerHTML = '<p style="padding:40px;text-align:center;">Could not load products.</p>';
      return;
    }
    const slugs = await indexRes.json();

    const products = (await Promise.all(
      slugs.map(slug =>
        fetch(`_data/products/${slug}.json`)
          .then(r => r.ok ? r.json() : null)
          .catch(() => null)
      )
    )).filter(Boolean);

    const byCat = {};
    for (const p of products) {
      if (!byCat[p.category]) byCat[p.category] = [];
      byCat[p.category].push(p);
    }

    let html = '';
    for (const cat of CATEGORIES) {
      const cards = (byCat[cat.id] || []).map(cardHTML).join('');
      if (!cards) continue;
      html += `<div class="cat-section" id="${cat.id}">
        <div class="cat-heading">${cat.label}</div>
        <div class="product-grid">${cards}</div>
      </div>`;
    }
    productMain.innerHTML = html || '<p style="padding:40px;text-align:center;">No products found.</p>';
    initModal();
  }

  loadProducts();
}

// Product Modal
function initModal() {
  const modal = document.getElementById('productModal');
  if (!modal) return;
  document.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', function() {
      const modalIcon = document.getElementById('modalIcon');
      const img = this.dataset.image;
      if (img) {
        modalIcon.innerHTML = `<img src="${img}" alt="${this.dataset.name}" style="width:100%;height:100%;object-fit:cover;">`;
      } else {
        modalIcon.textContent = '📦';
      }
      document.getElementById('modalName').textContent = this.dataset.name || '';
      document.getElementById('modalSku').textContent = 'Model: ' + (this.dataset.sku || '');
      const specs = JSON.parse(this.dataset.specs || '[]');
      document.getElementById('modalSpecs').innerHTML = specs.map(s =>
        `<tr><td>${s.key}</td><td>${s.value}</td></tr>`
      ).join('');
      modal.classList.add('open');
    });
  });
  modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('open'); });
  const mc = document.querySelector('.modal-close');
  if (mc) mc.addEventListener('click', () => modal.classList.remove('open'));
  const mbc = document.querySelector('.btn-modal-close');
  if (mbc) mbc.addEventListener('click', () => modal.classList.remove('open'));
}

// Static page modal (non-product pages that still have modal markup)
if (!document.getElementById('productMain')) {
  initModal();
}

// Load site settings from JSON and update contact info on all pages
(function() {
  const depth = window.location.pathname.split('/').length > 2 ? '../' : '';
  fetch(depth + '_data/settings.json')
    .then(r => r.ok ? r.json() : null)
    .then(s => {
      if (!s) return;
      // Update all elements with data-setting attribute
      document.querySelectorAll('[data-setting]').forEach(el => {
        const key = el.dataset.setting;
        if (s[key] !== undefined) el.textContent = s[key];
      });
    })
    .catch(() => {});
})();

// Contact form
const form = document.getElementById('contactForm');
if (form) {
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    const btn = this.querySelector('.btn-submit');
    btn.textContent = 'Message Sent';
    btn.style.background = '#4a7c59';
    setTimeout(() => { btn.textContent = 'Send Message'; btn.style.background = ''; this.reset(); }, 3000);
  });
}
