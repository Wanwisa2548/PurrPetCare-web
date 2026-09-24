const sql = require('mssql');

const config = {
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'PurrPetCare',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    useUTC: false, // เก็บ/อ่านเวลาเป็นเวลาเครื่อง (ไทย) ตรงกับที่เห็นใน SSMS
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
};
if (process.env.DB_PORT) config.port = Number(process.env.DB_PORT);
else if (process.env.DB_INSTANCE) config.options.instanceName = process.env.DB_INSTANCE;

let poolPromise;
function getPool() {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(config).connect().catch((err) => {
      poolPromise = undefined;
      throw err;
    });
  }
  return poolPromise;
}

// ส่งคำสั่ง SQL แบบมีพารามิเตอร์ (กัน SQL Injection)
// params: { ชื่อ: [sql.Type, ค่า] }
async function query(text, params = {}) {
  const pool = await getPool();
  const req = pool.request();
  for (const [name, [type, value]] of Object.entries(params)) req.input(name, type, value);
  const result = await req.query(text);
  return result.recordset || [];
}

async function exec(procName, params = {}) {
  const pool = await getPool();
  const req = pool.request();
  for (const [name, [type, value]] of Object.entries(params)) {
    if (value instanceof sql.Table) req.input(name, value); // Table-Valued Parameter
    else req.input(name, type, value);
  }
  const result = await req.execute(procName);
  return result.recordset || [];
}

// ดึงข้อความ error ที่อ่านรู้เรื่อง (ข้อความจาก RAISERROR ใน Procedure/Trigger)
const NOISE = new Set([3609, 3616, 266]); // "transaction ended in the trigger" ฯลฯ
function friendlyError(err) {
  const all = [...(err.precedingErrors || []), err];
  const hit = all.find((e) => e && e.message && !NOISE.has(e.number));
  const msg = (hit || err).message || 'เกิดข้อผิดพลาด';
  if (/rule/i.test(msg) && /PhoneNo|Phone/i.test(msg)) return 'เบอร์โทรต้องเป็นตัวเลข 10 หลัก ขึ้นต้นด้วย 0';
  if (/CHECK constraint/i.test(msg)) return 'ข้อมูลไม่ผ่านเงื่อนไขของฐานข้อมูล: ' + msg;
  return msg;
}

// แปลง "2026-09-25" หรือ "2026-09-25T10:00" เป็น Date ตามเวลาเครื่อง
function toLocalDate(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?$/.exec(String(s || ''));
  if (!m) return null;
  return new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0));
}

module.exports = { sql, getPool, query, exec, friendlyError, toLocalDate, config };
