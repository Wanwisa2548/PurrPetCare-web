// รัน: npm run check-db   เพื่อทดสอบว่าเว็บต่อฐานข้อมูลได้หรือไม่
require('dotenv').config();
const { query, config } = require('./db');

(async () => {
  const where = config.port ? `${config.server}:${config.port}` : `${config.server}\\${config.options.instanceName || ''}`;
  console.log(`กำลังต่อ ${where}  ฐานข้อมูล ${config.database}  ผู้ใช้ ${config.user} ...`);
  try {
    const rows = await query(`
      SELECT (SELECT COUNT(*) FROM hotel.Rooms)       AS Rooms,
             (SELECT COUNT(*) FROM customer.Pets)     AS Pets,
             (SELECT COUNT(*) FROM grooming.Services) AS Services,
             OBJECT_ID('booking.sp_CreateBooking')    AS HasPhase2`);
    const r = rows[0];
    console.log('✔ ต่อฐานข้อมูลสำเร็จ', r);
    if (!r.HasPhase2) console.log('✘ ยังไม่เจอ booking.sp_CreateBooking  → รัน PurrPetCare_Phase2.sql ก่อน');
    process.exit(0);
  } catch (err) {
    console.error('✘ ต่อไม่ได้:', err.message);
    console.error('  ดูหัวข้อ "แก้ปัญหาต่อฐานข้อมูลไม่ได้" ใน README.md');
    process.exit(1);
  }
})();
