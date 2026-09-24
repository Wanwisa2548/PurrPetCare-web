const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { sql, exec } = require('../db');

const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

// สมัครสมาชิก -> customer.sp_RegisterCustomer
router.post('/register', wrap(async (req, res) => {
  const { fullName, phone, email, password } = req.body || {};
  if (!fullName || !phone || !email || !password) return res.status(400).json({ error: 'กรอกข้อมูลให้ครบ' });
  // รูปแบบเบอร์โทรให้ Rule rl_Phone ในฐานข้อมูลเป็นคนตรวจ (โชว์ตอนนำเสนอได้)
  if (String(phone).length > 10) return res.status(400).json({ error: 'เบอร์โทรต้องเป็นตัวเลข 10 หลัก ขึ้นต้นด้วย 0' });
  if (password.length < 4) return res.status(400).json({ error: 'รหัสผ่านอย่างน้อย 4 ตัวอักษร' });

  const hash = await bcrypt.hash(password, 10);
  const rows = await exec('customer.sp_RegisterCustomer', {
    FullName: [sql.NVarChar(100), fullName.trim()],
    Phone: [sql.VarChar(10), phone],
    Email: [sql.VarChar(100), email.trim().toLowerCase()],
    PasswordHash: [sql.VarChar(255), hash],
  });
  req.session.customer = { id: rows[0].CustomerID, name: rows[0].FullName };
  res.json(req.session.customer);
}));

// เข้าสู่ระบบ -> customer.sp_GetCustomerLogin
router.post('/login', wrap(async (req, res) => {
  const { email, password } = req.body || {};
  const rows = await exec('customer.sp_GetCustomerLogin', {
    Email: [sql.VarChar(100), String(email || '').trim().toLowerCase()],
  });
  const c = rows[0];
  // ลูกค้าตัวอย่างจาก Phase 1 เก็บ 'demo-hash' ไว้ ให้ใช้รหัส 1234 เข้าได้
  const ok = c && (c.PasswordHash === 'demo-hash' ? password === '1234' : await bcrypt.compare(String(password || ''), c.PasswordHash));
  if (!ok) return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
  req.session.customer = { id: c.CustomerID, name: c.FullName };
  res.json(req.session.customer);
}));

router.post('/logout', (req, res) => req.session.destroy(() => res.json({ ok: true })));

router.get('/me', (req, res) => res.json({ customer: req.session.customer || null, admin: !!req.session.admin }));

module.exports = router;
