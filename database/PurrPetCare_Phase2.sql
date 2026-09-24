/* =====================================================================
   PurrPet Care  |  Phase 2 : Functions, Views, Triggers, Stored Procedures
   รันหลัง Phase 1  |  รันซ้ำได้ (ใช้ CREATE OR ALTER)
   ===================================================================== */
USE PurrPetCare;
GO

/* =========================== TYPES (Table Type) =========================== */
IF TYPE_ID('booking.ServiceRequest') IS NULL
    CREATE TYPE booking.ServiceRequest AS TABLE (
        ServiceID int      NOT NULL,
        StaffID   int      NOT NULL,
        StartTime datetime NOT NULL
    );
IF TYPE_ID('booking.ExtraRequest') IS NULL
    CREATE TYPE booking.ExtraRequest AS TABLE (
        ExtraID int NOT NULL,
        Qty     int NOT NULL
    );
GO

/* =============================== FUNCTIONS =============================== */
-- Function 1: ราคาอาบน้ำ/ตัดขนตามน้ำหนัก  < 5 kg ปกติ | 5-15 kg +20% | > 15 kg +50%
CREATE OR ALTER FUNCTION booking.fn_CalculateGroomingPrice (@PetID int, @ServiceID int)
RETURNS money
AS
BEGIN
    DECLARE @Weight decimal(5,2), @Base money;
    SELECT @Weight = WeightKg  FROM customer.Pets      WHERE PetID = @PetID;
    SELECT @Base   = BasePrice FROM grooming.Services  WHERE ServiceID = @ServiceID;
    RETURN @Base * CASE WHEN @Weight < 5   THEN 1.0
                        WHEN @Weight <= 15 THEN 1.2
                        ELSE 1.5 END;
END
GO

-- Function 2: ราคารวมทั้งหมด = ค่าห้อง + ค่าอาบน้ำตัดขน + ค่าบริการเสริม
CREATE OR ALTER FUNCTION booking.fn_CalculateTotalPrice (@BookingID int)
RETURNS money
AS
BEGIN
    DECLARE @Room money, @Groom money, @Extra money;
    SELECT @Room  = SUM(RoomTotal) FROM booking.Booking_Rooms    WHERE BookingID = @BookingID;
    SELECT @Groom = SUM(Price)     FROM booking.Booking_Grooming WHERE BookingID = @BookingID AND Status <> 'Cancelled';
    SELECT @Extra = SUM(LineTotal) FROM booking.Booking_Extras   WHERE BookingID = @BookingID;
    RETURN ISNULL(@Room, 0) + ISNULL(@Groom, 0) + ISNULL(@Extra, 0);
END
GO

-- Function 3 (Table-valued): ห้องว่างในช่วงวันที่ และใหญ่พอสำหรับน้อง
CREATE OR ALTER FUNCTION hotel.fn_AvailableRooms (@CheckIn date, @CheckOut date, @MinSize char(1))
RETURNS TABLE
AS
RETURN
    SELECT r.RoomID, r.RoomNo, r.RoomSize, t.TypeName, t.PricePerNight
    FROM hotel.Rooms r
    JOIN hotel.RoomTypes t ON t.RoomSize = r.RoomSize
    WHERE r.Status <> 'Maintenance'
      AND CHARINDEX(r.RoomSize, 'SML') >= CHARINDEX(@MinSize, 'SML')
      AND NOT EXISTS (
            SELECT 1
            FROM booking.Booking_Rooms br
            JOIN booking.Bookings b ON b.BookingID = br.BookingID
            WHERE br.RoomID = r.RoomID
              AND b.Status NOT IN ('Cancelled', 'Completed')
              AND br.CheckInDate < @CheckOut
              AND br.CheckOutDate > @CheckIn);
GO

-- Function 4 (Table-valued): ช่างที่ว่างในช่วงเวลา
CREATE OR ALTER FUNCTION grooming.fn_AvailableGroomers (@Start datetime, @End datetime)
RETURNS TABLE
AS
RETURN
    SELECT s.StaffID, s.FullName
    FROM ops.Staff s
    WHERE s.Role = 'Groomer' AND s.IsActive = 1
      AND NOT EXISTS (
            SELECT 1 FROM booking.Booking_Grooming g
            WHERE g.StaffID = s.StaffID
              AND g.Status <> 'Cancelled'
              AND g.StartTime < @End
              AND g.EndTime   > @Start);
GO

/* ================================= VIEWS ================================= */
CREATE OR ALTER VIEW customer.vw_PetProfiles
AS
SELECT PetID, CustomerID, PetName, Species, Breed, Gender, BirthDate,
       WeightKg, WeightClass, MedicalNotes, PhotoURL
FROM customer.Pets
WHERE IsActive = 1;
GO

-- สรุปการจอง + สถานะสำหรับหน้า Status Tracker
CREATE OR ALTER VIEW booking.vw_BookingSummary
AS
SELECT b.BookingID, b.BookingNo, b.BookingDate, b.Status, b.TotalPrice, b.Note,
       p.PetID, p.PetName, p.Species, p.Breed, p.WeightKg, p.MedicalNotes,
       c.CustomerID, c.FullName AS CustomerName, c.Phone,
       br.RoomID, r.RoomNo, br.CheckInDate, br.CheckOutDate, br.Nights,
       br.ActualCheckIn, br.ActualCheckOut,
       ISNULL(pay.PaidAmount, 0) AS PaidAmount,
       CASE
           WHEN b.Status = 'Cancelled' THEN N'ยกเลิกแล้ว'
           WHEN b.Status = 'Completed' THEN N'กลับบ้านแล้ว'
           WHEN EXISTS (SELECT 1 FROM booking.Booking_Grooming g
                        WHERE g.BookingID = b.BookingID AND g.Status = 'InProgress')
                THEN N'กำลังอาบน้ำเป่าขน'
           WHEN b.Status = 'CheckedIn'
                AND EXISTS     (SELECT 1 FROM booking.Booking_Grooming g WHERE g.BookingID = b.BookingID AND g.Status = 'Done')
                AND NOT EXISTS (SELECT 1 FROM booking.Booking_Grooming g WHERE g.BookingID = b.BookingID AND g.Status = 'Waiting')
                THEN N'หล่อพร้อมกลับบ้าน'
           WHEN b.Status = 'CheckedIn' THEN N'กำลังพักผ่อน'
           ELSE N'รอเข้าพัก'
       END AS TrackerStage
FROM booking.Bookings b
JOIN customer.Pets p      ON p.PetID = b.PetID
JOIN customer.Customers c ON c.CustomerID = p.CustomerID
LEFT JOIN booking.Booking_Rooms br ON br.BookingID = b.BookingID
LEFT JOIN hotel.Rooms r            ON r.RoomID = br.RoomID
LEFT JOIN (SELECT BookingID, SUM(Amount) AS PaidAmount
           FROM booking.Payments GROUP BY BookingID) pay ON pay.BookingID = b.BookingID;
GO

-- ตารางคิวช่าง (Grooming Calendar)
CREATE OR ALTER VIEW grooming.vw_GroomingSchedule
AS
SELECT g.BookingGroomingID, g.BookingID, b.BookingNo, g.StaffID, s.FullName AS StaffName,
       g.ServiceID, sv.ServiceName, p.PetName, p.Species, p.Breed, p.WeightKg, p.MedicalNotes,
       g.StartTime, g.EndTime, CAST(g.StartTime AS date) AS WorkDate, g.Price, g.Status
FROM booking.Booking_Grooming g
JOIN ops.Staff s          ON s.StaffID = g.StaffID
JOIN grooming.Services sv ON sv.ServiceID = g.ServiceID
JOIN booking.Bookings b   ON b.BookingID = g.BookingID
JOIN customer.Pets p      ON p.PetID = b.PetID
WHERE b.Status <> 'Cancelled';
GO

-- สถานะห้องตอนนี้ + น้องที่พักอยู่ (Dashboard)
CREATE OR ALTER VIEW hotel.vw_RoomStatusToday
AS
SELECT r.RoomID, r.RoomNo, r.RoomSize, t.TypeName, t.PricePerNight, r.Status,
       cur.BookingID, cur.BookingNo, cur.PetName, cur.CheckOutDate
FROM hotel.Rooms r
JOIN hotel.RoomTypes t ON t.RoomSize = r.RoomSize
OUTER APPLY (
    SELECT TOP 1 b.BookingID, b.BookingNo, p.PetName, br.CheckOutDate
    FROM booking.Booking_Rooms br
    JOIN booking.Bookings b ON b.BookingID = br.BookingID
    JOIN customer.Pets p    ON p.PetID = b.PetID
    WHERE br.RoomID = r.RoomID AND b.Status = 'CheckedIn'
    ORDER BY br.CheckInDate DESC
) cur;
GO

-- รายได้รายวัน (Dashboard)
CREATE OR ALTER VIEW booking.vw_DailyRevenue
AS
SELECT CAST(PaymentDate AS date) AS PayDate,
       COUNT(*)    AS PaymentCount,
       SUM(Amount) AS Revenue
FROM booking.Payments
GROUP BY CAST(PaymentDate AS date);
GO

/* ================================ TRIGGERS ================================ */
-- Trigger 1: เช็กอิน -> ห้อง Occupied / เช็กเอาต์ -> ห้อง Cleaning (และอัปเดตสถานะการจอง)
CREATE OR ALTER TRIGGER booking.trg_BookingRooms_Status
ON booking.Booking_Rooms
FOR UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF UPDATE(ActualCheckIn)
    BEGIN
        UPDATE r SET Status = 'Occupied'
        FROM hotel.Rooms r
        JOIN inserted i ON i.RoomID = r.RoomID
        JOIN deleted d  ON d.BookingRoomID = i.BookingRoomID
        WHERE i.ActualCheckIn IS NOT NULL AND d.ActualCheckIn IS NULL;

        UPDATE b SET Status = 'CheckedIn'
        FROM booking.Bookings b
        JOIN inserted i ON i.BookingID = b.BookingID
        JOIN deleted d  ON d.BookingRoomID = i.BookingRoomID
        WHERE i.ActualCheckIn IS NOT NULL AND d.ActualCheckIn IS NULL;
    END
    IF UPDATE(ActualCheckOut)
    BEGIN
        UPDATE r SET Status = 'Cleaning'
        FROM hotel.Rooms r
        JOIN inserted i ON i.RoomID = r.RoomID
        JOIN deleted d  ON d.BookingRoomID = i.BookingRoomID
        WHERE i.ActualCheckOut IS NOT NULL AND d.ActualCheckOut IS NULL;

        UPDATE b SET Status = 'Completed'
        FROM booking.Bookings b
        JOIN inserted i ON i.BookingID = b.BookingID
        JOIN deleted d  ON d.BookingRoomID = i.BookingRoomID
        WHERE i.ActualCheckOut IS NOT NULL AND d.ActualCheckOut IS NULL;
    END
END
GO

-- Trigger 2: ป้องกันการจองคิวช่างซ้อน (เช็กทุกแถวใน inserted ไม่ใช่แค่แถวเดียว)
CREATE OR ALTER TRIGGER booking.trg_BookingGrooming_NoOverlap
ON booking.Booking_Grooming
FOR INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1
        FROM inserted i
        JOIN booking.Booking_Grooming g
             ON  g.StaffID = i.StaffID
             AND g.BookingGroomingID <> i.BookingGroomingID
             AND g.Status <> 'Cancelled'
        WHERE i.Status <> 'Cancelled'
          AND g.StartTime < i.EndTime
          AND g.EndTime   > i.StartTime)
    BEGIN
        ROLLBACK TRANSACTION;
        RAISERROR(N'ช่างคนนี้มีคิวในช่วงเวลานั้นแล้ว ไม่สามารถจองซ้อนได้', 16, 1);
    END
END
GO

-- Trigger 3: ป้องกันการจองห้องเดียวกันวันทับกัน (กันไว้อีกชั้น เผื่อมีคนกดจองพร้อมกัน)
CREATE OR ALTER TRIGGER booking.trg_BookingRooms_NoOverlap
ON booking.Booking_Rooms
FOR INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1
        FROM inserted i
        JOIN booking.Booking_Rooms br
             ON  br.RoomID = i.RoomID
             AND br.BookingRoomID <> i.BookingRoomID
        JOIN booking.Bookings b
             ON  b.BookingID = br.BookingID
             AND b.Status NOT IN ('Cancelled', 'Completed')
        WHERE br.CheckInDate  < i.CheckOutDate
          AND br.CheckOutDate > i.CheckInDate)
    BEGIN
        ROLLBACK TRANSACTION;
        RAISERROR(N'ห้องนี้ถูกจองในช่วงวันที่ทับกันแล้ว', 16, 1);
    END
END
GO

-- Database Trigger: กันการลบตาราง + บันทึกลง AuditLog
-- (ถ้าจำเป็นต้องลบจริง: DISABLE TRIGGER trg_ProtectTables ON DATABASE;)
CREATE OR ALTER TRIGGER trg_ProtectTables
ON DATABASE
FOR DROP_TABLE
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @e xml = EVENTDATA();
    ROLLBACK;
    INSERT INTO ops.AuditLog (EventType, ObjectName, Detail)
    VALUES ('DROP_TABLE_BLOCKED',
            @e.value('(/EVENT_INSTANCE/ObjectName)[1]', 'nvarchar(256)'),
            @e.value('(/EVENT_INSTANCE/TSQLCommand/CommandText)[1]', 'nvarchar(max)'));
    RAISERROR(N'ห้ามลบตารางของระบบ PurrPet Care', 16, 1);
END
GO

/* =========================== STORED PROCEDURES =========================== */
-- ลูกค้า: สมัครสมาชิก
CREATE OR ALTER PROCEDURE customer.sp_RegisterCustomer
    @FullName nvarchar(100), @Phone varchar(10), @Email varchar(100), @PasswordHash varchar(255)
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM customer.Customers WHERE Email = @Email)
    BEGIN RAISERROR(N'อีเมลนี้ถูกใช้สมัครแล้ว', 16, 1); RETURN; END
    IF EXISTS (SELECT 1 FROM customer.Customers WHERE Phone = @Phone)
    BEGIN RAISERROR(N'เบอร์โทรนี้ถูกใช้สมัครแล้ว', 16, 1); RETURN; END

    INSERT INTO customer.Customers (FullName, Phone, Email, PasswordHash)
    VALUES (@FullName, @Phone, @Email, @PasswordHash);
    SELECT CAST(SCOPE_IDENTITY() AS int) AS CustomerID, @FullName AS FullName;
END
GO

-- ลูกค้า: ดึงข้อมูลสำหรับล็อกอิน (เว็บเป็นคนเทียบรหัสผ่านที่ hash ไว้)
CREATE OR ALTER PROCEDURE customer.sp_GetCustomerLogin @Email varchar(100)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT CustomerID, FullName, PasswordHash FROM customer.Customers WHERE Email = @Email;
END
GO

-- ลูกค้า: เพิ่มโปรไฟล์สัตว์เลี้ยง
CREATE OR ALTER PROCEDURE customer.sp_AddPet
    @CustomerID int, @PetName nvarchar(50), @Species varchar(3), @Breed nvarchar(50) = NULL,
    @Gender char(1) = NULL, @BirthDate date = NULL, @WeightKg decimal(5,2),
    @MedicalNotes nvarchar(500) = NULL, @PhotoURL varchar(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO customer.Pets (CustomerID, PetName, Species, Breed, Gender, BirthDate, WeightKg, MedicalNotes, PhotoURL)
    VALUES (@CustomerID, @PetName, @Species, @Breed, @Gender, @BirthDate, @WeightKg, @MedicalNotes, @PhotoURL);
    SELECT CAST(SCOPE_IDENTITY() AS int) AS PetID;
END
GO

-- จองแพ็กเกจรวบยอด (Single-Click Booking) ทำใน TRANSACTION เดียว
CREATE OR ALTER PROCEDURE booking.sp_CreateBooking
    @CustomerID   int,
    @PetID        int,
    @RoomID       int  = NULL,
    @CheckInDate  date = NULL,
    @CheckOutDate date = NULL,
    @Services     booking.ServiceRequest READONLY,
    @Extras       booking.ExtraRequest   READONLY,
    @Note         nvarchar(300) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    DECLARE @BookingID int, @PetClass char(1);
    DECLARE @Req TABLE (Seq int IDENTITY(1,1), ServiceID int, StaffID int,
                        StartTime datetime, EndTime datetime, Price money);
    BEGIN TRY
        BEGIN TRANSACTION;

        -- 0) ตรวจว่าเป็นสัตว์เลี้ยงของลูกค้าคนนี้
        SELECT @PetClass = WeightClass FROM customer.Pets
        WHERE PetID = @PetID AND CustomerID = @CustomerID AND IsActive = 1;
        IF @PetClass IS NULL
            RAISERROR(N'ไม่พบสัตว์เลี้ยงนี้ในบัญชีของคุณ', 16, 1);
        IF @RoomID IS NULL AND NOT EXISTS (SELECT 1 FROM @Services)
            RAISERROR(N'ต้องเลือกห้องพักหรือบริการอาบน้ำตัดขนอย่างน้อย 1 อย่าง', 16, 1);

        -- 1) ตรวจห้องว่าง
        IF @RoomID IS NOT NULL
        BEGIN
            IF @CheckInDate IS NULL OR @CheckOutDate IS NULL OR @CheckOutDate <= @CheckInDate
                RAISERROR(N'วันเช็กอิน/เช็กเอาต์ไม่ถูกต้อง', 16, 1);
            IF @CheckInDate < CAST(GETDATE() AS date)
                RAISERROR(N'จองย้อนหลังไม่ได้', 16, 1);
            IF NOT EXISTS (SELECT 1 FROM hotel.fn_AvailableRooms(@CheckInDate, @CheckOutDate, @PetClass)
                           WHERE RoomID = @RoomID)
                RAISERROR(N'ห้องนี้ไม่ว่างในช่วงวันที่เลือก หรือเล็กเกินไปสำหรับน้อง', 16, 1);
        END

        -- 2) ตรวจคิวช่างว่าง
        INSERT INTO @Req (ServiceID, StaffID, StartTime, EndTime, Price)
        SELECT r.ServiceID, r.StaffID, r.StartTime,
               DATEADD(MINUTE, s.DurationMin, r.StartTime),
               booking.fn_CalculateGroomingPrice(@PetID, r.ServiceID)
        FROM @Services r
        JOIN grooming.Services s ON s.ServiceID = r.ServiceID AND s.IsActive = 1;

        IF (SELECT COUNT(*) FROM @Req) <> (SELECT COUNT(*) FROM @Services)
            RAISERROR(N'มีบริการที่เลือกไม่ถูกต้อง', 16, 1);
        IF EXISTS (SELECT 1 FROM @Req WHERE StartTime < GETDATE())
            RAISERROR(N'เลือกเวลาคิวที่ผ่านมาแล้วไม่ได้', 16, 1);
        IF EXISTS (SELECT 1 FROM @Req q
                   WHERE NOT EXISTS (SELECT 1 FROM ops.Staff st
                                     WHERE st.StaffID = q.StaffID AND st.Role = 'Groomer' AND st.IsActive = 1))
            RAISERROR(N'ช่างที่เลือกไม่ถูกต้อง', 16, 1);
        IF EXISTS (SELECT 1 FROM @Req a JOIN @Req b
                   ON a.Seq < b.Seq AND a.StartTime < b.EndTime AND a.EndTime > b.StartTime)
            RAISERROR(N'บริการของน้องเวลาทับกันเอง', 16, 1);
        IF EXISTS (SELECT 1 FROM @Req q
                   JOIN booking.Booking_Grooming g
                        ON g.StaffID = q.StaffID AND g.Status <> 'Cancelled'
                       AND g.StartTime < q.EndTime AND g.EndTime > q.StartTime)
            RAISERROR(N'ช่างที่เลือกมีคิวชนในช่วงเวลานั้นแล้ว', 16, 1);

        -- 3) บันทึกการจอง
        INSERT INTO booking.Bookings (PetID, Note) VALUES (@PetID, @Note);
        SET @BookingID = SCOPE_IDENTITY();

        IF @RoomID IS NOT NULL
            INSERT INTO booking.Booking_Rooms (BookingID, RoomID, CheckInDate, CheckOutDate, PricePerNight)
            SELECT @BookingID, r.RoomID, @CheckInDate, @CheckOutDate, t.PricePerNight
            FROM hotel.Rooms r JOIN hotel.RoomTypes t ON t.RoomSize = r.RoomSize
            WHERE r.RoomID = @RoomID;

        INSERT INTO booking.Booking_Grooming (BookingID, ServiceID, StaffID, StartTime, EndTime, Price)
        SELECT @BookingID, ServiceID, StaffID, StartTime, EndTime, Price FROM @Req;

        INSERT INTO booking.Booking_Extras (BookingID, ExtraID, Qty, UnitPrice)
        SELECT @BookingID, e.ExtraID, x.Qty, e.Price
        FROM @Extras x JOIN booking.Extras e ON e.ExtraID = x.ExtraID;

        -- 4) คำนวณราคาสุทธิ
        UPDATE booking.Bookings
        SET TotalPrice = booking.fn_CalculateTotalPrice(@BookingID)
        WHERE BookingID = @BookingID;

        -- แจ้งเตือนช่าง (Phase 3 จะเปลี่ยนเป็นส่งผ่าน Service Broker)
        INSERT INTO ops.Notifications (StaffID, BookingID, Message)
        SELECT q.StaffID, @BookingID, N'คิวใหม่: ' + s.ServiceName + N' เวลา ' + FORMAT(q.StartTime, 'dd/MM HH:mm')
        FROM @Req q JOIN grooming.Services s ON s.ServiceID = q.ServiceID;

        COMMIT TRANSACTION;
        SELECT BookingID, BookingNo, TotalPrice FROM booking.Bookings WHERE BookingID = @BookingID;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- ยกเลิกการจอง (ลูกค้าส่ง @CustomerID มาด้วย / Admin ส่ง NULL)
CREATE OR ALTER PROCEDURE booking.sp_CancelBooking @BookingID int, @CustomerID int = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM booking.vw_BookingSummary
                   WHERE BookingID = @BookingID AND Status = 'Confirmed'
                     AND (@CustomerID IS NULL OR CustomerID = @CustomerID))
    BEGIN RAISERROR(N'ยกเลิกไม่ได้ (ไม่พบการจอง หรือเช็กอินไปแล้ว)', 16, 1); RETURN; END

    BEGIN TRANSACTION;
        UPDATE booking.Booking_Grooming SET Status = 'Cancelled' WHERE BookingID = @BookingID;
        UPDATE booking.Bookings SET Status = 'Cancelled' WHERE BookingID = @BookingID;
    COMMIT TRANSACTION;
END
GO

-- Admin: เช็กอิน (ถ้ามีห้อง Trigger จะเปลี่ยนห้องเป็น Occupied ให้เอง)
CREATE OR ALTER PROCEDURE booking.sp_CheckIn @BookingID int
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM booking.Bookings WHERE BookingID = @BookingID AND Status = 'Confirmed')
    BEGIN RAISERROR(N'เช็กอินไม่ได้ (สถานะการจองไม่ใช่ Confirmed)', 16, 1); RETURN; END

    IF EXISTS (SELECT 1 FROM booking.Booking_Rooms WHERE BookingID = @BookingID)
    BEGIN
        IF EXISTS (SELECT 1 FROM booking.Booking_Rooms br JOIN hotel.Rooms r ON r.RoomID = br.RoomID
                   WHERE br.BookingID = @BookingID AND r.Status <> 'Available')
        BEGIN RAISERROR(N'ห้องยังไม่พร้อม (มีน้องพักอยู่ หรือรอทำความสะอาด)', 16, 1); RETURN; END
        UPDATE booking.Booking_Rooms SET ActualCheckIn = GETDATE() WHERE BookingID = @BookingID;
    END
    ELSE
        UPDATE booking.Bookings SET Status = 'CheckedIn' WHERE BookingID = @BookingID;
END
GO

-- Admin: เช็กเอาต์ (ถ้ามีห้อง Trigger จะเปลี่ยนห้องเป็น Cleaning ให้เอง)
CREATE OR ALTER PROCEDURE booking.sp_CheckOut @BookingID int
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM booking.Bookings WHERE BookingID = @BookingID AND Status = 'CheckedIn')
    BEGIN RAISERROR(N'เช็กเอาต์ไม่ได้ (น้องยังไม่ได้เช็กอิน)', 16, 1); RETURN; END

    IF EXISTS (SELECT 1 FROM booking.Booking_Rooms WHERE BookingID = @BookingID)
        UPDATE booking.Booking_Rooms SET ActualCheckOut = GETDATE() WHERE BookingID = @BookingID;
    ELSE
        UPDATE booking.Bookings SET Status = 'Completed' WHERE BookingID = @BookingID;
END
GO

-- Admin: ทำความสะอาดห้องเสร็จ
CREATE OR ALTER PROCEDURE hotel.sp_MarkRoomCleaned @RoomID int
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM hotel.Rooms WHERE RoomID = @RoomID AND Status = 'Cleaning')
    BEGIN RAISERROR(N'ห้องนี้ไม่ได้อยู่ในสถานะรอทำความสะอาด', 16, 1); RETURN; END
    UPDATE hotel.Rooms SET Status = 'Available' WHERE RoomID = @RoomID;
END
GO

-- Admin/ช่าง: อัปเดตสถานะงานอาบน้ำตัดขน
CREATE OR ALTER PROCEDURE booking.sp_UpdateGroomingStatus @BookingGroomingID int, @Status varchar(10)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @BookingID int, @BookingStatus varchar(10);
    SELECT @BookingID = g.BookingID, @BookingStatus = b.Status
    FROM booking.Booking_Grooming g JOIN booking.Bookings b ON b.BookingID = g.BookingID
    WHERE g.BookingGroomingID = @BookingGroomingID;

    IF @BookingID IS NULL
    BEGIN RAISERROR(N'ไม่พบคิวนี้', 16, 1); RETURN; END
    IF @Status NOT IN ('Waiting', 'InProgress', 'Done', 'Cancelled')
    BEGIN RAISERROR(N'สถานะไม่ถูกต้อง', 16, 1); RETURN; END
    IF @Status IN ('InProgress', 'Done') AND @BookingStatus <> 'CheckedIn'
    BEGIN RAISERROR(N'ต้องเช็กอินน้องก่อนเริ่มงาน', 16, 1); RETURN; END

    UPDATE booking.Booking_Grooming SET Status = @Status WHERE BookingGroomingID = @BookingGroomingID;
    UPDATE booking.Bookings SET TotalPrice = booking.fn_CalculateTotalPrice(@BookingID) WHERE BookingID = @BookingID;
END
GO

-- Admin: รับชำระเงิน
CREATE OR ALTER PROCEDURE booking.sp_AddPayment @BookingID int, @Amount money, @Method varchar(10)
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM booking.Bookings WHERE BookingID = @BookingID AND Status <> 'Cancelled')
    BEGIN RAISERROR(N'ไม่พบการจอง หรือการจองถูกยกเลิกแล้ว', 16, 1); RETURN; END
    INSERT INTO booking.Payments (BookingID, Amount, Method) VALUES (@BookingID, @Amount, @Method);
END
GO

PRINT 'Phase 2 complete.';
