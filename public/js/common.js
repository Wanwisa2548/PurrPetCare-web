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
    button.addEventListener('click', () => {
      const input = document.getElementById(button.dataset.passwordToggle);
      if (!input) return;
      const showing = input.type === 'text';
      input.type = showing ? 'password' : 'text';
      button.textContent = showing ? 'แสดง' : 'ซ่อน';
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
    <div><h3>บัญชีของฉัน</h3><a href="pets.html">น้องของฉัน</a><a href="book.html">จองบริการ</a><a href="bookings.html">ติดตามสถานะ</a></div>
    <div><h3>PurrPetCare</h3><a href="index.html#experience">แนวทางการดูแล</a><a href="customer-login.html">เข้าสู่ระบบ</a><a href="admin-login.html">สำหรับพนักงาน</a></div>
  </div><div class="footer-bottom"><span>© ${new Date().getFullYear()} PurrPetCare</span><span>PET HOTEL • GROOMING & CARE</span></div>`;
  document.body.appendChild(footer);
}

function renderNavigationDrawer(me = {}, toggle) {
  const items = [
    ['01', 'index.html', 'หน้าหลัก'],
    ['02', 'index.html#stay', 'ห้องพัก'],
    ['03', 'index.html#grooming', 'กรูมมิ่ง'],
    ['04', 'index.html#experience', 'การดูแลของเรา'],
    ['05', 'book.html', 'การจอง'],
    ['06', 'bookings.html', 'การจองของฉัน'],
  ];
  const account = me.admin
    ? `${authStatusHtml(me)}<a href="admin.html">Admin Dashboard</a><button class="drawer-text-button" type="button" data-logout>ออกจากระบบ</button>`
    : me.customer
      ? `${authStatusHtml(me)}<span class="drawer-user-name">${esc(me.customer.name)}</span><a href="pets.html">น้องของฉัน</a><a href="bookings.html">การจองของฉัน</a><button class="drawer-text-button" type="button" data-logout>ออกจากระบบ</button>`
      : `${authStatusHtml(me)}<a href="customer-login.html">เข้าสู่ระบบ</a>`;
  const adminHref = me.admin ? 'admin.html' : 'admin-login.html';
  const layer = document.createElement('div');
  layer.className = 'navigation-drawer-layer';
  layer.innerHTML = `<button class="navigation-drawer-overlay" type="button" aria-label="ปิดเมนู"></button>
    <aside class="navigation-drawer" id="main-navigation-drawer" aria-hidden="true">
      <div class="navigation-drawer__top"><a href="index.html" aria-label="PurrPetCare หน้าหลัก">${brandLockup('drawer')}</a><button class="drawer-close" type="button" aria-label="ปิดเมนู"><span></span><span></span></button></div>
      <span class="drawer-section-label">Explore</span>
      <nav class="drawer-links" aria-label="เมนูหลัก">${items.map(([number, href, label], index) => `<a href="${href}" style="--drawer-order:${index + 1}"><span>${number}</span>${label}</a>`).join('')}</nav>
      <div class="drawer-divider" aria-hidden="true"></div>
      <section class="drawer-account" aria-label="สถานะบัญชี"><span class="drawer-section-label">Account</span>${account}</section>
      <section class="drawer-admin"><span class="drawer-section-label">Admin</span><a href="${adminHref}">Admin Portal</a></section>
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
    ? [['index.html','หน้าหลัก'],['admin.html','Admin Dashboard']]
    : me.customer
    ? [['index.html','หน้าแรก'],['pets.html','น้องของฉัน'],['book.html','จองบริการ'],['bookings.html','ติดตามสถานะ']]
    : [['index.html','หน้าแรก'],['index.html#stay','ห้องพัก'],['index.html#grooming','กรูมมิ่ง'],['index.html#experience','การดูแลของเรา']];
  const nav = links.map(([h,t]) => `<a href="${h}" class="${h === active ? 'active' : ''}">${t}</a>`).join('');
  const who = me.admin
    ? `${authStatusHtml(me)}<a href="admin.html">Admin Dashboard</a><button class="ghost sm" id="logoutBtn">ออกจากระบบ</button>`
    : me.customer
      ? `${authStatusHtml(me)}<span class="nav-user">${esc(me.customer.name)}</span><a href="bookings.html">การจองของฉัน</a><button class="ghost sm" id="logoutBtn">ออกจากระบบ</button>`
      : `${authStatusHtml(me)}<a href="customer-login.html">เข้าสู่ระบบ</a><a class="btn sm" href="book.html">จองบริการ</a><a href="admin-login.html" class="admin-link">Admin</a>`;
  const bar = document.createElement('header');
  bar.className = 'topbar';
  bar.innerHTML = `<div class="inner"><button class="menu-toggle" type="button" aria-label="เปิดเมนู" aria-expanded="false" aria-controls="main-navigation-drawer"><span class="hamburger-lines" aria-hidden="true"><span></span><span></span><span></span></span></button><a class="logo" href="index.html" aria-label="PurrPetCare หน้าแรก">${brandLockup('navbar')}</a>
    <nav class="nav" aria-label="เมนูหลัก">${nav}</nav><div class="who">${who}</div></div>`;
  document.body.prepend(bar);
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

function trackerSteps(b) {
  const inHouse = b.Status === 'CheckedIn', over = b.Status === 'Completed';
  const grooming = (b.grooming || []).filter((g) => g.Status !== 'Cancelled');
  const extras = b.extras || [];
  const jobs = [
    ...grooming.map((g) => ({ job: 'grooming', id: g.BookingGroomingID, label: g.ServiceName, status: g.Status, working: 'กำลัง' + g.ServiceName })),
    ...extras.map((x) => ({ job: 'extra', id: x.ExtraID, label: x.ExtraName, status: x.Status, working: x.ExtraName + ' (กำลังทำ)' })),
  ];
  const steps = [{ type: 'checkin', icon: icon('calendar'), label: b.RoomNo ? 'รอเข้าพัก' : 'รอเข้ารับบริการ', state: b.Status === 'Confirmed' ? 'now' : 'done' }];
  if (b.RoomNo) { const moved = jobs.some((j) => j.status !== 'Waiting'); steps.push({ type: 'rest', icon: icon('bed'), label: 'กำลังพักผ่อน', state: over || (inHouse && moved) ? 'done' : 'todo' }); }
  for (const j of jobs) steps.push({ ...j, type: j.job, icon: serviceIcon(j.label), label: j.status === 'InProgress' ? j.working : j.label, state: over || j.status === 'Done' ? 'done' : j.status === 'InProgress' ? 'now' : 'todo' });
  if (grooming.length) { const allDone = grooming.every((g) => g.Status === 'Done'); steps.push({ type: 'ready', icon: icon('sparkle'), label: 'พร้อมกลับบ้าน', state: over ? 'done' : inHouse && allDone ? 'now' : 'todo' }); }
  steps.push({ type: 'checkout', icon: icon('home'), label: 'กลับบ้านแล้ว', state: over ? 'now' : 'todo' });
  if (inHouse && !steps.some((s) => s.state === 'now')) { const next = steps.find((s) => s.state === 'todo'); if (next) next.state = 'now'; }
  return steps;
}

function trackerHtml(b, admin = false) {
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
  return `<div class="tracker">${trackerSteps(b).map((s) => `<div class="st ${s.state === 'done' ? 'done' : ''} ${s.state === 'now' ? 'now' : ''}"><div class="dot">${s.icon}</div>${esc(s.label)}${admin ? `<div class="act">${action(s)}</div>` : ''}</div>`).join('')}</div>`;
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
