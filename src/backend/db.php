<?php
/**
 * SVCET CampusWash - Database Connection & Self-Healing Tables
 * Safe for Version Control & Production Deployments
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

// Ensure Rate Limiting Table Exists
try {
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
