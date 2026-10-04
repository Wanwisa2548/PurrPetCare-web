require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const { friendlyError } = require('./db');

const app = express();
app.use(express.json({ limit: '3mb' })); // pet photos arrive as base64 in the add-pet request
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'purrpet-dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 8 },
  })
);

app.use('/api/auth', require('./routes/auth'));
app.use('/api', require('./routes/customer'));
app.use('/api/admin', require('./routes/admin'));

app.use(express.static(path.join(__dirname, '..', 'public')));

// error กลาง: ส่งข้อความจาก Database (RAISERROR) กลับไปแสดงบนหน้าเว็บ
app.use((err, req, res, next) => {
  const msg = friendlyError(err);
  const isDbDown = /Failed to connect|ECONNREFUSED|ETIMEOUT|Login failed/i.test(err.message || '');
  if (isDbDown) console.error('[DB]', err.message);
  else if (!err.number) console.error(err);
  res.status(isDbDown ? 503 : 400).json({ error: isDbDown ? 'ต่อฐานข้อมูลไม่ได้: ' + err.message : msg });
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log(`PurrPet Care พร้อมใช้งานที่ http://localhost:${port}`);
  console.log(`หน้า Admin: http://localhost:${port}/admin.html`);
});
