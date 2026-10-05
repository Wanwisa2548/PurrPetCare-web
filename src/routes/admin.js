const router = require('express').Router();
const { sql, query, exec, toLocalDate } = require('../db');

const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

router.post('/login', (req, res) => {
  if ((req.body || {}).password !== (process.env.ADMIN_PASSWORD || 'admin1234'))
    return res.status(401).json({ error: 'รหัสผ่าน Admin ไม่ถูกต้อง' });
  req.session.admin = true;
  res.json({ ok: true });
});

router.use((req, res, next) => {
  if (!req.session.admin) return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ Admin' });
  next();
});

/* ---------- Dashboard: ห้องว่าง/เต็ม + รายได้วันนี้ ---------- */
router.get('/dashboard', wrap(async (req, res) => {
  const [rooms, revenue, counts, notifications] = await Promise.all([
    query(`SELECT RoomID, RoomNo, RoomSize, TypeName, Status, BookingNo, PetName,
                  CONVERT(char(10), CheckOutDate, 23) AS CheckOutDate
           FROM hotel.vw_RoomStatusToday ORDER BY RoomNo`),
    query(`SELECT CONVERT(char(10), PayDate, 23) AS PayDate, PaymentCount, Revenue
           FROM booking.vw_DailyRevenue
           WHERE PayDate >= DATEADD(DAY, -6, CAST(GETDATE() AS date)) ORDER BY PayDate`),
    query(`SELECT
             SUM(CASE WHEN Status = 'Confirmed' THEN 1 ELSE 0 END) AS Waiting,
             SUM(CASE WHEN Status = 'CheckedIn' THEN 1 ELSE 0 END) AS InHouse,
             SUM(CASE WHEN Status = 'CheckedIn' AND CheckOutDate <= CAST(GETDATE() AS date) THEN 1 ELSE 0 END) AS LeavingToday
           FROM booking.vw_BookingSummary`),
    query(`SELECT TOP 8 n.NotificationID, s.FullName AS StaffName, n.Message,
                  CONVERT(char(16), n.CreatedAt, 120) AS CreatedAt, n.IsRead
           FROM ops.Notifications n LEFT JOIN ops.Staff s ON s.StaffID = n.StaffID
           ORDER BY n.NotificationID DESC`),
  ]);
  res.json({ rooms, revenue, counts: counts[0], notifications });
}));

/* ---------- รายการจอง ---------- */
router.get('/bookings', wrap(async (req, res) => {
  const status = req.query.status || 'active';
  const [rows, grooming, extras] = await Promise.all([
    query(
      `SELECT b.BookingID, b.BookingNo, CONVERT(char(16), b.BookingDate, 120) AS BookingDate, b.Status, b.TrackerStage,
              b.TotalPrice, b.PaidAmount, b.PetName, b.Species, b.Breed, b.WeightKg, b.MedicalNotes, p.PhotoURL,
              b.CustomerName, b.Phone, b.RoomID, b.RoomNo,
              CONVERT(char(10), b.CheckInDate, 23) AS CheckInDate, CONVERT(char(10), b.CheckOutDate, 23) AS CheckOutDate, b.Nights
       FROM booking.vw_BookingSummary b
       LEFT JOIN customer.Pets p ON p.PetID = b.PetID
       WHERE (@st = 'all') OR (@st = 'active' AND b.Status IN ('Confirmed', 'CheckedIn')) OR b.Status = @st
       ORDER BY CASE b.Status WHEN 'CheckedIn' THEN 0 WHEN 'Confirmed' THEN 1 ELSE 2 END,
                ISNULL(b.CheckInDate, b.BookingDate), b.BookingID DESC`,
      { st: [sql.VarChar(10), status] }
    ),
    query(
      `SELECT BookingGroomingID, BookingID, ServiceName, StaffName, CONVERT(char(16), StartTime, 120) AS StartTime, Status
       FROM grooming.vw_GroomingSchedule ORDER BY StartTime`
    ),
    query(`SELECT BookingID, ExtraID, ExtraName, Unit, Qty, Status FROM booking.vw_BookingExtras ORDER BY ExtraID`),
  ]);
  for (const b of rows) {
    b.grooming = grooming.filter((g) => g.BookingID === b.BookingID);
    b.extras = extras.filter((x) => x.BookingID === b.BookingID);
  }
  res.json(rows);
}));

/* ---------- Grooming Calendar ---------- */
router.get('/schedule', wrap(async (req, res) => {
  const day = toLocalDate(req.query.date) || new Date(new Date().setHours(0, 0, 0, 0));
  const [groomers, jobs] = await Promise.all([
    query(`SELECT StaffID, FullName FROM ops.Staff WHERE Role = 'Groomer' AND IsActive = 1 ORDER BY StaffID`),
    query(
      `SELECT BookingGroomingID, BookingID, BookingNo, StaffID, ServiceName, PetName, Species, Breed, WeightKg,
              MedicalNotes, CONVERT(char(5), StartTime, 108) AS StartTime, CONVERT(char(5), EndTime, 108) AS EndTime,
              DATEDIFF(MINUTE, CAST(WorkDate AS datetime), StartTime) AS StartMin,
              DATEDIFF(MINUTE, StartTime, EndTime) AS DurationMin, Price, Status
       FROM grooming.vw_GroomingSchedule
       WHERE WorkDate = @d AND Status <> 'Cancelled' ORDER BY StartTime`,
      { d: [sql.Date, day] }
    ),
  ]);
  res.json({ groomers, jobs });
}));

/* ---------- ปุ่มต่างๆ -> Stored Procedure (Trigger ทำงานต่อเอง) ---------- */
const id = (v) => [sql.Int, Number(v)];

router.post('/bookings/:id/checkin', wrap(async (req, res) => {
  await exec('booking.sp_CheckIn', { BookingID: id(req.params.id) });
  res.json({ ok: true });
}));
router.post('/bookings/:id/checkout', wrap(async (req, res) => {
  await exec('booking.sp_CheckOut', { BookingID: id(req.params.id) });
  res.json({ ok: true });
}));
router.post('/bookings/:id/cancel', wrap(async (req, res) => {
  await exec('booking.sp_CancelBooking', { BookingID: id(req.params.id), CustomerID: [sql.Int, null] });
  res.json({ ok: true });
}));
router.post('/bookings/:id/payment', wrap(async (req, res) => {
  const amount = Number((req.body || {}).amount);
  if (!(amount > 0)) return res.status(400).json({ error: 'จำนวนเงินต้องมากกว่า 0' });
  await exec('booking.sp_AddPayment', {
    BookingID: id(req.params.id),
    Amount: [sql.Money, amount],
    Method: [sql.VarChar(10), (req.body || {}).method || 'Cash'],
  });
  res.json({ ok: true });
}));
router.post('/rooms/:id/cleaned', wrap(async (req, res) => {
  await exec('hotel.sp_MarkRoomCleaned', { RoomID: id(req.params.id) });
  res.json({ ok: true });
}));
router.post('/grooming/:id/status', wrap(async (req, res) => {
  await exec('booking.sp_UpdateGroomingStatus', {
    BookingGroomingID: id(req.params.id),
    Status: [sql.VarChar(10), (req.body || {}).status],
  });
  res.json({ ok: true });
}));
router.post('/bookings/:id/extras/:extraId/status', wrap(async (req, res) => {
  await exec('booking.sp_UpdateExtraStatus', {
    BookingID: id(req.params.id),
    ExtraID: id(req.params.extraId),
    Status: [sql.VarChar(10), (req.body || {}).status],
  });
  res.json({ ok: true });
}));

module.exports = router;
