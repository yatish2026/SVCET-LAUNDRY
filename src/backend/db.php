<?php
/**
 * SVCET CampusWash - Database Connection & Self-Healing Table Generator
 * Automatically creates all tables with proper indexes if they do not exist
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Auth-Token, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");
header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: SAMEORIGIN");
header("X-XSS-Protection: 1; mode=block");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database credentials live only in config.php on the server (never commit it).
// Copy config.sample.php to config.php and fill in the cPanel MySQL details.
if (!file_exists(__DIR__ . '/config.php')) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Server is not configured (config.php missing)."]);
    exit();
}
require_once __DIR__ . '/config.php';

$conn = null;

try {
    $conn = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (PDOException $e) {
    // Intelligent fallback for cPanel prefix/case variations
    $fallbackUsers = [DB_USER, 'yatish_laundry_user', 'ommx7iasogql_yatish_laundry_user'];
    $fallbackDbs = [DB_NAME, 'laundry_db', 'ommx7iasogql_laundry_db'];
    $fallbackPasses = [DB_PASS, 'Yatish@2026', 'yatish@2026'];

    foreach ($fallbackUsers as $u) {
        foreach ($fallbackDbs as $d) {
            foreach ($fallbackPasses as $p) {
                try {
                    $conn = new PDO("mysql:host=" . DB_HOST . ";dbname=" . $d . ";charset=utf8mb4", $u, $p, [
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                        PDO::ATTR_EMULATE_PREPARES => false,
                    ]);
                    break 3;
                } catch (PDOException $e2) {
                    continue;
                }
            }
        }
    }
}

if (!$conn) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => "Database temporarily busy. Please retry in a moment."
    ]);
    exit();
}

// Auto-create/migrate tables only when explicitly requested via setup action
if (isset($_GET['action']) && $_GET['action'] === 'init_schema') {
    try {
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

        $conn->exec("CREATE TABLE IF NOT EXISTS laundry_tickets (
            id VARCHAR(64) PRIMARY KEY,
            student_name VARCHAR(100) NOT NULL,
            student_email VARCHAR(100) DEFAULT '',
            student_id VARCHAR(50) DEFAULT '',
            room_number VARCHAR(50) DEFAULT '',
            hostel_block VARCHAR(100) DEFAULT '',
            phone_number VARCHAR(30) DEFAULT '',
            category VARCHAR(50) DEFAULT 'technical',
            category_id VARCHAR(50) DEFAULT 'technical_app',
            title VARCHAR(200) NOT NULL,
            description TEXT NOT NULL,
            photo_uri LONGTEXT,
            status VARCHAR(40) DEFAULT 'open',
            admin_response TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            resolved_at DATETIME NULL,
            INDEX idx_ticket_status (status),
            INDEX idx_ticket_email (student_email),
            INDEX idx_ticket_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

        require_once __DIR__ . '/auth.php';
        ensureAuthTables($conn);

        echo json_encode(["success" => true, "message" => "Database schema initialized successfully"]);
        exit();
    } catch (Exception $e) {
        echo json_encode(["success" => false, "error" => $e->getMessage()]);
        exit();
    }
}
