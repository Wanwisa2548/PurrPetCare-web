const router = require('express').Router();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { sql, query, exec, toLocalDate } = require('../db');

const PET_UPLOAD_DIR = path.join(__dirname, '..', '..', 'public', 'uploads', 'pets');
const MAX_PET_PHOTO_BYTES = 2 * 1024 * 1024;
// Saves a data:image/... URL from the add-pet form. The type is checked from the file's own bytes, not the header.
function savePetPhoto(dataUrl) {
  const m = /^data:image\/(?:jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl));
  if (!m) return { error: 'ไฟล์รูปไม่ถูกต้อง' };
  const buf = Buffer.from(m[1], 'base64');
  if (buf.length > MAX_PET_PHOTO_BYTES) return { error: 'รูปใหญ่เกิน 2 MB' };
  const ext = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff ? 'jpg'
    : buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) ? 'png'
    : buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP' ? 'webp' : null;
  if (!ext) return { error: 'รองรับเฉพาะไฟล์ JPG, PNG หรือ WEBP' };
  fs.mkdirSync(PET_UPLOAD_DIR, { recursive: true });
  const name = `${crypto.randomUUID()}.${ext}`;
  const file = path.join(PET_UPLOAD_DIR, name);
  fs.writeFileSync(file, buf);
  return { url: `/uploads/pets/${name}`, file };
}

const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);
function needLogin(req, res, next) {
  if (!req.session.customer) return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบก่อน' });
  next();
}

/* ---------- ข้อมูลตั้งต้น (บริการ / บริการเสริม / ประเภทห้อง) ---------- */
router.get('/catalog', wrap(async (req, res) => {
  const [services, extras, roomTypes] = await Promise.all([
    query('SELECT ServiceID, ServiceName, BasePrice, DurationMin FROM grooming.Services WHERE IsActive = 1 ORDER BY ServiceID'),
    query('SELECT ExtraID, ExtraName, Unit, Price FROM booking.Extras ORDER BY ExtraID'),
    query('SELECT RoomSize, TypeName, MaxWeightKg, PricePerNight FROM hotel.RoomTypes ORDER BY PricePerNight'),
  ]);
  res.json({ services, extras, roomTypes });
}));

/* ---------- Pet Profile ---------- */
router.get('/pets', needLogin, wrap(async (req, res) => {
  const rows = await query(
    `SELECT PetID, PetName, Species, Breed, Gender, CONVERT(char(10), BirthDate, 23) AS BirthDate,
            WeightKg, WeightClass, MedicalNotes, PhotoURL
     FROM customer.vw_PetProfiles WHERE CustomerID = @cid ORDER BY PetID`,
    { cid: [sql.Int, req.session.customer.id] }
  );
  res.json(rows);
}));

router.post('/pets', needLogin, wrap(async (req, res) => {
  const b = req.body || {};
  if (!b.petName || !b.species || !b.weightKg) return res.status(400).json({ error: 'กรอกชื่อ ชนิด และน้ำหนักของน้อง' });
  const photo = b.photoData ? savePetPhoto(b.photoData) : null;
  if (photo && photo.error) return res.status(400).json({ error: photo.error });
  const rows = await exec('customer.sp_AddPet', {
    CustomerID: [sql.Int, req.session.customer.id],
    PetName: [sql.NVarChar(50), b.petName.trim()],
    Species: [sql.VarChar(3), b.species],
    Breed: [sql.NVarChar(50), b.breed || null],
    Gender: [sql.Char(1), b.gender || null],
    BirthDate: [sql.Date, b.birthDate ? toLocalDate(b.birthDate) : null],
    WeightKg: [sql.Decimal(5, 2), Number(b.weightKg)],
    MedicalNotes: [sql.NVarChar(500), b.medicalNotes || null],
    PhotoURL: [sql.VarChar(255), photo ? photo.url : b.photoURL || null],
  }).catch((err) => { if (photo) fs.unlink(photo.file, () => {}); throw err; });
  res.json(rows[0]);
}));

/* ---------- ราคาอาบน้ำตัดขนของน้องตัวนี้ (เรียก fn_CalculateGroomingPrice) ---------- */
router.get('/grooming-prices', needLogin, wrap(async (req, res) => {
  const rows = await query(
    `SELECT s.ServiceID, s.ServiceName, s.DurationMin, s.BasePrice,
            booking.fn_CalculateGroomingPrice(p.PetID, s.ServiceID) AS Price
     FROM grooming.Services s
     CROSS JOIN customer.Pets p
     WHERE s.IsActive = 1 AND p.PetID = @pid AND p.CustomerID = @cid
     ORDER BY s.ServiceID`,
    { pid: [sql.Int, Number(req.query.petId)], cid: [sql.Int, req.session.customer.id] }
  );
  res.json(rows);
}));

/* ---------- ห้องว่าง (hotel.fn_AvailableRooms) ---------- */
router.get('/rooms/available', needLogin, wrap(async (req, res) => {
  const checkIn = toLocalDate(req.query.checkIn);
  const checkOut = toLocalDate(req.query.checkOut);
  if (!checkIn || !checkOut || checkOut <= checkIn) return res.status(400).json({ error: 'เลือกวันเช็กอิน/เช็กเอาต์ให้ถูกต้อง' });
  const rows = await query(
    `SELECT a.RoomID, a.RoomNo, a.RoomSize, a.TypeName, a.PricePerNight
     FROM customer.Pets p
     CROSS APPLY hotel.fn_AvailableRooms(@in, @out, p.WeightClass) a
     WHERE p.PetID = @pid AND p.CustomerID = @cid
     ORDER BY a.PricePerNight, a.RoomNo`,
    {
      in: [sql.Date, checkIn], out: [sql.Date, checkOut],
      pid: [sql.Int, Number(req.query.petId)], cid: [sql.Int, req.session.customer.id],
    }
  );
  res.json(rows);
}));

/* ---------- ช่างว่าง (grooming.fn_AvailableGroomers) ---------- */
router.get('/groomers/available', needLogin, wrap(async (req, res) => {
  const start = toLocalDate(req.query.start);
  const minutes = Number(req.query.minutes);
  if (!start || !minutes) return res.status(400).json({ error: 'เลือกวัน เวลา และบริการก่อน' });
  const end = new Date(start.getTime() + minutes * 60000);
  const rows = await query(
    'SELECT StaffID, FullName FROM grooming.fn_AvailableGroomers(@s, @e) ORDER BY StaffID',
    { s: [sql.DateTime, start], e: [sql.DateTime, end] }
  );
  res.json(rows);
}));

/* ---------- จองแบบรวบยอด (booking.sp_CreateBooking + Table-Valued Parameter) ---------- */
router.post('/bookings', needLogin, wrap(async (req, res) => {
  const b = req.body || {};
  const services = new sql.Table('booking.ServiceRequest');
  services.columns.add('ServiceID', sql.Int, { nullable: false });
  services.columns.add('StaffID', sql.Int, { nullable: false });
  services.columns.add('StartTime', sql.DateTime, { nullable: false });
  for (const s of b.services || []) {
    const t = toLocalDate(s.startTime);
    if (!t) return res.status(400).json({ error: 'เวลาคิวอาบน้ำไม่ถูกต้อง' });
    services.rows.add(Number(s.serviceId), Number(s.staffId), t);
  }

  const extras = new sql.Table('booking.ExtraRequest');
  extras.columns.add('ExtraID', sql.Int, { nullable: false });
  extras.columns.add('Qty', sql.Int, { nullable: false });
  for (const x of b.extras || []) if (Number(x.qty) > 0) extras.rows.add(Number(x.extraId), Number(x.qty));

  const rows = await exec('booking.sp_CreateBooking', {
    CustomerID: [sql.Int, req.session.customer.id],
    PetID: [sql.Int, Number(b.petId)],
    RoomID: [sql.Int, b.roomId ? Number(b.roomId) : null],
    CheckInDate: [sql.Date, b.roomId ? toLocalDate(b.checkIn) : null],
    CheckOutDate: [sql.Date, b.roomId ? toLocalDate(b.checkOut) : null],
    Services: [services, services],
    Extras: [extras, extras],
    Note: [sql.NVarChar(300), b.note || null],
  });
  res.json(rows[0]);
}));

/* ---------- การจองของฉัน + Status Tracker (booking.vw_BookingSummary) ---------- */
router.get('/bookings', needLogin, wrap(async (req, res) => {
  res.set('Cache-Control', 'private, no-store');
  const cid = [sql.Int, req.session.customer.id];
  const [bookings, grooming, extras] = await Promise.all([
    query(
      `SELECT b.BookingID, b.BookingNo, CONVERT(char(16), b.BookingDate, 120) AS BookingDate,
              b.Status, b.TotalPrice, b.PaidAmount, b.PetID, b.PetName, b.Species, p.PhotoURL,
              b.RoomNo, CONVERT(char(10), b.CheckInDate, 23) AS CheckInDate,
              CONVERT(char(10), b.CheckOutDate, 23) AS CheckOutDate, b.Nights, b.TrackerStage, b.Note
       FROM booking.vw_BookingSummary b
       JOIN customer.Pets p ON p.PetID = b.PetID AND p.CustomerID = b.CustomerID
       WHERE b.CustomerID = @cid
       ORDER BY b.BookingID DESC`, { cid }),
    query(
      `SELECT g.BookingID, g.ServiceName, g.StaffName, CONVERT(char(16), g.StartTime, 120) AS StartTime,
              CONVERT(char(5), g.EndTime, 108) AS EndTime, g.Price, g.Status
       FROM grooming.vw_GroomingSchedule g
       JOIN booking.vw_BookingSummary b ON b.BookingID = g.BookingID
       WHERE b.CustomerID = @cid ORDER BY g.StartTime`, { cid }),
    query(
      `SELECT x.BookingID, x.ExtraID, x.ExtraName, x.Unit, x.Qty, x.Status
       FROM booking.vw_BookingExtras x
       JOIN booking.vw_BookingSummary b ON b.BookingID = x.BookingID
       WHERE b.CustomerID = @cid ORDER BY x.ExtraID`, { cid }),
  ]);
  for (const bk of bookings) {
    bk.grooming = grooming.filter((g) => g.BookingID === bk.BookingID);
    bk.extras = extras.filter((x) => x.BookingID === bk.BookingID);
  }
  res.json(bookings);
}));

router.post('/bookings/:id/cancel', needLogin, wrap(async (req, res) => {
  await exec('booking.sp_CancelBooking', {
    BookingID: [sql.Int, Number(req.params.id)],
    CustomerID: [sql.Int, req.session.customer.id],
  });
  res.json({ ok: true });
}));

module.exports = router;
