# 🧺 VASTRA (SVCET CampusWash) — Smart Hostel Laundry Management System

[![React Native](https://img.shields.io/badge/React%20Native-v0.86-61DAFB?logo=react&logoColor=black)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK%2057-000020?logo=expo)](https://expo.dev/)
[![PHP MySQL](https://img.shields.io/badge/Backend-PHP%208.x%20%7C%20MySQL%20InnoDB-777BB4?logo=php&logoColor=white)](https://php.net)
[![Google Play Ready](https://img.shields.io/badge/Play%20Store-Target%20SDK%2034%20Compliant-34A853?logo=googleplay&logoColor=white)](https://play.google.com)

A production-grade, high-concurrency smart hostel laundry management platform built with **React Native (Expo SDK 57)** and a **RESTful PHP & MySQL Cloud Backend** hosted on cPanel. Designed to effortlessly support 100+ concurrent hostel students and staff simultaneously.

---

## 🏗️ System & Backend Architecture

```
                                 ┌─────────────────────────────────────────┐
                                 │       React Native Client (Expo)        │
                                 │ (Students, Staff & Admin Mobile Portal) │
                                 └────────────────────┬────────────────────┘
                                                      │ HTTPS / TLS 1.3
                                                      ▼
                                 ┌─────────────────────────────────────────┐
                                 │       cPanel / Apache Web Gateway       │
                                 │   (.htaccess - CORS, Headers & Limits)  │
                                 └────────────────────┬────────────────────┘
                                                      │
                                                      ▼
                                 ┌─────────────────────────────────────────┐
                                 │      REST API Router (index.php)        │
                                 │  • Campus NAT Rate Limiter              │
                                 │  • Strict Input Schema Validation       │
                                 │  • Auth & Password Hashing (BCRYPT)     │
                                 │  • Payload Security & Media Guard       │
                                 └────────────────────┬────────────────────┘
                                                      │ Native PDO Driver
                                                      ▼
                                 ┌─────────────────────────────────────────┐
                                 │       MySQL Database (db.php)           │
                                 │  • InnoDB Engine + Strict Indexes       │
                                 │  • Zero-Lock Hot Path Execution         │
                                 │  • Prepared Statements (Native Caching) │
                                 └─────────────────────────────────────────┘
```

---

## ⚡ High-Concurrency & Performance Optimizations

To guarantee that **50–100+ students** can submit bookings and browse the app at the exact same moment without server lockups or IP bans, the backend incorporates the following optimizations:

### 1. Zero-Lock Request Hot Path (`db.php`)
* **Problem Solved**: Standard auto-migrations run `CREATE TABLE IF NOT EXISTS` and `ALTER TABLE` DDL queries on every request, creating **MySQL Metadata Locks (MDL)** that freeze concurrent queries.
* **Solution**: Database connection (`db.php`) connects directly to the production tables using optimized PDO options (`PDO::ATTR_EMULATE_PREPARES => false`). Schema generation is isolated to manual setup actions (`?action=init_schema`), reducing per-request database overhead to **< 10ms**.

### 2. Campus NAT-Aware Rate Limiting System (`index.php`)
* **Problem Solved**: In college hostels, all 100+ students connected to the campus Wi-Fi share the **exact same public IP address (NAT)**. Traditional IP-based rate limiters falsely flag shared traffic as a DDoS attack and block entire hostel blocks.
* **Solution**:
  * **Brute-Force Auth Protection**: Tracks failed login attempts **per account key (Email / Phone Number)** with exponential backoff (60s $\rightarrow$ 300s) instead of blocking the entire Wi-Fi IP.
  * **High-Throughput General Allowance**: Sets a generous threshold (**600 requests/minute per IP**) to smoothly accommodate heavy simultaneous traffic from shared hostel Wi-Fi routers.

### 3. Client-Side Synchronization Model (`LaundryContext.js`)
* **Efficient Background Polling**: Reduced background polling intervals from 3.5s to a healthy **25-second sync cycle**, cutting server request volume by **85%** while keeping client battery consumption minimal.
* **Event-Driven Instant Sync**: Immediate optimistic UI updates trigger automatically upon user actions (e.g., booking submission, intake approval, status advancement, complaint creation) alongside pull-to-refresh on all screens.

---

## 📡 REST API Specification (`index.php`)

All API endpoints are accessed through `https://<domain>/api/index.php?action=<endpoint>`:

| Endpoint Action | Method | Access | Description |
| :--- | :---: | :---: | :--- |
| `?action=register` | `POST` | Public | Registers a new student account with student ID, branch, room, and hashed password. |
| `?action=login` | `POST` | Public | Authenticates student or admin credentials, returning user profile and role token. |
| `?action=get_bookings` | `GET` | Authenticated | Fetches laundry booking records (filtered by user for students, full list for staff). |
| `?action=create_booking` | `POST` | Student | Submits a new laundry request with clothing item breakdown, slot time, and photos. |
| `?action=update_status` | `POST` | Staff / Admin | Advances laundry stage (`pending_approval` $\rightarrow$ `in_wash` $\rightarrow$ `drying_ironing` $\rightarrow$ `ready_for_pickup` $\rightarrow$ `completed`). |
| `?action=get_notifications` | `GET` | Authenticated | Retrieves real-time in-app order updates and administrative announcements. |
| `?action=get_tickets` | `GET` | Authenticated | Loads student support complaints and technical issue tickets. |
| `?action=create_ticket` | `POST` | Student | Logs a formal grievance ticket with category, description, and photo attachments. |
| `?action=update_ticket_status` | `POST` | Staff / Admin | Updates ticket resolution state and logs staff responses. |
| `?action=delete_ticket` | `POST` | Staff / Admin | Permanently removes resolved or spam complaint tickets. |
| `?action=delete_account` | `POST` | Authenticated | Purges user profile, auth credentials, photos, and wash records (Google Play compliant). |
| `?action=reset_password` | `POST` | Public | Verifies student roll number & phone number to reset forgotten account passwords. |
| `?action=get_students_census` | `GET` | Staff / Admin | Aggregates campus branch and academic year census breakdown data. |

---

## 🗄️ Database Schema Design (`MySQL InnoDB`)

The MySQL database (`laundry_db`) consists of 5 relational tables indexed for high read/write throughput:

1. **`laundry_users`**:
   - `id` (VARCHAR 64, PK), `email` (UNIQUE), `password_hash` (BCRYPT), `full_name`, `role` (`student` | `admin` | `staff`), `student_id`, `academic_year`, `hostel_block`, `room_number`, `phone_number`, `created_at`.
   - *Indexes*: `idx_email`, `idx_phone`.

2. **`laundry_bookings`**:
   - `id` (VARCHAR 64, PK), `user_id`, `pickup_token` (`#LND-XXXX`), `student_name`, `student_email`, `student_id`, `academic_year`, `hostel_block`, `room_number`, `phone_number`, `items` (JSON), `total_items`, `status`, `dropoff_slot_time`, `pickup_slot_time`, `photos` (JSON), `created_at`, `updated_at`.
   - *Indexes*: `idx_token`, `idx_status`, `idx_phone`, `idx_user_id`, `idx_email`.

3. **`laundry_notifications`**:
   - `id` (VARCHAR 64, PK), `recipient_role`, `target_user_phone`, `booking_id`, `title`, `message`, `type`, `is_read`, `created_at`.

4. **`laundry_tickets`**:
   - `id` (VARCHAR 64, PK), `student_name`, `student_email`, `student_id`, `room_number`, `hostel_block`, `phone_number`, `category`, `title`, `description`, `photo_uri`, `status` (`open` | `in_progress` | `resolved`), `admin_response`, `created_at`, `resolved_at`.
   - *Indexes*: `idx_ticket_status`, `idx_ticket_email`, `idx_ticket_created`.

5. **`laundry_rate_limits`**:
   - `id` (INT, PK), `ip_address`, `endpoint_type`, `account_key`, `attempt_count`, `first_attempt_time`, `last_attempt_time`, `blocked_until`.
   - *Indexes*: `idx_ip_endpoint`, `idx_account`.

---

## 🛡️ Security & Google Play Store Compliance

* **Android System Photo Picker**: Uses Android's official sandbox photo picker (`PickVisualMedia`) through `expo-image-picker`. **Zero broad device storage permissions** (`READ_MEDIA_IMAGES` / `READ_EXTERNAL_STORAGE`) are requested in `AndroidManifest.xml`, ensuring 100% compliance with Google Play's Target SDK 34+ policy.
* **On-Device Image Compression**: Clothes intake photos are automatically scaled and compressed on-device into lightweight JPEG thumbnails (< 30 KB) prior to network upload.
* **Account & Data Deletion Compliance**: Provides full in-app deletion under Profile settings alongside a dedicated public portal (`privacy.html#account-deletion` & `delete-account.html`) for automated data purges.
* **Data Transit Encryption**: All client-server traffic is enforced over HTTPS with TLS 1.3 encryption.

---

## 🚀 Getting Started

### Prerequisites:
- Node.js $\ge 18$
- Expo CLI (`npx expo`)
- Expo Go App (iOS / Android) or modern web browser
- PHP 8.x + MySQL on cPanel (or local XAMPP/WAMP)

### Installation:
```bash
# Clone the repository
git clone https://github.com/yatish2026/SVCET-LAUNDRY.git
cd SVCET-LAUNDRY

# Install dependencies
npm install

# Start local Expo development server
npx expo start -c
```

### Production Build:
```bash
# Build Android App Bundle (.aab) for Google Play Store
npx eas-cli build --platform android --profile production
```

---

## 📜 License
Developed for **RVS University & Sri Venkateswara College of Engineering and Technology (SVCET)**. All rights reserved.
