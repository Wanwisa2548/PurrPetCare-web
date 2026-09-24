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
