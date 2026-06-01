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
      ? `<img src="${p.image}" alt="${p.name}">`
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
    const productList = document.getElementById('productList');
    const res = await fetch('_data/products-all.json').catch(() => null);
    if (!res || !res.ok) {
      productList.innerHTML = '<p style="padding:40px;text-align:center;">Could not load products.</p>';
      return;
    }
    const products = (await res.json()).filter(Boolean);

    const byCat = {};
    for (const p of products) {
      if (!byCat[p.category]) byCat[p.category] = [];
      byCat[p.category].push(p);
    }

    // Only categories that actually have products
    const activeCats = CATEGORIES.filter(c => (byCat[c.id] || []).length);

    // Render one section per category
    let html = '';
    for (const cat of activeCats) {
      const cards = (byCat[cat.id]).map(cardHTML).join('');
      html += `<div class="cat-section" id="${cat.id}">
        <div class="cat-heading">${cat.label} <span class="cat-heading-count">${byCat[cat.id].length}</span></div>
        <div class="product-grid">${cards}</div>
      </div>`;
    }
    productList.innerHTML = html || '<p style="padding:40px;text-align:center;">No products found.</p>';

    buildCategoryNav(activeCats, byCat, products.length);
    initModal();
    applyFilterFromHash(activeCats);
  }

  // Build the sidebar list + the mobile chip bar from real data
  function buildCategoryNav(activeCats, byCat, total) {
    const items = [{ id: 'all', label: '📦 All Products', count: total }]
      .concat(activeCats.map(c => ({ id: c.id, label: c.label, count: byCat[c.id].length })));

    const catList = document.getElementById('catList');
    if (catList) {
      catList.innerHTML = items.map(it =>
        `<li><a href="#${it.id}" data-cat="${it.id}">${it.label}<span class="cat-count-badge">${it.count}</span></a></li>`
      ).join('');
    }

    const chips = document.getElementById('catChips');
    if (chips) {
      chips.innerHTML = items.map(it =>
        `<button class="cat-chip" data-cat="${it.id}">${it.label} <span class="chip-count">${it.count}</span></button>`
      ).join('');
    }

    document.querySelectorAll('[data-cat]').forEach(el => {
      el.addEventListener('click', e => {
        e.preventDefault();
        showCategory(el.dataset.cat, true);
      });
    });
  }

  // Show one category (or all) and sync nav highlight + URL hash
  function showCategory(id, scroll) {
    const sections = document.querySelectorAll('.cat-section');
    if (!sections.length) return;
    const exists = id !== 'all' && document.getElementById(id);
    if (id !== 'all' && !exists) id = 'all';

    sections.forEach(sec => {
      sec.style.display = (id === 'all' || sec.id === id) ? '' : 'none';
    });

    document.querySelectorAll('[data-cat]').forEach(el => {
      el.classList.toggle('active', el.dataset.cat === id);
    });

    if (('#' + id) !== window.location.hash) {
      history.replaceState(null, '', '#' + id);
    }

    if (scroll) {
      const top = productMain.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' });
    }
  }

  function applyFilterFromHash() {
    const id = decodeURIComponent(window.location.hash.slice(1)) || 'all';
    showCategory(id, false);
  }

  window.addEventListener('hashchange', applyFilterFromHash);

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
        modalIcon.innerHTML = `<img src="${img}" alt="${this.dataset.name}">`;
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
        if (s[key] === undefined) return;
        if (key === 'aboutText') {
          el.innerHTML = s[key].split(/\n+/).filter(Boolean).map(p => `<p>${p}</p>`).join('');
        } else {
          el.textContent = s[key];
        }
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
