// ===== Shared UI + API helpers =====
async function api(url, options = {}) {
  const opts = { headers: { 'Content-Type': 'application/json' }, ...options };
  if (opts.body && typeof opts.body !== 'string') opts.body = JSON.stringify(opts.body);
  const res = await fetch(url, opts);
  let data = null;
  try { data = await res.json(); } catch (_) { /* response has no JSON body */ }
  if (!res.ok) throw new Error((data && data.error) || `เกิดข้อผิดพลาด (${res.status})`);
  return data;
}

function toast(msg, type = '') {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.textContent = msg;
  t.className = 'show ' + type;
  clearTimeout(t._h);
  t._h = setTimeout(() => (t.className = type), 3800);
}

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const baht = (n) => '฿' + Number(n || 0).toLocaleString('th-TH', { maximumFractionDigits: 2 });

const ICONS = {
  menu: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  dog: '<svg class="icon icon-lg" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 8 5.5 4.5C4.5 6 4.5 8 5.5 9.5M16 8l2.5-3.5c1 1.5 1 3.5 0 5M7 16c1.2 2 2.8 3 5 3s3.8-1 5-3M8.5 11h.01M15.5 11h.01M10 14h4"/><path d="M6 9.5c-.7 1-1 2.1-1 3.5 0 4 3.1 7 7 7s7-3 7-7c0-1.4-.3-2.5-1-3.5"/></svg>',
  cat: '<svg class="icon icon-lg" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8V4l4 3a9 9 0 0 1 6 0l4-3v9a7 7 0 0 1-14 0V8Z"/><path d="M9 12h.01M15 12h.01M10 16h4M3 14h4M17 14h4M4 17l4-1M20 17l-4-1"/></svg>',
  bed: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 19V8M21 19v-8a2 2 0 0 0-2-2H9v7M3 16h18M5 8h4v5H3v-3a2 2 0 0 1 2-2Z"/></svg>',
  bath: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h18v2a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5v-2ZM7 12V7a3 3 0 0 1 6 0M6 19v2M18 19v2M16 5h.01M19 7h.01"/></svg>',
  scissors: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="7" r="3"/><circle cx="6" cy="17" r="3"/><path d="m8.7 8.3 11.3 8.2M8.7 15.7 20 7.5"/></svg>',
  sparkle: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 1.4 4.1L17.5 9l-4.1 1.9L12 15l-1.4-4.1L6.5 9l4.1-1.9L12 3ZM5 15l.8 2.2L8 18l-2.2.8L5 21l-.8-2.2L2 18l2.2-.8L5 15ZM19 13l.8 2.2 2.2.8-2.2.8L19 19l-.8-2.2L16 16l2.2-.8L19 13Z"/></svg>',
  nail: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4h8v11a4 4 0 0 1-8 0V4ZM8 8h8M10 4V2M14 4V2"/></svg>',
  walk: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="5" r="2"/><path d="m7 9 3 3 2-2 3 3M10 12l-2 8M12 14l4 6M17 6a3 3 0 1 0 0 6h2v5M15 9h-3"/></svg>',
  food: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 14h16a8 8 0 0 1-16 0ZM8 9c0-2 1-3 3-4M13 10c0-2 1-3 3-4"/></svg>',
  care: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-8-4.6-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6.4-8 11-8 11Z"/></svg>',
  calendar: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>',
  home: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m3 11 9-8 9 8v10h-6v-6H9v6H3V11Z"/></svg>',
  check: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>',
  shield: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>',
  database: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></svg>',
  bell: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg>',
  logout: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H4"/></svg>',
  eye: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>',
  eyeOff: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4M6.6 6.6C3.9 8.4 2 12 2 12s3.6 7 10 7a9.7 9.7 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>',
  refresh: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6v5h-5M4 18v-5h5M18.5 9A7 7 0 0 0 6 6.5L4 9M5.5 15A7 7 0 0 0 18 17.5l2-2.5"/></svg>',
};
const icon = (name) => ICONS[name] || ICONS.care;
const petIcon = (sp) => icon(sp === 'Cat' ? 'cat' : 'dog');
function resolvePetImage(pet = {}) {
  const photoURL = typeof pet.PhotoURL === 'string' ? pet.PhotoURL.trim() : '';
  return photoURL || null;
}
function petProfileImage(pet = {}, variant = '') {
  const photoURL = resolvePetImage(pet);
  const petName = String(pet.PetName || '').trim();
  const label = petName ? `${petName} profile photo` : 'Pet profile';
  const className = `pet-profile-image${variant ? ` pet-profile-image--${variant}` : ''}`;
  const fallback = `<span class="pet-profile-fallback" role="img" aria-label="${esc(label)}"${photoURL ? ' hidden' : ''}>${petIcon(pet.Species)}</span>`;
  const image = photoURL
    ? `<img src="${esc(photoURL)}" alt="${esc(label)}" onerror="this.hidden=true;this.nextElementSibling.hidden=false">`
    : '';
  return `<span class="${className}">${image}${fallback}</span>`;
}
const loadingHtml = (label = 'กำลังโหลดข้อมูล') => `<div class="loading-state"><div><div class="spinner" aria-hidden="true"></div><span class="sr-only">${esc(label)}</span></div></div>`;
const errorHtml = (message) => `<div class="card empty"><div class="icon-box">${icon('database')}</div><b>ไม่สามารถโหลดข้อมูลได้</b><p>${esc(message)}</p></div>`;

const TRANSPARENT_LOGO_PATH = '/assets/pets/purrpetcare-logo-transparent.png';
const LOGO_MARK_PATH = '/assets/pets/purrpetcare-logo-mark.png';
function brandLockup(variant = 'navbar') {
  const markOnly = variant === 'footer';
  const path = markOnly ? LOGO_MARK_PATH : TRANSPARENT_LOGO_PATH;
  const alt = markOnly ? 'PurrPetCare Logo' : 'PurrPetCare';
  return `<span class="brand-lockup brand-lockup--${esc(variant)}${markOnly ? ' brand-lockup--mark' : ''}"><img class="brand-lockup__asset" src="${path}" alt="${alt}"></span>`;
}
function hydrateBrandLockups(root = document) {
  root.querySelectorAll('[data-brand-lockup]').forEach((placeholder) => {
    placeholder.outerHTML = brandLockup(placeholder.dataset.brandLockup || 'navbar');
  });
}

function authStatusHtml(me = {}) {
  if (me.admin) return '<span class="auth-status auth-status--admin" title="เข้าสู่ระบบในฐานะผู้ดูแลระบบ"><span class="auth-status__dot" aria-hidden="true"></span>Admin Online</span>';
  if (me.customer) return '<span class="auth-status auth-status--customer" title="เข้าสู่ระบบแล้ว"><span class="auth-status__dot" aria-hidden="true"></span>Customer Online</span>';
  return '<span class="auth-status auth-status--guest" title="ยังไม่ได้เข้าสู่ระบบ"><span class="auth-status__dot" aria-hidden="true"></span>Guest</span>';
}

function bindPasswordToggles(root = document) {
  root.querySelectorAll('[data-password-toggle]').forEach((button) => {
    button.innerHTML = `${icon('eye')}<span>แสดง</span>`;
    button.addEventListener('click', () => {
      const input = document.getElementById(button.dataset.passwordToggle);
      if (!input) return;
      const showing = input.type === 'text';
      input.type = showing ? 'password' : 'text';
      button.innerHTML = showing ? `${icon('eye')}<span>แสดง</span>` : `${icon('eyeOff')}<span>ซ่อน</span>`;
      button.setAttribute('aria-label', showing ? 'แสดงรหัสผ่าน' : 'ซ่อนรหัสผ่าน');
      input.focus({ preventScroll: true });
    });
  });
}

const TH_MONTH = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
function thDate(s) {
  if (!s) return '-';
  const [d, t] = String(s).trim().split(' ');
  const [y, m, dd] = d.split('-').map(Number);
  return `${dd} ${TH_MONTH[m - 1]} ${y + 543}${t ? ' ' + t + ' น.' : ''}`;
}
function ymd(date) { const p = (n) => String(n).padStart(2, '0'); return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`; }
function addDays(s, n) { const [y, m, d] = s.split('-').map(Number); return ymd(new Date(y, m - 1, d + n)); }

const STATUS_TH = {
  Available: 'ว่าง', Occupied: 'มีน้องพัก', Cleaning: 'รอทำความสะอาด', Maintenance: 'ปิดซ่อม',
  Confirmed: 'ยืนยันแล้ว', CheckedIn: 'เช็กอินแล้ว', Completed: 'เสร็จสิ้น', Cancelled: 'ยกเลิก',
  Waiting: 'รอคิว', InProgress: 'กำลังทำ', Done: 'เสร็จแล้ว',
};
const badge = (st) => `<span class="badge b-${esc(st)}">${esc(STATUS_TH[st] || st)}</span>`;

function ensureFooter() {
  if (document.querySelector('.site-footer') || document.body.classList.contains('admin-body')) return;
  const footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.innerHTML = `<div class="footer-grid">
    <div>${brandLockup('footer')}<p>การดูแลที่อบอุ่น สะอาด และใส่ใจในทุกรายละเอียด เพื่อให้น้องสบายใจเหมือนอยู่บ้าน</p></div>
    <div><h3>บริการ</h3><a href="index.html#stay">โรงแรมสัตว์เลี้ยง</a><a href="index.html#grooming">อาบน้ำและตัดขน</a><a href="index.html#care">บริการดูแลเสริม</a></div>
    <div class="footer-account"><h3>บัญชีของฉัน</h3><a href="pets.html">น้องของฉัน</a><a href="book.html">จองบริการ</a><a href="bookings.html">ติดตามสถานะ</a></div>
    <div><h3>PurrPetCare</h3><a href="index.html#experience">แนวทางการดูแล</a><a href="customer-login.html">เข้าสู่ระบบ</a><a href="admin-login.html">สำหรับพนักงาน</a></div>
  </div><div class="footer-bottom"><span>© ${new Date().getFullYear()} PurrPetCare</span><span>PET HOTEL • GROOMING & CARE</span></div>`;
  document.body.appendChild(footer);
}

function renderNavigationDrawer(me = {}, toggle) {
  const items = [
    ['index.html', 'หน้าหลัก', 'gohome'],
    ['index.html#stay', 'ห้องพัก', 'hotel'],
    ['index.html#grooming', 'กรูมมิ่ง', 'scissors'],
    ['index.html#experience', 'การดูแลของเรา', 'care'],
    ['book.html', 'จองบริการ', 'confirm'],
  ];
  // Booking is customer-only; an admin following it would bounce login → dashboard, so admins don't get the link
  if (me.admin) items.splice(items.findIndex(([href]) => href === 'book.html'), 1);
  const page = location.pathname.split('/').pop() || 'index.html';
  const isActive = (href) => { const [file, hash] = href.split('#'); return file === page && (hash ? location.hash === '#' + hash : !location.hash); };
  const art = (key, cls) => `<span class="${cls} art-box tone-${key}">${SERVICE_ART[key]}</span>`;
  const tile = (href, label, key) => `<a class="drawer-tile" href="${href}">${art(key, 'drawer-tile-ico')}${label}</a>`;
  const logout = `<button class="drawer-logout" type="button" data-logout>${icon('logout')} ออกจากระบบ</button>`;
  const name = me.admin ? 'ผู้ดูแลระบบ' : me.customer ? me.customer.name : '';
  const account = name
    ? `<div class="drawer-profile"><span class="user-avatar" aria-hidden="true">${esc(Array.from(name.trim())[0] || '?').toUpperCase()}</span><div><b>${esc(name)}</b>${authStatusHtml(me)}</div></div>`
      + (me.admin ? `<div class="drawer-tiles">${tile('admin.html', 'Admin Dashboard', 'shield')}</div>` : `<div class="drawer-tiles">${tile('pets.html', 'น้องของฉัน', 'pets')}${tile('bookings.html', 'ติดตามสถานะ', 'profile')}</div>`)
      + logout
    : `<div class="drawer-profile is-guest"><span class="user-avatar" aria-hidden="true">${icon('care')}</span><div><b>ยินดีต้อนรับ</b><span class="small muted">เข้าสู่ระบบเพื่อจองและติดตามน้อง</span></div></div><a class="btn ghost block" href="customer-login.html">เข้าสู่ระบบ</a>`;
  const adminHref = me.admin ? 'admin.html' : 'admin-login.html';
  const layer = document.createElement('div');
  layer.className = 'navigation-drawer-layer';
  layer.innerHTML = `<button class="navigation-drawer-overlay" type="button" aria-label="ปิดเมนู"></button>
    <aside class="navigation-drawer" id="main-navigation-drawer" aria-hidden="true">
      <div class="navigation-drawer__top"><a href="index.html" aria-label="PurrPetCare หน้าหลัก">${brandLockup('drawer')}</a><button class="drawer-close" type="button" aria-label="ปิดเมนู"><span></span><span></span></button></div>
      <section class="drawer-account" aria-label="สถานะบัญชี">${account}</section>
      <span class="drawer-section-label">Explore</span>
      <nav class="drawer-links" aria-label="เมนูหลัก">${items.map(([href, label, ico], index) => `<a href="${href}" class="${isActive(href) ? 'active' : ''}"${isActive(href) ? ' aria-current="page"' : ''} style="--drawer-order:${index + 1}">${art(ico, 'drawer-link-ico')}<span class="drawer-link-label">${label}</span><span class="drawer-link-arrow" aria-hidden="true">→</span></a>`).join('')}</nav>
      ${me.admin ? '' : '<a class="btn block btn-arrow drawer-cta" href="book.html">จองให้น้องวันนี้</a>'}
      <a class="drawer-admin-link" href="${adminHref}">${icon('shield')} Admin Portal</a>
    </aside>`;
  document.body.appendChild(layer);
  const drawer = layer.querySelector('.navigation-drawer');
  const closeButton = layer.querySelector('.drawer-close');
  const setOpen = (open) => {
    layer.classList.toggle('open', open);
    drawer.setAttribute('aria-hidden', String(!open));
    toggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('drawer-open', open);
    if (open) closeButton.focus();
    else toggle.focus({ preventScroll: true });
  };
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  closeButton.addEventListener('click', () => setOpen(false));
  layer.querySelector('.navigation-drawer-overlay').addEventListener('click', () => setOpen(false));
  layer.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setOpen(false)));
  addEventListener('keydown', (event) => { if (event.key === 'Escape' && layer.classList.contains('open')) setOpen(false); });
  return layer;
}

async function renderTopbar(active) {
  const me = await api('/api/auth/me').catch(() => ({}));
  const links = me.admin
    ? [['index.html','หน้าหลัก','home'],['admin.html','Admin Dashboard','database']]
    : me.customer
    ? [['index.html','หน้าแรก','home'],['pets.html','น้องของฉัน','cat'],['book.html','จองบริการ','calendar'],['bookings.html','ติดตามสถานะ','refresh']]
    : [['index.html','หน้าแรก','home'],['index.html#stay','ห้องพัก','bed'],['index.html#grooming','กรูมมิ่ง','scissors'],['index.html#experience','การดูแลของเรา','care']];
  const nav = `<div class="nav-pill">${links.map(([h,t,i]) => `<a href="${h}" class="${h === active ? 'active' : ''}"${h === active ? ' aria-current="page"' : ''}>${icon(i)}<span>${t}</span></a>`).join('')}</div>`;
  const userChip = (name) => `<div class="user-chip" title="${esc(name)}"><span class="user-avatar" aria-hidden="true">${esc(Array.from(name.trim())[0] || '?').toUpperCase()}</span><span class="user-chip-text"><b>${esc(name)}</b>${authStatusHtml(me)}</span></div>`;
  const logout = `<button class="logout-btn" type="button" id="logoutBtn" title="ออกจากระบบ">${icon('logout')}<span>ออกจากระบบ</span></button>`;
  const who = me.admin
    ? `${userChip('ผู้ดูแลระบบ')}${logout}`
    : me.customer
      ? `${userChip(me.customer.name)}${logout}`
      : `${authStatusHtml(me)}<a class="btn ghost sm" href="customer-login.html">เข้าสู่ระบบ</a><a class="btn sm nav-cta" href="book.html">${icon('calendar')} จองบริการ</a><a href="admin-login.html" class="admin-link">Admin</a>`;
  const bar = document.createElement('header');
  bar.className = 'topbar';
  bar.innerHTML = `<div class="inner"><button class="menu-toggle" type="button" aria-label="เปิดเมนู" aria-expanded="false" aria-controls="main-navigation-drawer"><span class="hamburger-lines" aria-hidden="true"><span></span><span></span><span></span></span></button><a class="logo" href="index.html" aria-label="PurrPetCare หน้าแรก">${brandLockup('navbar')}</a>
    <nav class="nav" aria-label="เมนูหลัก">${nav}</nav><div class="who">${who}</div></div>`;
  document.body.prepend(bar);
  if (me.admin) document.body.classList.add('admin-viewing');
  const toggle = bar.querySelector('.menu-toggle');
  renderNavigationDrawer(me, toggle);
  document.querySelectorAll('[data-logout],#logoutBtn').forEach((button) => (button.onclick = async () => { button.disabled = true; await api('/api/auth/logout', { method: 'POST' }); location.href = 'index.html'; }));
  ensureFooter();
  return me;
}

async function requireCustomer(active) {
  const me = await renderTopbar(active);
  if (!me.customer) { location.href = 'customer-login.html'; throw new Error('not logged in'); }
  return me.customer;
}

const SERVICE_ICONS = [[/อาบน้ำ/,'bath'],[/ตัดขน/,'scissors'],[/ตัดเล็บ/,'nail'],[/สปา/,'sparkle'],[/เดินเล่น/,'walk'],[/อาหาร/,'food'],[/ป้อนยา|ดูแล/,'care']];
const serviceIcon = (name) => icon((SERVICE_ICONS.find(([re]) => re.test(name)) || [null,'care'])[1]);

// Full-colour illustrations for the service cards, so each service is recognisable at a glance
const SERVICE_ART = {
  hotel: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M5 31c0-6.5 8.5-11 19-11s19 4.5 19 11v3.5a4.5 4.5 0 0 1-4.5 4.5h-29A4.5 4.5 0 0 1 5 34.5z" fill="#a9825f"/><path d="M5 33.5h38v1a4.5 4.5 0 0 1-4.5 4.5h-29A4.5 4.5 0 0 1 5 34.5z" fill="#8a6748"/><ellipse cx="24" cy="30.5" rx="15.5" ry="6" fill="#f8e8d4"/><path d="M15 31.5c-2.6 1.3-1.6 3.6 1.4 3.6h9" fill="none" stroke="#d97900" stroke-width="2.6" stroke-linecap="round"/><path d="M14 30.5c0-5.2 4.6-8.3 10.2-8.3 5.7 0 9.8 3 9.8 7 0 1.6-1.1 2.8-3.1 2.8H17c-2 0-3-.6-3-1.5z" fill="#f39200"/><path d="M19.2 24.6l1 3.2M22.8 23.3l.6 3.2" stroke="#d97900" stroke-width="1.6" stroke-linecap="round"/><path d="M26.4 22.6l.3-5.2 3.4 2.9zM34.6 22.6l-.3-5.2-3.4 2.9z" fill="#f39200"/><circle cx="30.5" cy="25" r="5.2" fill="#f7a01e"/><path d="M27.9 25.4q1 1 2 0M31.1 25.4q1 1 2 0" fill="none" stroke="#6b3500" stroke-width="1" stroke-linecap="round"/><circle cx="30.5" cy="27.2" r=".7" fill="#e86a7a"/><path d="M36 9h4.2L36 13.2h4.2M41.6 3.5h2.8l-2.8 2.8h2.8" fill="none" stroke="#8a6748" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  bath: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M7.5 21V11a3.6 3.6 0 0 1 7.2 0v1.2" fill="none" stroke="#9aa6b2" stroke-width="2.6" stroke-linecap="round"/><path d="M14.7 14.5c-.9 1.3-.9 2.2 0 2.6.9-.4.9-1.3 0-2.6z" fill="#5aa9e0"/><circle cx="20" cy="17" r="3" fill="#eef7fd" stroke="#9cc9ea" stroke-width="1.2"/><circle cx="25.5" cy="13.5" r="2.2" fill="#eef7fd" stroke="#9cc9ea" stroke-width="1.2"/><circle cx="24.5" cy="18.6" r="2" fill="#eef7fd" stroke="#9cc9ea" stroke-width="1.2"/><ellipse cx="31.5" cy="19" rx="6" ry="3.6" fill="#ffc928"/><path d="M27.5 18.4c1.8 1.6 4.2 1.6 6 0" fill="none" stroke="#e8a800" stroke-width="1.2" stroke-linecap="round"/><circle cx="35" cy="13.6" r="3.4" fill="#ffc928"/><path d="M38 13.4l3.2.8-3.2 1.3z" fill="#f37a00"/><circle cx="35.9" cy="12.8" r=".7" fill="#3a2a1a"/><path d="M13 38.5l-2 4M35 38.5l2 4" stroke="#5f9fcf" stroke-width="2.6" stroke-linecap="round"/><path d="M5 24h38v3.5A11 11 0 0 1 32 38.5H16A11 11 0 0 1 5 27.5z" fill="#fff"/><path d="M5 27.5h38A11 11 0 0 1 32 38.5H16A11 11 0 0 1 5 27.5z" fill="#d9ecf9"/><rect x="3" y="20.5" width="42" height="4.5" rx="2.25" fill="#7fb7e0"/></svg>',
  scissors: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 40c3-3 7-3.5 10-2" fill="none" stroke="#e0b07f" stroke-width="2.2" stroke-linecap="round"/><path d="M34 31c2.2-.7 4.2.3 4.8 2.2M38 26c1.8-.2 3.2.8 3.4 2.4M31 36c1.6.2 2.6 1.4 2.4 3" fill="none" stroke="#d9a35f" stroke-width="1.8" stroke-linecap="round"/><path d="M23 21.5 41 5.2l2.2 2.3L26 23.4z" fill="#b9c3cd"/><path d="M24 19.5l19-4.3.4 3-18.6 4z" fill="#dfe5ea"/><path d="M24.5 21 15.5 28.5M24.5 21l-2.6 11" stroke="#f39200" stroke-width="3.2" stroke-linecap="round"/><circle cx="12.5" cy="31" r="4.6" fill="#fff" stroke="#f39200" stroke-width="3.2"/><circle cx="21" cy="36.5" r="4.6" fill="#fff" stroke="#d97900" stroke-width="3.2"/><circle cx="24.5" cy="21" r="1.8" fill="#6b7785"/><path d="M28 5.5v4M26 7.5h4" stroke="#f39200" stroke-width="1.6" stroke-linecap="round"/></svg>',
  nail: '<svg viewBox="0 0 48 48" aria-hidden="true"><g transform="rotate(-38 36 36)"><rect x="23" y="33.4" width="26" height="5.4" rx="2.7" fill="#b6a3d6"/><rect x="35" y="33.4" width="14" height="5.4" rx="2.7" fill="#8f7bb8"/><path d="M26 35.4h.01M29 35.4h.01M32 35.4h.01M27.5 37h.01M30.5 37h.01" stroke="#fff" stroke-width="1.1" stroke-linecap="round" opacity=".8"/></g><path d="M7.6 18.6 9 14.2l2.6 3.4zM14.2 11.6l1.8-4.6 2 4.6zM23.6 11.6l1.8-4.6 2 4.6zM30 17.6l2.6-3.4 1.4 4.4z" fill="#fffaf6" stroke="#c8a49b" stroke-width="1" stroke-linejoin="round"/><circle cx="10" cy="21.6" r="4.2" fill="#f3a3ae"/><circle cx="16" cy="15.4" r="4.4" fill="#f3a3ae"/><circle cx="25.4" cy="15.4" r="4.4" fill="#f3a3ae"/><circle cx="31.6" cy="21.6" r="4.2" fill="#f3a3ae"/><path d="M20.8 23.6c5 0 9.2 3.8 9.2 8 0 3.2-2.4 4.9-5 4.9-1.7 0-2.7-.9-4.2-.9s-2.5.9-4.2.9c-2.6 0-5-1.7-5-4.9 0-4.2 4.2-8 9.2-8z" fill="#ee8796"/><ellipse cx="18" cy="27.8" rx="2" ry="1.2" fill="#fff" opacity=".55"/><circle cx="14.6" cy="14" r="1.1" fill="#fff" opacity=".5"/><circle cx="24" cy="14" r="1.1" fill="#fff" opacity=".5"/><path d="M38 6v4M36 8h4M42.5 13v2.6M41.2 14.3h2.6" stroke="#f39200" stroke-width="1.5" stroke-linecap="round"/></svg>',
  spa: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M30 23c1.8-8.4 8.6-11.6 13.4-10.6-.6 5.4-5 11.6-13.4 10.6z" fill="#86ad72"/><path d="M30.5 22.5c3-3.4 6.6-6.2 10.4-8" fill="none" stroke="#5f8d6a" stroke-width="1.2" stroke-linecap="round"/><circle cx="14" cy="18.5" r="5.6" fill="#c6e29a" stroke="#6c9a5c" stroke-width="1.6"/><circle cx="14" cy="18.5" r="3.4" fill="#e4f2c8"/><path d="M12.6 17.4h.01M15.4 17.4h.01M14 20.2h.01" stroke="#6c9a5c" stroke-width="1.4" stroke-linecap="round"/><path d="M6.5 26h35c0 8.3-7.8 14-17.5 14S6.5 34.3 6.5 26z" fill="#f1e6d9"/><path d="M8.5 31.5c3 5 8.6 8.5 15.5 8.5s12.5-3.5 15.5-8.5c-4.8 2.4-10 3.4-15.5 3.4S13.3 33.9 8.5 31.5z" fill="#e2d2c0"/><ellipse cx="24" cy="26" rx="17.5" ry="4.4" fill="#8a5a3b"/><ellipse cx="21" cy="25.2" rx="8" ry="1.6" fill="#a8744f"/><path d="M14.5 28.8c0 3 2.2 3 2.2 0" fill="#8a5a3b"/><rect x="18.5" y="39" width="11" height="3.4" rx="1.7" fill="#d4c0aa"/><path d="M24 5v4.4M21.8 7.2h4.4" stroke="#f39200" stroke-width="1.6" stroke-linecap="round"/></svg>',
  profile: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="9" y="7" width="30" height="37" rx="4" fill="#c9a07a"/><rect x="12.5" y="11" width="23" height="30" rx="2.5" fill="#fff"/><rect x="17" y="4.5" width="14" height="6" rx="2" fill="#8a96a3"/><circle cx="24" cy="6.6" r="1.2" fill="#dfe5ea"/><path d="M16.8 18.4l.4-4.8 3.4 2.6zM25.2 18.4l-.4-4.8-3.4 2.6z" fill="#f39200"/><circle cx="21" cy="20.4" r="5" fill="#f7a01e"/><circle cx="19.2" cy="20" r=".8" fill="#4a2a10"/><circle cx="22.8" cy="20" r=".8" fill="#4a2a10"/><circle cx="21" cy="22" r=".6" fill="#e86a7a"/><path d="M31 22s-3.4-2-3.4-4.3a1.7 1.7 0 0 1 3.4-.5 1.7 1.7 0 0 1 3.4.5c0 2.3-3.4 4.3-3.4 4.3z" fill="#ef6f7f"/><path d="M16 29.5h16M16 33.5h11M16 37.5h14" stroke="#e6d9cb" stroke-width="2" stroke-linecap="round"/></svg>',
  shield: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 4l15 5.5v11c0 10-6.4 17.4-15 21.5C15.4 37.9 9 30.5 9 20.5v-11z" fill="#5f8d6a"/><path d="M24 4v38C15.4 37.9 9 30.5 9 20.5v-11z" fill="#73a37d"/><path d="M24 8.6l11 4v8.2c0 7.4-4.7 12.9-11 16.1-6.3-3.2-11-8.7-11-16.1v-8.2z" fill="#eef5ef"/><path d="M18.2 22.6l4.2 4.2 7.6-8.2" fill="none" stroke="#5f8d6a" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M40.5 30v4.4M38.3 32.2h4.4M7 34v3M5.5 35.5h3" stroke="#f39200" stroke-width="1.6" stroke-linecap="round"/></svg>',
  // Pet houses that grow with the room size (S/M/L)
  roomS: '<svg viewBox="0 0 48 48" aria-hidden="true"><g transform="translate(24 44.2) scale(0.68) translate(-24 -44.2)"><ellipse cx="24" cy="44.2" rx="18" ry="2.4" fill="#3d2f26" opacity=".12"/><rect x="8.5" y="21" width="31" height="23" rx="2.5" fill="#e3f1fc"/><path d="M8.5 28h31M8.5 35.5h31" stroke="#bcd8ef" stroke-width="1.4"/><path d="M17.5 44V33a6.5 6.5 0 0 1 13 0v11z" fill="#3f6f96"/><path d="M24 3.5 45 23.2a1.8 1.8 0 0 1-1.2 3.1H4.2A1.8 1.8 0 0 1 3 23.2z" fill="#5a9fd4"/><path d="M3.6 23.6h40.8a1.8 1.8 0 0 1-.6 2.7H4.2a1.8 1.8 0 0 1-.6-2.7z" fill="#3f7fb4"/><path d="M13 17.5 24 7.2l11 10.3" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".35"/><circle cx="24" cy="17" r="3.6" fill="#fff"/><g fill="#5a9fd4"><ellipse cx="24" cy="18" rx="1.4" ry="1.1"/><circle cx="22.5" cy="16.4" r=".55"/><circle cx="23.5" cy="15.8" r=".55"/><circle cx="24.5" cy="15.8" r=".55"/><circle cx="25.5" cy="16.4" r=".55"/></g></g></svg>',
  roomM: '<svg viewBox="0 0 48 48" aria-hidden="true"><g transform="translate(24 44.2) scale(0.84) translate(-24 -44.2)"><ellipse cx="24" cy="44.2" rx="18" ry="2.4" fill="#3d2f26" opacity=".12"/><rect x="8.5" y="21" width="31" height="23" rx="2.5" fill="#fff0d6"/><path d="M8.5 28h31M8.5 35.5h31" stroke="#f6cf95" stroke-width="1.4"/><path d="M17.5 44V33a6.5 6.5 0 0 1 13 0v11z" fill="#9a5a12"/><path d="M24 3.5 45 23.2a1.8 1.8 0 0 1-1.2 3.1H4.2A1.8 1.8 0 0 1 3 23.2z" fill="#f39200"/><path d="M3.6 23.6h40.8a1.8 1.8 0 0 1-.6 2.7H4.2a1.8 1.8 0 0 1-.6-2.7z" fill="#cf7a00"/><path d="M13 17.5 24 7.2l11 10.3" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".35"/><circle cx="24" cy="17" r="3.6" fill="#fff"/><g fill="#f39200"><ellipse cx="24" cy="18" rx="1.4" ry="1.1"/><circle cx="22.5" cy="16.4" r=".55"/><circle cx="23.5" cy="15.8" r=".55"/><circle cx="24.5" cy="15.8" r=".55"/><circle cx="25.5" cy="16.4" r=".55"/></g></g></svg>',
  roomL: '<svg viewBox="0 0 48 48" aria-hidden="true"><g transform="translate(24 44.2) scale(1) translate(-24 -44.2)"><ellipse cx="24" cy="44.2" rx="18" ry="2.4" fill="#3d2f26" opacity=".12"/><rect x="8.5" y="21" width="31" height="23" rx="2.5" fill="#e2f1e5"/><path d="M8.5 28h31M8.5 35.5h31" stroke="#b3d4bb" stroke-width="1.4"/><path d="M17.5 44V33a6.5 6.5 0 0 1 13 0v11z" fill="#3e6448"/><path d="M24 3.5 45 23.2a1.8 1.8 0 0 1-1.2 3.1H4.2A1.8 1.8 0 0 1 3 23.2z" fill="#5f8d6a"/><path d="M3.6 23.6h40.8a1.8 1.8 0 0 1-.6 2.7H4.2a1.8 1.8 0 0 1-.6-2.7z" fill="#47735a"/><path d="M13 17.5 24 7.2l11 10.3" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".35"/><circle cx="24" cy="17" r="3.6" fill="#fff"/><g fill="#5f8d6a"><ellipse cx="24" cy="18" rx="1.4" ry="1.1"/><circle cx="22.5" cy="16.4" r=".55"/><circle cx="23.5" cy="15.8" r=".55"/><circle cx="24.5" cy="15.8" r=".55"/><circle cx="25.5" cy="16.4" r=".55"/></g></g></svg>',
  confirm: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="7" y="10" width="34" height="31" rx="5" fill="#fff"/><path d="M7 15a5 5 0 0 1 5-5h24a5 5 0 0 1 5 5v4H7z" fill="#ef6f7f"/><rect x="14" y="6" width="3.2" height="8" rx="1.6" fill="#6b7785"/><rect x="30.8" y="6" width="3.2" height="8" rx="1.6" fill="#6b7785"/><path d="M13 25h2M19 25h2M25 25h2M13 31h2M19 31h2M13 36.5h2" stroke="#e6d9cb" stroke-width="3" stroke-linecap="round"/><circle cx="33" cy="33" r="8" fill="#5f8d6a"/><path d="M29.4 33.2l2.6 2.6 4.8-5.2" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  checkin: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M26 8h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H26l-6-9z" fill="#f39200"/><circle cx="24.4" cy="17" r="1.6" fill="#fff"/><ellipse cx="33.4" cy="20" rx="3" ry="2.4" fill="#fff"/><circle cx="30.2" cy="16.4" r="1.2" fill="#fff"/><circle cx="32.4" cy="14.8" r="1.2" fill="#fff"/><circle cx="34.8" cy="14.8" r="1.2" fill="#fff"/><circle cx="36.8" cy="16.4" r="1.2" fill="#fff"/><path d="M22.8 17c-3 0-5 2-5.6 4.6" fill="none" stroke="#8a6748" stroke-width="1.4" stroke-linecap="round"/><path d="M19.6 31.6 31.5 43.5M27.4 39.4l2.8-2.8M30.4 42.4l2.4-2.4" stroke="#e0a800" stroke-width="3.4" stroke-linecap="round"/><circle cx="15" cy="27" r="6.2" fill="none" stroke="#f5c02c" stroke-width="3.6"/><path d="M11.6 25.2a3.8 3.8 0 0 1 2.4-2" stroke="#fff3c4" stroke-width="1.2" stroke-linecap="round"/></svg>',
  gohome: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="30.5" y="10" width="4.4" height="9" rx="1" fill="#a94a43"/><path d="M10 22 24 10l14 12v17a3 3 0 0 1-3 3H13a3 3 0 0 1-3-3z" fill="#fff4e6"/><path d="M10 34h28v5a3 3 0 0 1-3 3H13a3 3 0 0 1-3-3z" fill="#f3e2cc"/><path d="M6 23.5 24 8l18 15.5" fill="none" stroke="#c95b52" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 42v-8.5a4 4 0 0 1 8 0V42z" fill="#a9825f"/><circle cx="26" cy="38" r=".8" fill="#ffc928"/><path d="M24 28.4s-4.2-2.5-4.2-5.4a2.1 2.1 0 0 1 4.2-.6 2.1 2.1 0 0 1 4.2.6c0 2.9-4.2 5.4-4.2 5.4z" fill="#ef6f7f"/><path d="M42 30v4.4M39.8 32.2h4.4M6 31v3.4M4.3 32.7h3.4" stroke="#f39200" stroke-width="1.6" stroke-linecap="round"/></svg>',
  pets: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 13.6s-3.4-2-3.4-4.3a1.7 1.7 0 0 1 3.4-.5 1.7 1.7 0 0 1 3.4.5c0 2.3-3.4 4.3-3.4 4.3z" fill="#ef6f7f"/><circle cx="32" cy="26" r="9" fill="#c47a3a"/><path d="M32 17.4c-1.2 0-1.6 3.4-1.6 7.4h3.2c0-4-.4-7.4-1.6-7.4z" fill="#fff4e6"/><ellipse cx="32" cy="30.4" rx="5" ry="4" fill="#fff4e6"/><path d="M24.6 20c-3.6.6-4.4 7-2.6 10.4 1.2.4 2.6-.2 3.2-1.4zM39.4 20c3.6.6 4.4 7 2.6 10.4-1.2.4-2.6-.2-3.2-1.4z" fill="#7a4a24"/><circle cx="29" cy="25" r="1.15" fill="#2a1a10"/><circle cx="35" cy="25" r="1.15" fill="#2a1a10"/><ellipse cx="32" cy="28.6" rx="1.8" ry="1.3" fill="#2a1a10"/><path d="M30.9 31.4h2.2v1.3a1.1 1.1 0 0 1-2.2 0z" fill="#ef6f7f"/><path d="M9.5 23.5l.4-7 5 3.8zM22.5 23.5l-.4-7-5 3.8z" fill="#f39200"/><circle cx="16" cy="28" r="8" fill="#f7a01e"/><path d="M16 20.2v2.2M14 20.6l.5 1.8M18 20.6l-.5 1.8" stroke="#d97900" stroke-width="1.1" stroke-linecap="round"/><circle cx="13.2" cy="27.4" r="1.1" fill="#3a2a1a"/><circle cx="18.8" cy="27.4" r="1.1" fill="#3a2a1a"/><path d="M15.1 30h1.8l-.9 1z" fill="#e86a7a"/><path d="M7.5 29.5H11M8 32l3-.8M24.5 29.5H21M24 32l-3-.8" fill="none" stroke="#a8622a" stroke-width=".7" stroke-linecap="round"/></svg>',
  walk: '<svg viewBox="0 0 48 48" aria-hidden="true"><g fill="#c47a3a" opacity=".9"><ellipse cx="10" cy="40.6" rx="2.7" ry="2.2"/><circle cx="7.3" cy="37.4" r="1.05"/><circle cx="9.05" cy="35.9" r="1.05"/><circle cx="10.95" cy="35.9" r="1.05"/><circle cx="12.7" cy="37.4" r="1.05"/><ellipse cx="17" cy="30.6" rx="2.7" ry="2.2"/><circle cx="14.3" cy="27.4" r="1.05"/><circle cx="16.05" cy="25.9" r="1.05"/><circle cx="17.95" cy="25.9" r="1.05"/><circle cx="19.7" cy="27.4" r="1.05"/></g><g fill="#c47a3a" opacity=".55"><ellipse cx="9" cy="20.6" rx="2.7" ry="2.2"/><circle cx="6.3" cy="17.4" r="1.05"/><circle cx="8.05" cy="15.9" r="1.05"/><circle cx="9.95" cy="15.9" r="1.05"/><circle cx="11.7" cy="17.4" r="1.05"/></g><path d="M36 5c4.4 0 7 2.6 7 6s-2.6 6-7 6-7-2.6-7-6 2.6-6 7-6z" fill="none" stroke="#5aa9e0" stroke-width="3"/><path d="M31.5 15.5c-4 5-6.5 10.5-6.5 16" fill="none" stroke="#5aa9e0" stroke-width="3" stroke-linecap="round"/><rect x="22.5" y="30.5" width="5" height="6.5" rx="1.6" fill="#9aa6b2"/><circle cx="25" cy="40" r="2.6" fill="none" stroke="#9aa6b2" stroke-width="1.8"/></svg>',
  meds: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="13.5" y="7.5" width="13" height="7" rx="2" fill="#5f8d6a"/><path d="M15.5 9.5v3M18.5 9.5v3M21.5 9.5v3M24.5 9.5v3" stroke="#4a7356" stroke-width="1"/><rect x="11.5" y="14" width="17" height="27" rx="4.5" fill="#fbf6f0"/><rect x="11.5" y="21" width="17" height="12" fill="#fde3e6"/><path d="M20 24v6M17 27h6" stroke="#c95b52" stroke-width="2.2" stroke-linecap="round"/><path d="M14 16.5v20" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".9"/><g transform="rotate(-38 35 30)"><rect x="28" y="27" width="14" height="6.4" rx="3.2" fill="#ffd27a"/><path d="M35 27h-3.8a3.2 3.2 0 0 0 0 6.4H35z" fill="#ef6f7f"/></g><circle cx="37.5" cy="41" r="3" fill="#fff" stroke="#e6d9cb" stroke-width="1.2"/><path d="M35.6 41h3.8" stroke="#e6d9cb" stroke-width="1"/></svg>',
  carrier: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M17 14.5v-3.2a3.3 3.3 0 0 1 3.3-3.3h7.4a3.3 3.3 0 0 1 3.3 3.3v3.2" fill="none" stroke="#8a6748" stroke-width="3" stroke-linecap="round"/><rect x="6" y="14" width="36" height="27" rx="6" fill="#f39200"/><path d="M6 33h36v2a6 6 0 0 1-6 6H12a6 6 0 0 1-6-6z" fill="#d97900"/><rect x="10.5" y="18.5" width="19" height="17" rx="3.5" fill="#fff4e6"/><circle cx="17.5" cy="26.5" r="1.3" fill="#3a2a1a"/><circle cx="22.5" cy="26.5" r="1.3" fill="#3a2a1a"/><path d="M19.2 29.2h1.6l-.8.9z" fill="#e86a7a"/><path d="M15 18.5v17M20 18.5v17M25 18.5v17" stroke="#d97900" stroke-width="1.8"/><path d="M33.5 21h5M33.5 25h5M33.5 29h5" stroke="#ffd8a3" stroke-width="2" stroke-linecap="round"/><path d="M42 4.5v4M40 6.5h4M5 6v3M3.5 7.5h3" stroke="#f39200" stroke-width="1.6" stroke-linecap="round"/></svg>',
  lock: '<svg viewBox="0 0 48 48" aria-hidden="true"><defs><linearGradient id="lockBody" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd23f"/><stop offset=".55" stop-color="#ffab1a"/><stop offset="1" stop-color="#ff7a00"/></linearGradient><linearGradient id="lockShackle" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e9eef3"/><stop offset="1" stop-color="#8f9bab"/></linearGradient></defs><path d="M15 21.5v-5.5a9 9 0 0 1 18 0v5.5" fill="none" stroke="url(#lockShackle)" stroke-width="4.2" stroke-linecap="round"/><path d="M17.4 19v-3a6.6 6.6 0 0 1 9.4-6" fill="none" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".7"/><rect x="8.5" y="20" width="31" height="24" rx="7" fill="url(#lockBody)"/><path d="M13 23.5h18" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".55"/><path d="M8.5 37.5h31a6.5 6.5 0 0 1-6.5 6.5H15a6.5 6.5 0 0 1-6.5-6.5z" fill="#e86a00" opacity=".55"/><g fill="#6b3410"><ellipse cx="24" cy="34.6" rx="3.6" ry="2.9"/><circle cx="20.1" cy="30.4" r="1.45"/><circle cx="22.7" cy="28.8" r="1.45"/><circle cx="25.3" cy="28.8" r="1.45"/><circle cx="27.9" cy="30.4" r="1.45"/></g><path d="M41.5 6.5v4.4M39.3 8.7h4.4" stroke="#ff6fa5" stroke-width="1.8" stroke-linecap="round"/><path d="M5.5 14v3.4M3.8 15.7h3.4" stroke="#4fb0e8" stroke-width="1.6" stroke-linecap="round"/><circle cx="43" cy="20" r="1.3" fill="#f39200"/><path d="M40.6 31.6s-2.6-1.5-2.6-3.3a1.3 1.3 0 0 1 2.6-.4 1.3 1.3 0 0 1 2.6.4c0 1.8-2.6 3.3-2.6 3.3z" fill="#ff6fa5"/></svg>',
  money: '<svg viewBox="0 0 48 48" aria-hidden="true"><g transform="rotate(-12 18 22)"><rect x="4" y="12" width="29" height="18" rx="3.2" fill="#7fbf8c"/><rect x="7" y="15" width="23" height="12" rx="2" fill="none" stroke="#e6f4e8" stroke-width="1.2"/><circle cx="18.5" cy="21" r="3.6" fill="#e6f4e8"/><path d="M18.5 18.8v4.4M17.3 19.8h2.2a.9.9 0 0 1 0 1.8h-2a.9.9 0 0 0 0 1.8h2.4" fill="none" stroke="#5f8d6a" stroke-width=".9" stroke-linecap="round"/></g><rect x="23" y="37" width="18" height="3.6" fill="#e39a00"/><ellipse cx="32" cy="40.6" rx="9" ry="3" fill="#e39a00"/><ellipse cx="32" cy="37" rx="9" ry="3" fill="#ffd23f"/><ellipse cx="32" cy="37" rx="5.6" ry="1.7" fill="none" stroke="#f5b400" stroke-width="1"/><rect x="23" y="32.6" width="18" height="3.6" fill="#e39a00"/><ellipse cx="32" cy="36.2" rx="9" ry="3" fill="#e39a00"/><ellipse cx="32" cy="32.6" rx="9" ry="3" fill="#ffd23f"/><ellipse cx="32" cy="32.6" rx="5.6" ry="1.7" fill="none" stroke="#f5b400" stroke-width="1"/><rect x="23" y="28.2" width="18" height="3.6" fill="#e39a00"/><ellipse cx="32" cy="31.8" rx="9" ry="3" fill="#e39a00"/><ellipse cx="32" cy="28.2" rx="9" ry="3" fill="#ffd23f"/><ellipse cx="32" cy="28.2" rx="5.6" ry="1.7" fill="none" stroke="#f5b400" stroke-width="1"/><path d="M42 7v4M40 9h4M8 37v3M6.5 38.5h3" stroke="#f39200" stroke-width="1.6" stroke-linecap="round"/></svg>',
  care: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M31 19.5s-7.2-4.3-7.2-9.2a3.6 3.6 0 0 1 7.2-1 3.6 3.6 0 0 1 7.2 1c0 4.9-7.2 9.2-7.2 9.2z" fill="#ef6f7f"/><path d="M26.3 9.6a1.8 1.8 0 0 1 2.4-.7" fill="none" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".7"/><ellipse cx="14.5" cy="26.5" rx="2.6" ry="2" fill="#b5733f"/><ellipse cx="19.5" cy="25.2" rx="2.6" ry="2" fill="#d08a4c"/><ellipse cx="24.5" cy="26.4" rx="2.6" ry="2" fill="#b5733f"/><ellipse cx="29.5" cy="25.4" rx="2.6" ry="2" fill="#d08a4c"/><ellipse cx="34" cy="26.8" rx="2.4" ry="1.9" fill="#b5733f"/><path d="M8.5 30h31l-3 8.8A3.4 3.4 0 0 1 33.3 41H14.7a3.4 3.4 0 0 1-3.2-2.2z" fill="#c95b52"/><rect x="6" y="27" width="36" height="4.6" rx="2.3" fill="#e57d72"/><circle cx="24" cy="36.4" r="1.8" fill="#fff" opacity=".9"/><circle cx="21" cy="33.8" r=".9" fill="#fff" opacity=".9"/><circle cx="24" cy="33" r=".9" fill="#fff" opacity=".9"/><circle cx="27" cy="33.8" r=".9" fill="#fff" opacity=".9"/></svg>'
};
// Illustrated groomer avatars (fictional characters, not real staff photos), picked by StaffID so each groomer keeps the same face
const GROOMER_LOOKS = [
  { bg: '#d9ecfa', skin: '#f6d2b4', hair: '#3a2a1a', apron: '#f39200', style: 'short' },
  { bg: '#dcefe0', skin: '#e9b892', hair: '#5b3a24', apron: '#5f8d6a', style: 'bob' },
  { bg: '#fbe1e5', skin: '#f2c7a5', hair: '#1f1a17', apron: '#ef6f7f', style: 'ponytail' },
  { bg: '#e9e2f6', skin: '#d39a72', hair: '#2a1d16', apron: '#8f7bb8', style: 'bun' },
  { bg: '#ffe8cc', skin: '#f6d2b4', hair: '#8a5a3b', apron: '#5a9fd4', style: 'curly' },
  { bg: '#f1e4d4', skin: '#e9b892', hair: '#3a2a1a', apron: '#c47a3a', style: 'cap' },
];
const GROOMER_HAIR_BACK = {
  bob: (c) => `<path d="M14.5 31V20a9.5 9.5 0 0 1 19 0v11z" fill="${c}"/>`,
  ponytail: (c) => `<path d="M31 13c5 0 7 4 6 9-1 4-3 6-5 7 1-4 1-8-1-11z" fill="${c}"/>`,
  bun: (c) => `<circle cx="24" cy="9.5" r="4.6" fill="${c}"/>`,
  curly: (c) => `<g fill="${c}"><circle cx="16" cy="17" r="4"/><circle cx="20" cy="12.5" r="4.2"/><circle cx="26" cy="11.5" r="4.4"/><circle cx="31.5" cy="15" r="4"/><circle cx="33" cy="21" r="3.2"/><circle cx="15" cy="22" r="3.2"/></g>`,
};
const GROOMER_HAIR_FRONT = {
  short: (c) => `<path d="M15.6 21c-.6-6.6 3.4-10.6 8.4-10.6s9 4 8.4 10.6c-1.2-3.6-4-5.6-8.4-5.6s-7.2 2-8.4 5.6z" fill="${c}"/>`,
  bob: (c) => `<path d="M15.4 21c.4-6.2 3.8-9.8 8.6-9.8s8.2 3.6 8.6 9.8c-3.4-.6-6.4-2.6-8-5.6-1.8 3.2-5 5.2-9.2 5.6z" fill="${c}"/>`,
  ponytail: (c) => `<path d="M15.6 21c-.2-6.4 3.6-10.4 8.4-10.4s8.6 4 8.4 10.4c-2.6-1.6-4.4-3.8-5.4-6.2-2.4 3-6.2 5.2-11.4 6.2z" fill="${c}"/>`,
  bun: (c) => `<path d="M15.6 21c-.4-6.2 3.6-10 8.4-10s8.8 3.8 8.4 10c-1.6-3.4-4.4-5.2-8.4-5.2s-6.8 1.8-8.4 5.2z" fill="${c}"/>`,
  curly: (c) => `<g fill="${c}"><circle cx="19" cy="15" r="3.4"/><circle cx="24" cy="13.6" r="3.6"/><circle cx="29" cy="15" r="3.4"/></g>`,
  cap: () => '<path d="M15.2 19.5c0-5.6 3.9-9.3 8.8-9.3s8.8 3.7 8.8 9.3z" fill="#f39200"/><path d="M15 19.2h22.5a1.6 1.6 0 0 1 0 3.2H15z" fill="#d97900"/><circle cx="24" cy="10.6" r="1.3" fill="#d97900"/><path d="M21.3 15.6c.5-1 1.6-1.6 2.7-1.6s2.2.6 2.7 1.6" fill="none" stroke="#fff" stroke-width="1.1" stroke-linecap="round"/>',
};
function groomerAvatar(staffId) {
  const look = GROOMER_LOOKS[Math.abs(Number(staffId) || 0) % GROOMER_LOOKS.length];
  const back = GROOMER_HAIR_BACK[look.style], front = GROOMER_HAIR_FRONT[look.style];
  return `<svg viewBox="7 6 34 34" aria-hidden="true"><rect width="48" height="48" fill="${look.bg}"/>`
    + `<path d="M7 49c0-9.5 7.6-15 17-15s17 5.5 17 15z" fill="#fffaf3"/>`
    + `<path d="M16.5 36.5h15V49h-15z" fill="${look.apron}"/><path d="M16.5 36.5 14 34.2M31.5 36.5 34 34.2" stroke="${look.apron}" stroke-width="1.6" stroke-linecap="round"/>`
    + `<g fill="#fff" opacity=".9"><ellipse cx="24" cy="43.4" rx="2.2" ry="1.8"/><circle cx="21.5" cy="40.6" r=".95"/><circle cx="23.1" cy="39.5" r=".95"/><circle cx="24.9" cy="39.5" r=".95"/><circle cx="26.5" cy="40.6" r=".95"/></g>`
    + (back ? back(look.hair) : '')
    + `<rect x="21" y="27" width="6" height="8" rx="2.6" fill="${look.skin}"/><rect x="21" y="29.5" width="6" height="2.2" fill="#000" opacity=".07"/>`
    + `<circle cx="15.8" cy="22.4" r="1.9" fill="${look.skin}"/><circle cx="32.2" cy="22.4" r="1.9" fill="${look.skin}"/>`
    + `<ellipse cx="24" cy="21.6" rx="8.2" ry="9" fill="${look.skin}"/>`
    + front(look.hair)
    + `<circle cx="20.8" cy="22.4" r="1.05" fill="#2a1d16"/><circle cx="27.2" cy="22.4" r="1.05" fill="#2a1d16"/><circle cx="21.15" cy="22" r=".35" fill="#fff"/><circle cx="27.55" cy="22" r=".35" fill="#fff"/>`
    + `<circle cx="19" cy="25.2" r="1.4" fill="#f08c8c" opacity=".35"/><circle cx="29" cy="25.2" r="1.4" fill="#f08c8c" opacity=".35"/>`
    + `<path d="M21.6 25.8q2.4 2.1 4.8 0" fill="none" stroke="#8a4a2a" stroke-width="1.05" stroke-linecap="round"/></svg>`;
}
const SERVICE_ART_KEYS = [[/อาบน้ำ/,'bath'],[/ตัดขน/,'scissors'],[/ตัดเล็บ/,'nail'],[/สปา/,'spa'],[/โรงแรม|ห้องพัก/,'hotel'],[/เดินเล่น/,'walk'],[/ป้อนยา|ดูแลพิเศษ/,'meds']];
const serviceArtKey = (nameOrKey) => (SERVICE_ART[nameOrKey] ? nameOrKey : (SERVICE_ART_KEYS.find(([re]) => re.test(nameOrKey)) || [null,'care'])[1]);
const serviceArtBox = (nameOrKey, tag = 'div') => {
  const key = serviceArtKey(nameOrKey);
  return `<${tag} class="icon-box art-box tone-${key}">${SERVICE_ART[key]}</${tag}>`;
};

function trackerSteps(b) {
  const inHouse = b.Status === 'CheckedIn', over = b.Status === 'Completed';
  const grooming = (b.grooming || []).filter((g) => g.Status !== 'Cancelled');
  const extras = b.extras || [];
  const jobs = [
    ...grooming.map((g) => ({ job: 'grooming', id: g.BookingGroomingID, label: g.ServiceName, status: g.Status, working: 'กำลัง' + g.ServiceName })),
    ...extras.map((x) => ({ job: 'extra', id: x.ExtraID, label: x.ExtraName, status: x.Status, working: x.ExtraName + ' (กำลังทำ)' })),
  ];
  const steps = [{ type: 'checkin', icon: icon('calendar'), art: 'confirm', label: b.RoomNo ? 'รอเข้าพัก' : 'รอเข้ารับบริการ', state: b.Status === 'Confirmed' ? 'now' : 'done' }];
  if (b.RoomNo) { const moved = jobs.some((j) => j.status !== 'Waiting'); steps.push({ type: 'rest', icon: icon('bed'), art: 'hotel', label: 'กำลังพักผ่อน', state: over || (inHouse && moved) ? 'done' : 'todo' }); }
  for (const j of jobs) steps.push({ ...j, type: j.job, icon: serviceIcon(j.label), art: serviceArtKey(j.label), label: j.status === 'InProgress' ? j.working : j.label, state: over || j.status === 'Done' ? 'done' : j.status === 'InProgress' ? 'now' : 'todo' });
  if (grooming.length) { const allDone = grooming.every((g) => g.Status === 'Done'); steps.push({ type: 'ready', icon: icon('sparkle'), art: 'carrier', label: 'พร้อมกลับบ้าน', state: over ? 'done' : inHouse && allDone ? 'now' : 'todo' }); }
  steps.push({ type: 'checkout', icon: icon('home'), art: 'gohome', label: 'กลับบ้านแล้ว', state: over ? 'now' : 'todo' });
  if (inHouse && !steps.some((s) => s.state === 'now')) { const next = steps.find((s) => s.state === 'todo'); if (next) next.state = 'now'; }
  return steps;
}

// art: full-colour illustrations (customer view); a completed booking shows every step as done
function trackerHtml(b, admin = false, art = false) {
  if (b.Status === 'Cancelled') return '<div class="note" style="background:var(--red-soft);color:#9b2c2c">การจองนี้ถูกยกเลิกแล้ว</div>';
  const btn = (text, attrs, cls = '', disabled = false) => `<button class="sm ${cls}" ${attrs} ${disabled ? 'disabled title="ต้องเช็กอินก่อน"' : ''}>${text}</button>`;
  const action = (s) => {
    if (!admin) return '';
    const inHouse = b.Status === 'CheckedIn';
    if (s.type === 'checkin' && b.Status === 'Confirmed') return btn('เช็กอิน', `data-t="checkin" data-bk="${b.BookingID}"`);
    if (s.type === 'checkout' && inHouse) return btn('เช็กเอาต์', `data-t="checkout" data-bk="${b.BookingID}"`, 'teal');
    if ((s.type === 'grooming' || s.type === 'extra') && (b.Status === 'Confirmed' || inHouse) && s.status !== 'Done') {
      const next = s.status === 'InProgress' ? 'Done' : 'InProgress';
      return btn(next === 'Done' ? 'เสร็จ' : 'เริ่ม', `data-t="${s.type}" data-bk="${b.BookingID}" data-id="${s.id}" data-s="${next}"`, next === 'Done' ? 'teal' : '', !inHouse);
    }
    return '';
  };
  const steps = trackerSteps(b);
  if (art && b.Status === 'Completed') steps.forEach((s) => (s.state = 'done'));
  return `<div class="tracker${art ? ' tracker-art' : ''}">${steps.map((s) => `<div class="st ${s.state === 'done' ? 'done' : ''} ${s.state === 'now' ? 'now' : ''}"><div class="dot">${art ? SERVICE_ART[s.art] : s.icon}</div>${esc(s.label)}${admin ? `<div class="act">${action(s)}</div>` : ''}</div>`).join('')}</div>`;
}

function bindTrackerActions(root, done) {
  root.querySelectorAll('button[data-t]').forEach((el) => (el.onclick = async () => {
    const { t, bk, id, s } = el.dataset;
    const url = t === 'grooming' ? `/api/admin/grooming/${id}/status` : t === 'extra' ? `/api/admin/bookings/${bk}/extras/${id}/status` : `/api/admin/bookings/${bk}/${t}`;
    el.disabled = true;
    try { await api(url, { method: 'POST', body: s ? { status: s } : {} }); toast('บันทึกแล้ว', 'ok'); done(); }
    catch (e) { el.disabled = false; toast(e.message, 'error'); }
  }));
}

hydrateBrandLockups();
