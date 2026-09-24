/* =====================================================================
   PurrPet Care  |  Phase 1 : Database + Storage + Foundation + Tables + Master data
   SQL Server 2019  |  เปิดใน SSMS แล้วกด Execute ทั้งไฟล์ (รันซ้ำได้ ไม่ error)
   ===================================================================== */

/* ---------- 0) DATABASE + FILEGROUPS  (Storage — Lab Wk02) ---------- */
USE master;
GO
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'PurrPetCare')
BEGIN
    -- ใช้ path เริ่มต้นของเครื่อง จะได้รันได้ทุกเครื่องในกลุ่ม
    DECLARE @data nvarchar(260) = CAST(SERVERPROPERTY('InstanceDefaultDataPath') AS nvarchar(260));
    DECLARE @log  nvarchar(260) = CAST(SERVERPROPERTY('InstanceDefaultLogPath')  AS nvarchar(260));
    DECLARE @sql  nvarchar(max) = N'
    CREATE DATABASE PurrPetCare
    ON PRIMARY
      (NAME = PurrPet_dat,  FILENAME = ''' + @data + N'PurrPet_dat.mdf'',  SIZE = 16MB, MAXSIZE = 512MB, FILEGROWTH = 8MB),
    FILEGROUP FG_History
      (NAME = PurrPet_hist, FILENAME = ''' + @data + N'PurrPet_hist.ndf'', SIZE = 8MB,  MAXSIZE = 256MB, FILEGROWTH = 8MB)
    LOG ON
      (NAME = PurrPet_log,  FILENAME = ''' + @log  + N'PurrPet_log.ldf'',  SIZE = 8MB,  MAXSIZE = 256MB, FILEGROWTH = 8MB);';
    EXEC (@sql);
    PRINT 'Create database "PurrPetCare" success.';
END
GO
ALTER AUTHORIZATION ON DATABASE::PurrPetCare TO sa;   -- ให้เปิด Database Diagrams ได้
GO

USE PurrPetCare;
GO

/* ---------- 1) SCHEMAS  (Security > Schemas) ---------- */
IF SCHEMA_ID('customer') IS NULL EXEC('CREATE SCHEMA customer');
IF SCHEMA_ID('hotel')    IS NULL EXEC('CREATE SCHEMA hotel');
IF SCHEMA_ID('grooming') IS NULL EXEC('CREATE SCHEMA grooming');
IF SCHEMA_ID('booking')  IS NULL EXEC('CREATE SCHEMA booking');
IF SCHEMA_ID('ops')      IS NULL EXEC('CREATE SCHEMA ops');
GO

/* ---------- 2) RULES / DEFAULTS / TYPES  (Programmability — Lab Wk10) ---------- */
IF OBJECT_ID('dbo.rl_Phone') IS NULL
    EXEC('CREATE RULE dbo.rl_Phone AS @phone LIKE ''0[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]''');
IF OBJECT_ID('dbo.df_Now') IS NULL
    EXEC('CREATE DEFAULT dbo.df_Now AS GETDATE()');
IF OBJECT_ID('dbo.df_RoomStatus') IS NULL
    EXEC('CREATE DEFAULT dbo.df_RoomStatus AS ''Available''');
GO
-- ชนิดข้อมูลเบอร์โทร ผูก Rule ไว้ที่ Type ครั้งเดียว ทุกคอลัมน์ที่ใช้ Type นี้ได้กฎไปด้วย
IF TYPE_ID('dbo.PhoneNo') IS NULL
BEGIN
    CREATE TYPE dbo.PhoneNo FROM varchar(10) NOT NULL;
    EXEC sp_bindrule 'rl_Phone', 'PhoneNo';
END
GO

/* ---------- 3) SEQUENCE  (Programmability > Sequences) ---------- */
IF OBJECT_ID('booking.seq_BookingNo') IS NULL
    CREATE SEQUENCE booking.seq_BookingNo AS int START WITH 1 INCREMENT BY 1;
GO

/* ---------- 4) PARTITION  (Storage > Partition Functions / Schemes) ---------- */
IF NOT EXISTS (SELECT * FROM sys.partition_functions WHERE name = 'pf_ByYear')
    CREATE PARTITION FUNCTION pf_ByYear (datetime2(0))
    AS RANGE RIGHT FOR VALUES ('2025-01-01', '2026-01-01', '2027-01-01');
GO
IF NOT EXISTS (SELECT * FROM sys.partition_schemes WHERE name = 'ps_ByYear')
    CREATE PARTITION SCHEME ps_ByYear
    AS PARTITION pf_ByYear TO (FG_History, FG_History, [PRIMARY], [PRIMARY]);
GO

/* ---------- 5) TABLES ---------- */
IF OBJECT_ID('customer.Customers','U') IS NULL
BEGIN
    CREATE TABLE customer.Customers (
        CustomerID   int IDENTITY(1,1) CONSTRAINT PK_Customers PRIMARY KEY,
        FullName     nvarchar(100) NOT NULL,
        Phone        dbo.PhoneNo   CONSTRAINT UQ_Customers_Phone UNIQUE,
        Email        varchar(100)  NOT NULL CONSTRAINT UQ_Customers_Email UNIQUE,
        PasswordHash varchar(255)  NOT NULL,
        CreatedAt    datetime      NOT NULL
    );
    EXEC sp_bindefault 'df_Now', 'customer.Customers.CreatedAt';
    PRINT 'Create table "customer.Customers" success.';
END
GO

IF OBJECT_ID('customer.Pets','U') IS NULL
BEGIN
    CREATE TABLE customer.Pets (
        PetID        int IDENTITY(1,1) CONSTRAINT PK_Pets PRIMARY KEY,
        CustomerID   int NOT NULL CONSTRAINT FK_Pets_Customers REFERENCES customer.Customers(CustomerID),
        PetName      nvarchar(50)  NOT NULL,
        Species      varchar(3)    NOT NULL CONSTRAINT CK_Pets_Species CHECK (Species IN ('Dog','Cat')),
        Breed        nvarchar(50)  NULL,
        Gender       char(1)       NULL CONSTRAINT CK_Pets_Gender CHECK (Gender IN ('M','F')),
        BirthDate    date          NULL,
        WeightKg     decimal(5,2)  NOT NULL CONSTRAINT CK_Pets_Weight CHECK (WeightKg > 0 AND WeightKg <= 100),
        MedicalNotes nvarchar(500) NULL,
        PhotoURL     varchar(255)  NULL,
        IsActive     bit NOT NULL CONSTRAINT DF_Pets_IsActive DEFAULT 1,
        -- Computed column (Lab Wk02): S < 5 kg, M 5-15 kg, L > 15 kg  ใช้ทั้งคิดราคาและเลือกขนาดห้อง
        WeightClass  AS (CASE WHEN WeightKg < 5 THEN 'S' WHEN WeightKg <= 15 THEN 'M' ELSE 'L' END)
    );
    PRINT 'Create table "customer.Pets" success.';
END
GO

IF OBJECT_ID('hotel.RoomTypes','U') IS NULL
BEGIN
    CREATE TABLE hotel.RoomTypes (
        RoomSize      char(1) NOT NULL CONSTRAINT PK_RoomTypes PRIMARY KEY
                      CONSTRAINT CK_RoomTypes_Size CHECK (RoomSize IN ('S','M','L')),
        TypeName      nvarchar(50) NOT NULL,
        MaxWeightKg   decimal(5,2) NOT NULL,
        PricePerNight money NOT NULL CONSTRAINT CK_RoomTypes_Price CHECK (PricePerNight > 0)
    );
    PRINT 'Create table "hotel.RoomTypes" success.';
END
GO

IF OBJECT_ID('hotel.Rooms','U') IS NULL
BEGIN
    CREATE TABLE hotel.Rooms (
        RoomID   int IDENTITY(1,1) CONSTRAINT PK_Rooms PRIMARY KEY,
        RoomNo   varchar(10) NOT NULL CONSTRAINT UQ_Rooms_RoomNo UNIQUE,
        RoomSize char(1)     NOT NULL CONSTRAINT FK_Rooms_RoomTypes REFERENCES hotel.RoomTypes(RoomSize),
        Status   varchar(12) NOT NULL
                 CONSTRAINT CK_Rooms_Status CHECK (Status IN ('Available','Occupied','Cleaning','Maintenance'))
    );
    EXEC sp_bindefault 'df_RoomStatus', 'hotel.Rooms.Status';
    PRINT 'Create table "hotel.Rooms" success.';
END
GO

IF OBJECT_ID('grooming.Services','U') IS NULL
BEGIN
    CREATE TABLE grooming.Services (
        ServiceID   int IDENTITY(1,1) CONSTRAINT PK_Services PRIMARY KEY,
        ServiceName nvarchar(50) NOT NULL CONSTRAINT UQ_Services_Name UNIQUE,
        BasePrice   money NOT NULL CONSTRAINT CK_Services_Price CHECK (BasePrice > 0),
        DurationMin int   NOT NULL CONSTRAINT CK_Services_Duration CHECK (DurationMin > 0),
        IsActive    bit   NOT NULL CONSTRAINT DF_Services_IsActive DEFAULT 1
    );
    PRINT 'Create table "grooming.Services" success.';
END
GO

IF OBJECT_ID('ops.Staff','U') IS NULL
BEGIN
    CREATE TABLE ops.Staff (
        StaffID  int IDENTITY(1,1) CONSTRAINT PK_Staff PRIMARY KEY,
        FullName nvarchar(100) NOT NULL,
        Phone    dbo.PhoneNo,
        Role     varchar(10) NOT NULL CONSTRAINT CK_Staff_Role CHECK (Role IN ('Groomer','Caretaker','Admin')),
        HireDate date NOT NULL,
        IsActive bit  NOT NULL CONSTRAINT DF_Staff_IsActive DEFAULT 1
    );
    PRINT 'Create table "ops.Staff" success.';
END
GO

IF OBJECT_ID('booking.Extras','U') IS NULL
BEGIN
    CREATE TABLE booking.Extras (
        ExtraID   int IDENTITY(1,1) CONSTRAINT PK_Extras PRIMARY KEY,
        ExtraName nvarchar(50) NOT NULL CONSTRAINT UQ_Extras_Name UNIQUE,
        Unit      nvarchar(20) NOT NULL,
        Price     money NOT NULL CONSTRAINT CK_Extras_Price CHECK (Price > 0)
    );
    PRINT 'Create table "booking.Extras" success.';
END
GO

IF OBJECT_ID('booking.Bookings','U') IS NULL
BEGIN
    CREATE TABLE booking.Bookings (
        BookingID   int IDENTITY(1,1) CONSTRAINT PK_Bookings PRIMARY KEY,
        BookingNo   varchar(8) NOT NULL CONSTRAINT UQ_Bookings_No UNIQUE
                    CONSTRAINT DF_Bookings_No
                    DEFAULT ('BK' + RIGHT('000000' + CAST(NEXT VALUE FOR booking.seq_BookingNo AS varchar(6)), 6)),
        PetID       int NOT NULL CONSTRAINT FK_Bookings_Pets REFERENCES customer.Pets(PetID),
        BookingDate datetime NOT NULL,
        Status      varchar(10) NOT NULL CONSTRAINT DF_Bookings_Status DEFAULT 'Confirmed'
                    CONSTRAINT CK_Bookings_Status CHECK (Status IN ('Confirmed','CheckedIn','Completed','Cancelled')),
        TotalPrice  money NULL,
        Note        nvarchar(300) NULL
    );
    EXEC sp_bindefault 'df_Now', 'booking.Bookings.BookingDate';
    PRINT 'Create table "booking.Bookings" success.';
END
GO

IF OBJECT_ID('booking.Booking_Rooms','U') IS NULL
BEGIN
    CREATE TABLE booking.Booking_Rooms (
        BookingRoomID  int IDENTITY(1,1) CONSTRAINT PK_Booking_Rooms PRIMARY KEY,
        BookingID      int NOT NULL CONSTRAINT FK_BR_Bookings REFERENCES booking.Bookings(BookingID)
                       CONSTRAINT UQ_BR_Booking UNIQUE,
        RoomID         int NOT NULL CONSTRAINT FK_BR_Rooms REFERENCES hotel.Rooms(RoomID),
        CheckInDate    date  NOT NULL,
        CheckOutDate   date  NOT NULL,
        PricePerNight  money NOT NULL,          -- เก็บราคา ณ วันจอง
        ActualCheckIn  datetime NULL,
        ActualCheckOut datetime NULL,
        Nights         AS DATEDIFF(DAY, CheckInDate, CheckOutDate),
        RoomTotal      AS DATEDIFF(DAY, CheckInDate, CheckOutDate) * PricePerNight,
        CONSTRAINT CK_BR_Dates CHECK (CheckOutDate > CheckInDate)
    );
    CREATE INDEX IX_BR_Room_Dates ON booking.Booking_Rooms (RoomID, CheckInDate, CheckOutDate);
    PRINT 'Create table "booking.Booking_Rooms" success.';
END
GO

IF OBJECT_ID('booking.Booking_Grooming','U') IS NULL
BEGIN
    CREATE TABLE booking.Booking_Grooming (
        BookingGroomingID int IDENTITY(1,1) CONSTRAINT PK_Booking_Grooming PRIMARY KEY,
        BookingID int NOT NULL CONSTRAINT FK_BG_Bookings REFERENCES booking.Bookings(BookingID),
        ServiceID int NOT NULL CONSTRAINT FK_BG_Services REFERENCES grooming.Services(ServiceID),
        StaffID   int NOT NULL CONSTRAINT FK_BG_Staff    REFERENCES ops.Staff(StaffID),
        StartTime datetime NOT NULL,
        EndTime   datetime NOT NULL,
        Price     money    NOT NULL,            -- ราคาหลังคิดน้ำหนักแล้ว ณ วันจอง
        Status    varchar(10) NOT NULL CONSTRAINT DF_BG_Status DEFAULT 'Waiting'
                  CONSTRAINT CK_BG_Status CHECK (Status IN ('Waiting','InProgress','Done','Cancelled')),
        CONSTRAINT CK_BG_Time CHECK (EndTime > StartTime)
    );
    CREATE INDEX IX_BG_Staff_Time ON booking.Booking_Grooming (StaffID, StartTime, EndTime);
    PRINT 'Create table "booking.Booking_Grooming" success.';
END
GO

IF OBJECT_ID('booking.Booking_Extras','U') IS NULL
BEGIN
    CREATE TABLE booking.Booking_Extras (
        BookingID int NOT NULL CONSTRAINT FK_BE_Bookings REFERENCES booking.Bookings(BookingID),
        ExtraID   int NOT NULL CONSTRAINT FK_BE_Extras   REFERENCES booking.Extras(ExtraID),
        Qty       int   NOT NULL CONSTRAINT CK_BE_Qty CHECK (Qty > 0),
        UnitPrice money NOT NULL,
        LineTotal AS Qty * UnitPrice,
        CONSTRAINT PK_Booking_Extras PRIMARY KEY (BookingID, ExtraID)
    );
    PRINT 'Create table "booking.Booking_Extras" success.';
END
GO

-- ตาราง Partition: ข้อมูลก่อนปี 2026 ไปอยู่ FG_History
IF OBJECT_ID('booking.Payments','U') IS NULL
BEGIN
    CREATE TABLE booking.Payments (
        PaymentID   int IDENTITY(1,1) NOT NULL,
        PaymentDate datetime2(0) NOT NULL CONSTRAINT DF_Payments_Date DEFAULT SYSDATETIME(),
        BookingID   int NOT NULL CONSTRAINT FK_Payments_Bookings REFERENCES booking.Bookings(BookingID),
        Amount      money NOT NULL CONSTRAINT CK_Payments_Amount CHECK (Amount > 0),
        Method      varchar(10) NOT NULL CONSTRAINT CK_Payments_Method CHECK (Method IN ('Cash','Transfer','Card','QR')),
        CONSTRAINT PK_Payments PRIMARY KEY CLUSTERED (PaymentID, PaymentDate)
    ) ON ps_ByYear (PaymentDate);
    PRINT 'Create table "booking.Payments" success.';
END
GO

IF OBJECT_ID('ops.AuditLog','U') IS NULL
BEGIN
    CREATE TABLE ops.AuditLog (
        LogID      int IDENTITY(1,1) CONSTRAINT PK_AuditLog PRIMARY KEY,
        EventTime  datetime      NOT NULL,
        EventType  varchar(50)   NOT NULL,
        ObjectName nvarchar(256) NULL,
        LoginName  nvarchar(128) NOT NULL CONSTRAINT DF_AuditLog_Login DEFAULT SUSER_SNAME(),
        Detail     nvarchar(max) NULL
    );
    EXEC sp_bindefault 'df_Now', 'ops.AuditLog.EventTime';
    PRINT 'Create table "ops.AuditLog" success.';
END
GO

IF OBJECT_ID('ops.Notifications','U') IS NULL
BEGIN
    CREATE TABLE ops.Notifications (
        NotificationID int IDENTITY(1,1) CONSTRAINT PK_Notifications PRIMARY KEY,
        StaffID   int NULL CONSTRAINT FK_Notif_Staff    REFERENCES ops.Staff(StaffID),
        BookingID int NULL CONSTRAINT FK_Notif_Bookings REFERENCES booking.Bookings(BookingID),
        Message   nvarchar(400) NOT NULL,
        CreatedAt datetime NOT NULL,
        IsRead    bit NOT NULL CONSTRAINT DF_Notif_IsRead DEFAULT 0
    );
    EXEC sp_bindefault 'df_Now', 'ops.Notifications.CreatedAt';
    PRINT 'Create table "ops.Notifications" success.';
END
GO

/* ---------- 6) MASTER DATA ---------- */
IF NOT EXISTS (SELECT * FROM hotel.RoomTypes)
    INSERT INTO hotel.RoomTypes (RoomSize, TypeName, MaxWeightKg, PricePerNight) VALUES
    ('S', N'ห้องเล็ก (ไม่เกิน 5 kg)',   5,  350),
    ('M', N'ห้องกลาง (5-15 kg)',       15,  550),
    ('L', N'ห้องใหญ่ (เกิน 15 kg)',    100, 800);

IF NOT EXISTS (SELECT * FROM hotel.Rooms)
    INSERT INTO hotel.Rooms (RoomNo, RoomSize) VALUES   -- Status ได้ 'Available' จาก Default
    ('S01','S'),('S02','S'),('S03','S'),
    ('M01','M'),('M02','M'),('M03','M'),
    ('L01','L'),('L02','L');

IF NOT EXISTS (SELECT * FROM grooming.Services)
    INSERT INTO grooming.Services (ServiceName, BasePrice, DurationMin) VALUES
    (N'อาบน้ำ',   250, 60),
    (N'ตัดขน',    450, 90),
    (N'ตัดเล็บ',  100, 15),
    (N'สปาโคลน',  350, 45);

IF NOT EXISTS (SELECT * FROM ops.Staff)
    INSERT INTO ops.Staff (FullName, Phone, Role, HireDate) VALUES
    (N'สมใจ ใจดี',     '0811111111', 'Groomer',   '2024-01-15'),
    (N'มานี มีสุข',     '0822222222', 'Groomer',   '2024-06-01'),
    (N'ปิติ รักสัตว์',   '0833333333', 'Groomer',   '2025-02-10'),
    (N'ชูใจ ดูแลดี',    '0844444444', 'Caretaker', '2025-03-01'),
    (N'วีระ ผู้จัดการ',  '0855555555', 'Admin',     '2023-11-01');

IF NOT EXISTS (SELECT * FROM booking.Extras)
    INSERT INTO booking.Extras (ExtraName, Unit, Price) VALUES
    (N'อาหารพรีเมียม',    N'มื้อ',   80),
    (N'พาเดินเล่น',       N'ครั้ง', 100),
    (N'ดูแลพิเศษ/ป้อนยา', N'วัน',   150);

IF NOT EXISTS (SELECT * FROM customer.Customers)
    INSERT INTO customer.Customers (FullName, Phone, Email, PasswordHash) VALUES
    (N'อารี จิตดี',      '0891234567', 'aree@mail.com',  'demo-hash'),
    (N'ธนา ใจงาม',      '0897654321', 'thana@mail.com', 'demo-hash'),
    (N'กานดา รักแมว',   '0861112222', 'kanda@mail.com', 'demo-hash'),
    (N'ภูมิ หมาเยอะ',    '0873334444', 'poom@mail.com',  'demo-hash'),
    (N'ลลิตา สดใส',     '0925556666', 'lalita@mail.com','demo-hash');

IF NOT EXISTS (SELECT * FROM customer.Pets)
    INSERT INTO customer.Pets (CustomerID, PetName, Species, Breed, Gender, WeightKg, MedicalNotes) VALUES
    (1, N'ถุงทอง',  'Dog', N'ชิวาวา',          'F',  2.8, NULL),
    (1, N'มะม่วง',  'Cat', N'สก็อตติชโฟลด์',   'M',  4.2, N'แพ้อาหารทะเล'),
    (2, N'บราวนี่', 'Dog', N'คอร์กี้',          'M', 12.5, NULL),
    (3, N'ส้มจี๊ด', 'Cat', N'เปอร์เซีย',       'F',  3.9, NULL),
    (3, N'ขาวมณี',  'Cat', N'ขาวมณี',          'F',  5.5, N'ขี้ตกใจ ห้ามใช้ไดร์เสียงดัง'),
    (4, N'บิ๊กบอส', 'Dog', N'โกลเด้น รีทรีฟเวอร์','M', 31.0, N'ข้อสะโพกไม่ดี'),
    (4, N'ข้าวปั้น', 'Dog', N'ปอมเมอเรเนียน',   'F',  3.1, NULL),
    (5, N'ลาเต้',   'Dog', N'ไซบีเรียน ฮัสกี้', 'M', 22.4, NULL);
GO
PRINT 'Phase 1 complete.';
