/* =====================================================================
   PurrPet Care  |  บัญชีสำหรับเว็บ (Security > Logins / Users / Roles)
   รันใน SSMS หลัง Phase 1 และ Phase 2  (ต้องเปิด Mixed Mode ก่อน ดู README)
   ===================================================================== */
USE master;
GO
IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'purrpet_web')
BEGIN
    CREATE LOGIN purrpet_web WITH PASSWORD = 'PurrPet@2026',  -- Login ระดับ Server (Security > Logins)
        DEFAULT_DATABASE = PurrPetCare, CHECK_POLICY = OFF;  -- CHECK_POLICY = OFF: ไม่บังคับนโยบายรหัสผ่านของ Windows
    PRINT 'Create login "purrpet_web" success.';
END
GO

USE PurrPetCare;
GO
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'purrpet_web')
    CREATE USER purrpet_web FOR LOGIN purrpet_web;  -- User ในฐานข้อมูล ผูกกับ Login (Database > Security > Users)
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'WebAppRole' AND type = 'R')
    CREATE ROLE WebAppRole;  -- Database Role (Database > Security > Roles)
GO

-- เว็บ "อ่าน" ได้ และ "เรียก Procedure/Function" ได้
-- แต่ไม่ได้สิทธิ์ INSERT/UPDATE/DELETE ตารางตรงๆ  ทุกการเขียนต้องผ่าน Stored Procedure เท่านั้น
GRANT SELECT, EXECUTE ON SCHEMA::customer TO WebAppRole;  -- GRANT: อ่านข้อมูลและเรียก Procedure/Function ใน Schema นี้
GRANT SELECT, EXECUTE ON SCHEMA::hotel    TO WebAppRole;  -- GRANT: อ่านข้อมูลและเรียก Procedure/Function ใน Schema นี้
GRANT SELECT, EXECUTE ON SCHEMA::grooming TO WebAppRole;  -- GRANT: อ่านข้อมูลและเรียก Procedure/Function ใน Schema นี้
GRANT SELECT, EXECUTE ON SCHEMA::booking  TO WebAppRole;  -- GRANT: อ่านข้อมูลและเรียก Procedure/Function ใน Schema นี้
GRANT SELECT          ON SCHEMA::ops      TO WebAppRole;  -- GRANT: Schema ops อ่านข้อมูลได้อย่างเดียว

-- สิทธิ์ใช้ Table Type สำหรับส่งหลายบริการเข้า sp_CreateBooking
GRANT EXECUTE ON TYPE::booking.ServiceRequest TO WebAppRole;  -- GRANT EXECUTE: อนุญาตให้ใช้ Table Type นี้
GRANT EXECUTE ON TYPE::booking.ExtraRequest   TO WebAppRole;  -- GRANT EXECUTE: อนุญาตให้ใช้ Table Type นี้

-- เว็บห้ามเห็นรหัสผ่านลูกค้าตรงๆ (ต้องผ่าน sp_GetCustomerLogin)
DENY SELECT ON customer.Customers (PasswordHash) TO WebAppRole;  -- DENY ระดับคอลัมน์: มีผลเหนือ GRANT ระดับ Schema
GO

ALTER ROLE WebAppRole ADD MEMBER purrpet_web;  -- เพิ่ม User เข้า Role เพื่อรับสิทธิ์ของ Role ทั้งหมด
GO
PRINT 'Web login ready: purrpet_web / PurrPet@2026';

/* ---------- ทดสอบสิทธิ์ (โชว์ตอนนำเสนอได้) ----------
EXECUTE AS USER = 'purrpet_web';
    SELECT TOP 3 * FROM booking.vw_BookingSummary;          -- ได้
    DELETE FROM hotel.Rooms WHERE RoomID = 1;                -- โดนปฏิเสธ: DELETE permission was denied
REVERT;
*/
