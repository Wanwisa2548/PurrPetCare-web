/* =====================================================================
   PurrPet Care  |  บัญชีสำหรับเว็บ (Security > Logins / Users / Roles)
   รันใน SSMS หลัง Phase 1 และ Phase 2  (ต้องเปิด Mixed Mode ก่อน ดู README)
   ===================================================================== */
USE master;
GO
IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'purrpet_web')
BEGIN
    CREATE LOGIN purrpet_web WITH PASSWORD = 'PurrPet@2026',
        DEFAULT_DATABASE = PurrPetCare, CHECK_POLICY = OFF;
    PRINT 'Create login "purrpet_web" success.';
END
GO

USE PurrPetCare;
GO
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'purrpet_web')
    CREATE USER purrpet_web FOR LOGIN purrpet_web;
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'WebAppRole' AND type = 'R')
    CREATE ROLE WebAppRole;
GO

-- เว็บ "อ่าน" ได้ และ "เรียก Procedure/Function" ได้
-- แต่ไม่ได้สิทธิ์ INSERT/UPDATE/DELETE ตารางตรงๆ  ทุกการเขียนต้องผ่าน Stored Procedure เท่านั้น
GRANT SELECT, EXECUTE ON SCHEMA::customer TO WebAppRole;
GRANT SELECT, EXECUTE ON SCHEMA::hotel    TO WebAppRole;
GRANT SELECT, EXECUTE ON SCHEMA::grooming TO WebAppRole;
GRANT SELECT, EXECUTE ON SCHEMA::booking  TO WebAppRole;
GRANT SELECT          ON SCHEMA::ops      TO WebAppRole;

-- สิทธิ์ใช้ Table Type สำหรับส่งหลายบริการเข้า sp_CreateBooking
GRANT EXECUTE ON TYPE::booking.ServiceRequest TO WebAppRole;
GRANT EXECUTE ON TYPE::booking.ExtraRequest   TO WebAppRole;

-- เว็บห้ามเห็นรหัสผ่านลูกค้าตรงๆ (ต้องผ่าน sp_GetCustomerLogin)
DENY SELECT ON customer.Customers (PasswordHash) TO WebAppRole;
GO

ALTER ROLE WebAppRole ADD MEMBER purrpet_web;
GO
PRINT 'Web login ready: purrpet_web / PurrPet@2026';

/* ---------- ทดสอบสิทธิ์ (โชว์ตอนนำเสนอได้) ----------
EXECUTE AS USER = 'purrpet_web';
    SELECT TOP 3 * FROM booking.vw_BookingSummary;          -- ได้
    DELETE FROM hotel.Rooms WHERE RoomID = 1;                -- โดนปฏิเสธ: DELETE permission was denied
REVERT;
*/
