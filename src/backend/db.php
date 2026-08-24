<?php
/**
 * SVCET CampusWash - Database Connection & Self-Healing Table Generator
 * Automatically creates all tables with proper indexes if they do not exist
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Load custom config if present
if (file_exists(__DIR__ . '/config.php')) {
    require_once __DIR__ . '/config.php';
}

$host = defined('DB_HOST') ? DB_HOST : (getenv('DB_HOST') ?: 'localhost');
$password = defined('DB_PASS') ? DB_PASS : (getenv('DB_PASS') ?: 'yatish@2026');

$possible_users = [
    defined('DB_USER') ? DB_USER : null,
    'ommx7iasogql_yatish_laundry_user',
    'ommx7iasogql_yatish',
    'yatish_laundry_user'
];
$possible_users = array_values(array_filter($possible_users));

$possible_dbs = [
    defined('DB_NAME') ? DB_NAME : null,
    'ommx7iasogql_laundry_db',
    'laundry_db'
];
$possible_dbs = array_values(array_filter($possible_dbs));

$conn = null;

foreach ($possible_users as $user) {
    foreach ($possible_dbs as $db) {
        try {
            $test_conn = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $password);
            $test_conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $test_conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            $conn = $test_conn;
            break 2;
        } catch (PDOException $e) {
            continue;
        }
    }
}

if (!$conn) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => "Database connection failed. Please check MySQL privileges in GoDaddy cPanel."
    ]);
    exit();
}

// ====================================================
// 🛠️ SELF-HEALING DATABASE TABLES AUTO-CREATION
// ====================================================
try {
    // 1. Users Table
    $conn->exec("CREATE TABLE IF NOT EXISTS laundry_users (
        id VARCHAR(64) PRIMARY KEY,
        email VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        role VARCHAR(20) DEFAULT 'student',
        student_id VARCHAR(50) DEFAULT '',
        academic_year VARCHAR(30) DEFAULT '1st Year',
        hostel_block VARCHAR(100) DEFAULT '',
        room_number VARCHAR(50) DEFAULT '',
        phone_number VARCHAR(30) DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_phone (phone_number)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    // 2. Bookings Table
    $conn->exec("CREATE TABLE IF NOT EXISTS laundry_bookings (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) DEFAULT '',
        pickup_token VARCHAR(20) NOT NULL,
        student_name VARCHAR(100) NOT NULL,
        student_email VARCHAR(100) DEFAULT '',
        student_id VARCHAR(50) DEFAULT '',
        academic_year VARCHAR(30) DEFAULT '1st Year',
        hostel_block VARCHAR(100) DEFAULT '',
        room_number VARCHAR(50) DEFAULT '',
        phone_number VARCHAR(30) DEFAULT '',
        items LONGTEXT,
        total_items INT DEFAULT 1,
        status VARCHAR(40) DEFAULT 'pending_approval',
        dropoff_slot_time VARCHAR(100) DEFAULT '',
        pickup_slot_time VARCHAR(100) DEFAULT '',
        counter_number VARCHAR(50) DEFAULT 'Counter 1',
        special_instructions TEXT,
        notes_by_staff TEXT,
        photos LONGTEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_token (pickup_token),
        INDEX idx_status (status),
        INDEX idx_phone (phone_number),
        INDEX idx_user_id (user_id),
        INDEX idx_email (student_email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    // Dynamic Column Migrations for Backward Compatibility
    try { $conn->exec("ALTER TABLE laundry_bookings ADD COLUMN user_id VARCHAR(64) DEFAULT '' AFTER id"); } catch (Exception $e) {}
    try { $conn->exec("ALTER TABLE laundry_bookings ADD COLUMN student_email VARCHAR(100) DEFAULT '' AFTER student_name"); } catch (Exception $e) {}

    // 3. Notifications Table
    $conn->exec("CREATE TABLE IF NOT EXISTS laundry_notifications (
        id VARCHAR(64) PRIMARY KEY,
        recipient_role VARCHAR(20) DEFAULT 'student',
        target_user_phone VARCHAR(30) DEFAULT '',
        booking_id VARCHAR(64) DEFAULT '',
        title VARCHAR(150) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(40) DEFAULT 'info',
        is_read TINYINT(1) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    // 4. Rate Limits Table
    $conn->exec("CREATE TABLE IF NOT EXISTS laundry_rate_limits (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ip_address VARCHAR(45) NOT NULL,
        endpoint_type VARCHAR(32) NOT NULL,
        account_key VARCHAR(100) DEFAULT '',
        attempt_count INT DEFAULT 1,
        first_attempt_time DATETIME NOT NULL,
        last_attempt_time DATETIME NOT NULL,
        blocked_until DATETIME NULL,
        INDEX idx_ip_endpoint (ip_address, endpoint_type),
        INDEX idx_account (account_key)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

} catch (Exception $e) {
    // Non-fatal
}
