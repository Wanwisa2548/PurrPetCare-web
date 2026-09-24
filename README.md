# PurrPet Care: เว็บโรงแรมสัตว์เลี้ยง + อาบน้ำตัดขน

เว็บ Node.js (Express) ที่ต่อกับฐานข้อมูล **SQL Server (PurrPetCare)** จริง
ทุกการบันทึกข้อมูลทำผ่าน **Stored Procedure** และทุกการแสดงผลอ่านจาก **View / Function**
ส่วน **Trigger** ในฐานข้อมูลทำงานเองอัตโนมัติ

```
purrpet-web/
├─ database/
│  ├─ PurrPetCare_Phase1.sql     ① Database, Storage, Schema, Rule, Default, Type, Sequence, ตาราง, ข้อมูลตั้งต้น
│  ├─ PurrPetCare_Phase2.sql     ② Function, View, Trigger, Stored Procedure
│  └─ PurrPetCare_WebLogin.sql   ③ Login/User/Role ของเว็บ (Security)
├─ src/
│  ├─ server.js                  ตัวเว็บเซิร์ฟเวอร์
│  ├─ db.js                      การเชื่อมต่อ SQL Server
│  ├─ check-db.js                ทดสอบการเชื่อมต่อ
│  └─ routes/  auth.js · customer.js · admin.js
├─ public/                       หน้าเว็บ (HTML/CSS/JS)
├─ .env.example                  ตัวอย่างค่าตั้งค่า
└─ package.json
```

---

## ขั้นตอนติดตั้ง (ทำครั้งเดียว)

### 1. ติดตั้งโปรแกรม
- **Node.js LTS** จาก https://nodejs.org (เวอร์ชัน 18 ขึ้นไป)
- SQL Server + SSMS (มีอยู่แล้วจากวิชา)

### 2. เปิดให้ SQL Server รับการเชื่อมต่อจากเว็บ
ปกติเราเข้า SSMS ด้วย Windows Authentication แต่เว็บ Node.js ต้องใช้ **SQL Server Authentication**

1. **เปิด Mixed Mode:** ใน SSMS คลิกขวาชื่อเซิร์ฟเวอร์ → Properties → Security →
   เลือก **SQL Server and Windows Authentication mode** → OK
2. **เปิด TCP/IP:** เปิดโปรแกรม **SQL Server Configuration Manager** →
   SQL Server Network Configuration → Protocols for SQLEXPRESS (หรือ MSSQLSERVER) →
   คลิกขวา **TCP/IP → Enable**
3. ถ้าใช้ชื่อแบบ `localhost\SQLEXPRESS`: ในหน้า SQL Server Services ให้ **Start** ตัว **SQL Server Browser**
   (ถ้าเป็น Disabled ให้คลิกขวา → Properties → Service → Start Mode = Automatic ก่อน)
4. **Restart** ตัว SQL Server (SQLEXPRESS) ในหน้า SQL Server Services

### 3. สร้างฐานข้อมูล
เปิดไฟล์ใน SSMS แล้วกด Execute **ตามลำดับ**
1. `database/PurrPetCare_Phase1.sql`
2. `database/PurrPetCare_Phase2.sql`
3. `database/PurrPetCare_WebLogin.sql` (สร้างบัญชี `purrpet_web` รหัส `PurrPet@2026`)

### 4. ตั้งค่าเว็บ
เปิด Command Prompt / Terminal ในโฟลเดอร์ `purrpet-web`
```bash
copy .env.example .env      # Mac/Linux ใช้: cp .env.example .env
npm install
```
เปิดไฟล์ `.env` แล้วแก้ `DB_SERVER` / `DB_INSTANCE` ให้ตรงกับชื่อที่ใช้ต่อใน SSMS

| ใน SSMS ต่อด้วย | ใส่ใน .env |
|---|---|
| `localhost\SQLEXPRESS` หรือ `ชื่อเครื่อง\SQLEXPRESS` | `DB_SERVER=localhost` · `DB_INSTANCE=SQLEXPRESS` |
| `localhost` หรือ `.` | `DB_SERVER=localhost` · `DB_INSTANCE=` (เว้นว่าง) |

### 5. ทดสอบและเปิดเว็บ
```bash
npm run check-db     # ต้องขึ้น ✔ ต่อฐานข้อมูลสำเร็จ
npm start
```
- หน้าลูกค้า: http://localhost:3000 (บัญชีทดลอง `aree@mail.com` / `1234`)
- หน้า Admin: http://localhost:3000/admin.html (รหัส `admin1234`)

---

## แก้ปัญหาต่อฐานข้อมูลไม่ได้
| ข้อความ | สาเหตุ / วิธีแก้ |
|---|---|
| `Login failed for user 'purrpet_web'` | ยังไม่ได้เปิด Mixed Mode หรือยังไม่ Restart SQL Server (ข้อ 2.1, 2.4) หรือยังไม่ได้รันไฟล์ ③ |
| `Failed to connect ... instance` / `ETIMEOUT` | ยังไม่ได้ Start **SQL Server Browser** (ข้อ 2.3) หรือชื่อ `DB_INSTANCE` ผิด |
| `ECONNREFUSED` | ยังไม่ได้เปิด TCP/IP (ข้อ 2.2) |
| `permission was denied` | รันไฟล์ ③ ใหม่ (ต้องรันหลัง Phase 2) |
| อยากลบตารางแล้วโดนห้าม | เป็นผลของ Database Trigger รัน `DISABLE TRIGGER trg_ProtectTables ON DATABASE;` ก่อน |

---

## ฟีเจอร์บนเว็บ ↔ Object ในฐานข้อมูล (ใช้อธิบายตอนนำเสนอ)

| หน้าเว็บ / ปุ่ม | สิ่งที่ทำงานในฐานข้อมูล |
|---|---|
| สมัครสมาชิก | `customer.sp_RegisterCustomer` → Rule `rl_Phone` ตรวจเบอร์ผ่าน Type `PhoneNo`, Default `df_Now` |
| เข้าสู่ระบบ | `customer.sp_GetCustomerLogin` (เว็บไม่มีสิทธิ์อ่าน PasswordHash ตรงๆ) |
| น้องของฉัน | อ่าน `customer.vw_PetProfiles` · เพิ่มด้วย `customer.sp_AddPet` · Computed column `WeightClass` |
| ราคาอาบน้ำตัดขน | `booking.fn_CalculateGroomingPrice` (+20% / +50% ตามน้ำหนัก) |
| ค้นหาห้องว่าง | `hotel.fn_AvailableRooms` (Table-valued function) |
| ค้นหาช่างว่าง | `grooming.fn_AvailableGroomers` |
| ยืนยันการจอง | `booking.sp_CreateBooking` (TRANSACTION + Table Type `ServiceRequest`/`ExtraRequest` + Sequence เลข BK000001 + `fn_CalculateTotalPrice`) |
| ติดตามสถานะ | `booking.vw_BookingSummary` (คอลัมน์ `TrackerStage`) |
| Admin: เช็กอิน / เช็กเอาต์ | `sp_CheckIn` / `sp_CheckOut` → **Trigger** `trg_BookingRooms_Status` เปลี่ยนห้องเป็น Occupied / Cleaning เอง |
| Admin: ทำความสะอาดเสร็จ | `hotel.sp_MarkRoomCleaned` |
| Admin: ตารางคิวช่าง | `grooming.vw_GroomingSchedule` · ปุ่มเริ่ม/เสร็จ → `sp_UpdateGroomingStatus` |
| Admin: Dashboard | `hotel.vw_RoomStatusToday`, `booking.vw_DailyRevenue`, `ops.Notifications` |
| Admin: รับเงิน | `booking.sp_AddPayment` → ตาราง `Payments` ที่แบ่ง Partition ตามปี |
| กันจองช่างซ้อน / ห้องซ้อน | **Trigger** `trg_BookingGrooming_NoOverlap`, `trg_BookingRooms_NoOverlap` |

## สคริปต์เดโมแนะนำ (ประมาณ 5 นาที)
1. สมัครสมาชิกด้วยเบอร์ `12345` → โดน Rule ปฏิเสธ แล้วแก้เป็นเบอร์ที่ถูก
2. เพิ่มน้องหนัก 20 kg → ขึ้นไซซ์ L และราคาอาบน้ำ +50% อัตโนมัติ
3. จองห้อง + อาบน้ำ + ตัดขน กับช่าง A เวลา 10:00 → ได้เลข BK… และยอดรวม
4. ล็อกอินบัญชีอื่น จองช่าง A เวลา 10:30 วันเดียวกัน → ปุ่มค้นหาช่างจะไม่แสดงช่าง A
   (ถ้าอยากโชว์ Trigger ตรงๆ ให้รันใน SSMS: INSERT คิวซ้อนเข้า `Booking_Grooming` จะโดน ROLLBACK)
5. หน้า Admin: เช็กอิน → ห้องเปลี่ยนเป็น "มีน้องพัก" · กดเริ่มในตารางช่าง → ฝั่งลูกค้าเห็น "กำลังอาบน้ำเป่าขน"
6. กดเสร็จ → "หล่อพร้อมกลับบ้าน" · เช็กเอาต์ → ห้องเป็น "รอทำความสะอาด" · รับเงิน → รายได้วันนี้ขึ้น
