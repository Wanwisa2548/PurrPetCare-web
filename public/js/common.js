// ===== ใช้ร่วมกันทุกหน้า =====
async function api(url, options = {}) {
  const opts = { headers: { 'Content-Type': 'application/json' }, ...options };
  if (opts.body && typeof opts.body !== 'string') opts.body = JSON.stringify(opts.body);
  const res = await fetch(url, opts);
  let data = null;
  try { data = await res.json(); } catch (_) { /* no body */ }
  if (!res.ok) throw new Error((data && data.error) || `เกิดข้อผิดพลาด (${res.status})`);
  return data;
}

function toast(msg, type = '') {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
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
function ymd(date) {
  const p = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}
function addDays(s, n) { const [y, m, d] = s.split('-').map(Number); return ymd(new Date(y, m - 1, d + n)); }

const STATUS_TH = {
  Available: 'ว่าง', Occupied: 'มีน้องพัก', Cleaning: 'รอทำความสะอาด', Maintenance: 'ปิดซ่อม',
  Confirmed: 'ยืนยันแล้ว', CheckedIn: 'เช็กอินแล้ว', Completed: 'เสร็จสิ้น', Cancelled: 'ยกเลิก',
  Waiting: 'รอคิว', InProgress: 'กำลังทำ', Done: 'เสร็จแล้ว',
};
const badge = (st) => `<span class="badge b-${esc(st)}">${esc(STATUS_TH[st] || st)}</span>`;

// แถบเมนูด้านบน
async function renderTopbar(active) {
  const me = await api('/api/auth/me').catch(() => ({}));
  const links = [
    ['index.html', 'หน้าแรก'], ['pets.html', 'น้องของฉัน'], ['book.html', 'จองบริการ'], ['bookings.html', 'ติดตามสถานะ'],
  ];
  const nav = links.map(([h, t]) => `<a href="${h}" class="${h === active ? 'active' : ''}">${t}</a>`).join('');
  const who = me.customer
    ? `<span>สวัสดี ${esc(me.customer.name)}</span><button class="ghost sm" id="logoutBtn">ออกจากระบบ</button>`
    : `<a href="index.html#login">เข้าสู่ระบบ</a>`;
  const bar = document.createElement('header');
  bar.className = 'topbar';
  bar.innerHTML = `<div class="inner"><a class="logo" href="index.html"><span class="paw">🐾</span>PurrPet Care</a>
    <nav class="nav">${nav}</nav><div class="who">${who}<a href="admin.html" class="small">Admin</a></div></div>`;
  document.body.prepend(bar);
  const lo = document.getElementById('logoutBtn');
  if (lo) lo.onclick = async () => { await api('/api/auth/logout', { method: 'POST' }); location.href = 'index.html'; };
  return me;
}

// หน้าที่ต้องล็อกอิน
async function requireCustomer(active) {
  const me = await renderTopbar(active);
  if (!me.customer) { location.href = 'index.html#login'; throw new Error('not logged in'); }
  return me.customer;
}

// ===== Status Tracker: สร้างขั้นตอนจากบริการที่ลูกค้าเลือกจริง (ใช้ทั้งหน้าลูกค้าและ Admin) =====
const SERVICE_ICONS = [[/อาบน้ำ/, '🛁'], [/ตัดขน/, '✂️'], [/ตัดเล็บ/, '💅'], [/สปา/, '🧖'], [/เดินเล่น/, '🦮'], [/อาหาร/, '🍖'], [/ป้อนยา|ดูแล/, '💊']];
const serviceIcon = (name) => (SERVICE_ICONS.find(([re]) => re.test(name)) || [null, '🐾'])[1];

function trackerSteps(b) {
  const inHouse = b.Status === 'CheckedIn', over = b.Status === 'Completed';
  const grooming = (b.grooming || []).filter((g) => g.Status !== 'Cancelled');
  const extras = b.extras || [];
  const jobs = [
    ...grooming.map((g) => ({ job: 'grooming', id: g.BookingGroomingID, label: g.ServiceName, status: g.Status, working: 'กำลัง' + g.ServiceName })),
    ...extras.map((x) => ({ job: 'extra', id: x.ExtraID, label: x.ExtraName, status: x.Status, working: x.ExtraName + ' (กำลังทำ)' })),
  ];

  const steps = [{ type: 'checkin', icon: '📅', label: b.RoomNo ? 'รอเข้าพัก' : 'รอเข้ารับบริการ', state: b.Status === 'Confirmed' ? 'now' : 'done' }];
  if (b.RoomNo) {
    const moved = jobs.some((j) => j.status !== 'Waiting');
    steps.push({ type: 'rest', icon: '🛏️', label: 'กำลังพักผ่อน', state: over || (inHouse && moved) ? 'done' : 'todo' });
  }
  for (const j of jobs) {
    steps.push({ ...j, type: j.job, icon: serviceIcon(j.label),
      label: j.status === 'InProgress' ? j.working : j.label,
      state: over || j.status === 'Done' ? 'done' : j.status === 'InProgress' ? 'now' : 'todo' });
  }
  if (grooming.length) {
    const allDone = grooming.every((g) => g.Status === 'Done');
    steps.push({ type: 'ready', icon: '✨', label: 'หล่อพร้อมกลับบ้าน', state: over ? 'done' : inHouse && allDone ? 'now' : 'todo' });
  }
  steps.push({ type: 'checkout', icon: '🏠', label: 'กลับบ้านแล้ว', state: over ? 'now' : 'todo' });

  // น้องอยู่ในร้านแต่ยังไม่มีขั้นไหนกำลังทำ -> ไฮไลต์ขั้นถัดไป
  if (inHouse && !steps.some((s) => s.state === 'now')) steps.find((s) => s.state === 'todo').state = 'now';
  return steps;
}

// admin = true จะมีปุ่มกดอัปเดตสถานะใต้แต่ละขั้น
function trackerHtml(b, admin = false) {
  if (b.Status === 'Cancelled') return '<div class="note" style="background:var(--red-soft);color:#9b2c2c">การจองนี้ถูกยกเลิกแล้ว</div>';
  const btn = (text, attrs, cls = '', disabled = false) =>
    `<button class="sm ${cls}" ${attrs} ${disabled ? 'disabled title="ต้องเช็กอินก่อน"' : ''}>${text}</button>`;
  const action = (s) => {
    if (!admin) return '';
    const inHouse = b.Status === 'CheckedIn';
    if (s.type === 'checkin' && b.Status === 'Confirmed') return btn('เช็กอิน', `data-t="checkin" data-bk="${b.BookingID}"`);
    if (s.type === 'checkout' && inHouse) return btn('เช็กเอาต์', `data-t="checkout" data-bk="${b.BookingID}"`, 'teal');
    if ((s.type === 'grooming' || s.type === 'extra') && (b.Status === 'Confirmed' || inHouse) && s.status !== 'Done') {
      const next = s.status === 'InProgress' ? 'Done' : 'InProgress';
      const attrs = `data-t="${s.type}" data-bk="${b.BookingID}" data-id="${s.id}" data-s="${next}"`;
      return btn(next === 'Done' ? 'เสร็จ' : 'เริ่ม', attrs, next === 'Done' ? 'teal' : '', !inHouse);
    }
    return '';
  };
  return `<div class="tracker">${trackerSteps(b).map((s) => `
    <div class="st ${s.state === 'done' ? 'done' : ''} ${s.state === 'now' ? 'now' : ''}">
      <div class="dot">${s.icon}</div>${esc(s.label)}${admin ? `<div class="act">${action(s)}</div>` : ''}</div>`).join('')}</div>`;
}

// ผูกปุ่มใน tracker ของ Admin เข้ากับ API (done = ฟังก์ชันที่เรียกหลังอัปเดตสำเร็จ)
function bindTrackerActions(root, done) {
  root.querySelectorAll('button[data-t]').forEach((el) => (el.onclick = async () => {
    const { t, bk, id, s } = el.dataset;
    const url = t === 'grooming' ? `/api/admin/grooming/${id}/status`
      : t === 'extra' ? `/api/admin/bookings/${bk}/extras/${id}/status`
      : `/api/admin/bookings/${bk}/${t}`;
    try { await api(url, { method: 'POST', body: s ? { status: s } : {} }); toast('บันทึกแล้ว', 'ok'); done(); }
    catch (e) { toast(e.message, 'error'); }
  }));
}
