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
const petIcon = (sp) => (sp === 'Cat' ? '🐱' : '🐶');

const TH_MONTH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
function thDate(s) { // "2026-09-25" หรือ "2026-09-25 10:00"
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
