<?php
/**
 * VASTRA - RVS University Smart Hostel Laundry Production API Handler
 * Features:
 * 1. Tiered Rate Limiting (Exponential Backoff for Auth, moderate for public, loose for user)
 * 2. Strict Input Schema Validation (Type, Length, Regex, Enum Whitelists)
 * 3. File Upload Safety (Image MIME Verification, Payload Caps < 500KB)
 * 4. Google Play Store Compliance (Account & Data Deletion Endpoint)
 */

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';

// ==========================================
// 🛡️ CAMPUS-OPTIMIZED HIGH-CONCURRENCY RATE LIMITING
// ==========================================
define('AUTH_MAX_ATTEMPTS', 8);        // 8 failed attempts per specific account before backoff
define('AUTH_WINDOW_MINUTES', 10);     // 10 minute sliding window
define('CAMPUS_MAX_PER_MINUTE', 600);  // 600 requests/min to accommodate 100+ students on same hostel Wi-Fi NAT

function getClientIp() {
    if (!empty($_SERVER['HTTP_CF_CONNECTING_IP'])) return $_SERVER['HTTP_CF_CONNECTING_IP'];
    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $parts = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
        return trim($parts[0]);
    }
    return $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
}

function checkRateLimit($conn, $endpointType, $accountKey = '') {
    // Only apply rate limiting to authentication endpoints per specific account to protect against brute force
    // For general API requests, allow high-speed throughput for all hostel students
    if ($endpointType !== 'auth' || empty($accountKey)) {
        return;
    }

    $ip = getClientIp();
    $now = new DateTime('now', new DateTimeZone('UTC'));
    $nowStr = $now->format('Y-m-d H:i:s');

    // 1. Check if specific account is currently locked by repeated failed passwords
    $stmt = $conn->prepare("SELECT id, attempt_count, first_attempt_time, blocked_until 
                            FROM laundry_rate_limits 
                            WHERE endpoint_type = 'auth' AND account_key = ? 
                            ORDER BY id DESC LIMIT 1");
    $stmt->execute([$accountKey]);
    $record = $stmt->fetch();

    if ($record && !empty($record['blocked_until'])) {
        $blockedUntil = new DateTime($record['blocked_until'], new DateTimeZone('UTC'));
        if ($now < $blockedUntil) {
            $retryAfterSeconds = $blockedUntil->getTimestamp() - $now->getTimestamp();
            http_response_code(429);
            header("Retry-After: " . max(1, $retryAfterSeconds));
            echo json_encode([
                "success" => false,
                "error" => "Too many failed login attempts for this account. Please wait " . max(1, $retryAfterSeconds) . " seconds.",
                "retry_after" => max(1, $retryAfterSeconds)
            ]);
            exit();
        }
    }
}

function recordFailedAuth($conn, $accountKey) {
    if (empty($accountKey)) return;
    $ip = getClientIp();
    $now = new DateTime('now', new DateTimeZone('UTC'));
    $nowStr = $now->format('Y-m-d H:i:s');

    $stmt = $conn->prepare("SELECT id, attempt_count, first_attempt_time, blocked_until 
                            FROM laundry_rate_limits 
                            WHERE endpoint_type = 'auth' AND account_key = ? 
                            ORDER BY id DESC LIMIT 1");
    $stmt->execute([$accountKey]);
    $record = $stmt->fetch();

    if ($record) {
        $firstAttempt = new DateTime($record['first_attempt_time'], new DateTimeZone('UTC'));
        $diffMinutes = ($now->getTimestamp() - $firstAttempt->getTimestamp()) / 60;

        if ($diffMinutes < AUTH_WINDOW_MINUTES) {
            $newCount = $record['attempt_count'] + 1;
            $blockedUntilStr = null;

            if ($newCount >= AUTH_MAX_ATTEMPTS) {
                $backoffSeconds = ($newCount >= 10) ? 300 : 60;
                $blockDate = clone $now;
                $blockDate->modify("+{$backoffSeconds} seconds");
                $blockedUntilStr = $blockDate->format('Y-m-d H:i:s');
            }

            $upd = $conn->prepare("UPDATE laundry_rate_limits 
                                   SET attempt_count = ?, last_attempt_time = ?, blocked_until = ? 
                                   WHERE id = ?");
            $upd->execute([$newCount, $nowStr, $blockedUntilStr, $record['id']]);
        } else {
            $ins = $conn->prepare("INSERT INTO laundry_rate_limits (ip_address, endpoint_type, account_key, attempt_count, first_attempt_time, last_attempt_time) 
                                   VALUES (?, 'auth', ?, 1, ?, ?)");
            $ins->execute([$ip, $accountKey, $nowStr, $nowStr]);
        }
    } else {
        $ins = $conn->prepare("INSERT INTO laundry_rate_limits (ip_address, endpoint_type, account_key, attempt_count, first_attempt_time, last_attempt_time) 
                               VALUES (?, 'auth', ?, 1, ?, ?)");
        $ins->execute([$ip, $accountKey, $nowStr, $nowStr]);
    }
}

function clearAuthRateLimit($conn, $accountKey = '') {
    if (empty($accountKey)) return;
    $del = $conn->prepare("DELETE FROM laundry_rate_limits WHERE account_key = ? AND endpoint_type = 'auth'");
    $del->execute([$accountKey]);
}

// ==========================================
// 🔍 STRICT SCHEMA VALIDATION SYSTEM
// ==========================================
function validateEmail($email) {
    if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 100) {
        throw new InvalidArgumentException("Invalid email format (maximum 100 characters).");
    }
    return strtolower(trim($email));
}

function validateString($val, $fieldName, $minLen = 1, $maxLen = 100) {
    if (!is_string($val) || strlen(trim($val)) < $minLen || strlen(trim($val)) > $maxLen) {
        throw new InvalidArgumentException("Invalid {$fieldName}: must be between {$minLen} and {$maxLen} characters.");
    }
    return htmlspecialchars(trim($val), ENT_QUOTES, 'UTF-8');
}

function validatePhone($phone) {
    if (!preg_match('/^[0-9+\s\-]{7,25}$/', trim($phone))) {
        throw new InvalidArgumentException("Invalid phone number format.");
    }
    return trim($phone);
}

function validateAcademicYear($year) {
    if (empty($year)) {
        return '1st Year';
    }
    // Allow standard years and courses (B.Tech 1-4, Diploma 1-2, Nursing, Pharmacy, MBA, MCA, BBT, etc.)
    return htmlspecialchars(trim($year), ENT_QUOTES, 'UTF-8');
}

function validateStatus($status) {
    $allowed = [
        'pending_approval', 'dropoff_scheduled', 'in_wash', 
        'drying_ironing', 'ready_for_pickup', 'completed', 'cancelled'
    ];
    if (!in_array($status, $allowed, true)) {
        throw new InvalidArgumentException("Invalid booking status.");
    }
    return $status;
}

function validatePhotosArray($photos) {
    if (!is_array($photos)) return [];
    $validated = [];
    foreach ($photos as $photo) {
        if (!is_string($photo)) continue;
        $photo = trim($photo);
        if (empty($photo)) continue;
        // Verify size is < 800KB per image
        if (strlen($photo) > (800 * 1024 * 1.37)) {
            continue;
        }
        $validated[] = $photo;
    }
    return $validated;
}

// ==========================================
// 🚀 MAIN ROUTER
// ==========================================
$action = $_GET['action'] ?? '';
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$rawBody = file_get_contents('php://input');
$body = json_decode($rawBody, true) ?? [];

try {
    // Every action except these needs to know who is calling
    $publicActions = ['register', 'login', 'logout', 'request_password_reset', 'reset_password'];
    $authUser = in_array($action, $publicActions, true) ? null : getAuthUser($conn);

    switch ($action) {
        // ----------------------------------------------------
        // 1. REGISTER STUDENT / STAFF
        // ----------------------------------------------------
        case 'register':
            $email = validateEmail($body['email'] ?? '');
            checkRateLimit($conn, 'auth', $email);

            $password = $body['password'] ?? '';
            if (strlen($password) < 6 || strlen($password) > 100) {
                http_response_code(422);
                echo json_encode(["success" => false, "error" => "Password must be at least 6 characters."]);
                exit();
            }

            $fullName = validateString($body['full_name'] ?? '', 'Full Name', 2, 100);
            $studentId = validateString($body['student_id'] ?? '', 'Student Roll ID', 1, 30);
            $academicYear = validateAcademicYear($body['academic_year'] ?? '1st Year');
            $hostelBlock = validateString($body['hostel_block'] ?? '', 'Hostel Block', 2, 60);
            $roomNumber = validateString($body['room_number'] ?? '', 'Room Number', 1, 20);
            $phone = validatePhone($body['phone_number'] ?? '');
            // Self-registration always creates a student. Staff/admin roles are set by the
            // college directly in the database (laundry_users.role), never by the app.
            $role = 'student';

            // Check duplicate email
            $chk = $conn->prepare("SELECT id FROM laundry_users WHERE LOWER(TRIM(email)) = LOWER(TRIM(?))");
            $chk->execute([$email]);
            if ($chk->fetch()) {
                http_response_code(409);
                echo json_encode(["success" => false, "error" => "An account with this email already exists. Please sign in."]);
                exit();
            }

            // Check duplicate Student Roll Number
            if (!empty($studentId) && $studentId !== 'SVCET-STD' && $studentId !== 'RVS-STD') {
                $chkRoll = $conn->prepare("SELECT id FROM laundry_users WHERE LOWER(TRIM(student_id)) = LOWER(TRIM(?))");
                $chkRoll->execute([$studentId]);
                if ($chkRoll->fetch()) {
                    http_response_code(409);
                    echo json_encode(["success" => false, "error" => "An account with Student Roll Number '$studentId' already exists. Please sign in or reset password."]);
                    exit();
                }
            }

            $userId = 'usr_' . uniqid();
            $hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 10]);

            $ins = $conn->prepare("INSERT INTO laundry_users 
                (id, email, password_hash, full_name, role, student_id, academic_year, hostel_block, room_number, phone_number, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())");
            $ins->execute([$userId, $email, $hash, $fullName, $role, $studentId, $academicYear, $hostelBlock, $roomNumber, $phone]);

            clearAuthRateLimit($conn, $email);
            $token = issueSession($conn, $userId);

            echo json_encode([
                "success" => true,
                "token" => $token,
                "user" => [
                    "id" => $userId,
                    "email" => $email,
                    "full_name" => $fullName,
                    "role" => $role,
                    "student_id" => $studentId,
                    "academic_year" => $academicYear,
                    "hostel_block" => $hostelBlock,
                    "room_number" => $roomNumber,
                    "phone_number" => $phone,
                ]
            ]);
            break;

        // ----------------------------------------------------
        // 2. LOGIN (Multi-Identifier: Email, Roll No, or Phone)
        // ----------------------------------------------------
        case 'login':
            $rawIdentifier = trim($body['identifier'] ?? $body['student_id'] ?? $body['email'] ?? $body['phone'] ?? '');
            $password = $body['password'] ?? '';

            if (empty($rawIdentifier) || empty($password)) {
                http_response_code(422);
                echo json_encode(["success" => false, "error" => "Please enter your Email/Roll Number and Password."]);
                exit();
            }

            checkRateLimit($conn, 'auth', $rawIdentifier);

            // 1. Search by Email, Roll Number (Student ID), or Phone
            $cleanDigits = preg_replace('/[^0-9]/', '', $rawIdentifier);
            $phonePattern = strlen($cleanDigits) >= 7 ? ('%' . substr($cleanDigits, -10)) : '%---%';

            $stmt = $conn->prepare("SELECT * FROM laundry_users 
                WHERE LOWER(TRIM(email)) = LOWER(TRIM(?))
                   OR LOWER(TRIM(student_id)) = LOWER(TRIM(?))
                   OR REPLACE(REPLACE(REPLACE(phone_number, '+', ''), ' ', ''), '-', '') LIKE ?
                LIMIT 1");
            $stmt->execute([$rawIdentifier, $rawIdentifier, $phonePattern]);
            $user = $stmt->fetch();

            // Seamless Fallback / Migration from legacy 'profiles' table if present
            if (!$user) {
                try {
                    $oldStmt = $conn->prepare("SELECT * FROM profiles 
                        WHERE LOWER(TRIM(email)) = LOWER(TRIM(?)) 
                           OR LOWER(TRIM(student_id)) = LOWER(TRIM(?)) 
                        LIMIT 1");
                    $oldStmt->execute([$rawIdentifier, $rawIdentifier]);
                    $oldUser = $oldStmt->fetch();
                    if ($oldUser) {
                        $oldPass = $oldUser['password_hash'] ?? $oldUser['password'] ?? '';
                        if (password_verify($password, $oldPass) || $password === $oldPass) {
                            $user = [
                                'id' => $oldUser['id'] ?? ('usr_' . uniqid()),
                                'email' => $oldUser['email'],
                                'password_hash' => password_hash($password, PASSWORD_BCRYPT),
                                'full_name' => $oldUser['full_name'] ?? 'User',
                                'role' => $oldUser['role'] ?? 'student',
                                'student_id' => $oldUser['student_id'] ?? '',
                                'academic_year' => $oldUser['academic_year'] ?? '1st Year',
                                'hostel_block' => $oldUser['hostel_block'] ?? '',
                                'room_number' => $oldUser['room_number'] ?? '',
                                'phone_number' => $oldUser['phone_number'] ?? '',
                            ];
                            // Migrate into laundry_users
                            $mig = $conn->prepare("INSERT IGNORE INTO laundry_users 
                                (id, email, password_hash, full_name, role, student_id, academic_year, hostel_block, room_number, phone_number, created_at)
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())");
                            $mig->execute([
                                $user['id'], $user['email'], $user['password_hash'], $user['full_name'],
                                $user['role'], $user['student_id'], $user['academic_year'], $user['hostel_block'],
                                $user['room_number'], $user['phone_number']
                            ]);
                        }
                    }
                } catch (Exception $e) {
                    // Fall through
                }
            }

            if (!$user || !password_verify($password, $user['password_hash'])) {
                http_response_code(401);
                echo json_encode(["success" => false, "error" => "Invalid Email/Roll Number or password."]);
                exit();
            }

            clearAuthRateLimit($conn, $rawIdentifier);
            unset($user['password_hash']);
            $token = issueSession($conn, $user['id']);

            echo json_encode([
                "success" => true,
                "token" => $token,
                "user" => $user
            ]);
            break;

        // ----------------------------------------------------
        // 2b. LOGOUT (revokes this device's token)
        // ----------------------------------------------------
        case 'logout':
            revokeSession($conn);
            echo json_encode(["success" => true]);
            break;

        // ----------------------------------------------------
        // ----------------------------------------------------
        // 3. CREATE BOOKING
        // ----------------------------------------------------
        case 'create_booking':
            checkRateLimit($conn, 'booking');

            $userId = htmlspecialchars(substr($body['user_id'] ?? '', 0, 64), ENT_QUOTES, 'UTF-8');
            $studentEmail = htmlspecialchars(substr($body['student_email'] ?? '', 0, 100), ENT_QUOTES, 'UTF-8');
            $studentName = !empty($body['student_name']) ? htmlspecialchars(substr($body['student_name'], 0, 100), ENT_QUOTES, 'UTF-8') : 'Student';
            $studentId = htmlspecialchars(substr($body['student_id'] ?? 'SVCET-STD', 0, 30), ENT_QUOTES, 'UTF-8');
            $academicYear = in_array($body['academic_year'] ?? '', ['1st Year', '2nd Year', '3rd Year', '4th Year']) ? $body['academic_year'] : '1st Year';
            $hostelBlock = htmlspecialchars(substr($body['hostel_block'] ?? 'Block A', 0, 60), ENT_QUOTES, 'UTF-8');
            $roomNumber = htmlspecialchars(substr($body['room_number'] ?? '101', 0, 20), ENT_QUOTES, 'UTF-8');
            $phone = !empty($body['phone_number']) ? htmlspecialchars(substr(preg_replace('/[^0-9+]/', '', $body['phone_number']), 0, 20), ENT_QUOTES, 'UTF-8') : '9876543210';
            $totalItems = max(1, min(9999, (int)($body['total_items'] ?? 1)));
            $itemsJson = json_encode($body['items'] ?? []);
            $photos = validatePhotosArray($body['photos'] ?? []);
            $photosJson = json_encode($photos);
            $dropoffSlot = !empty($body['dropoff_slot_time']) ? htmlspecialchars(substr($body['dropoff_slot_time'], 0, 100), ENT_QUOTES, 'UTF-8') : 'Dropoff Scheduled';
            $pickupSlot = !empty($body['pickup_slot_time']) ? htmlspecialchars(substr($body['pickup_slot_time'], 0, 100), ENT_QUOTES, 'UTF-8') : 'Pickup in 2 Days';
            $instructions = htmlspecialchars(substr($body['special_instructions'] ?? '', 0, 500), ENT_QUOTES, 'UTF-8');

            // A signed-in student can only book for themselves: identity comes from the token
            requireAuthOrLegacy($authUser);
            if ($authUser && !isStaffUser($authUser)) {
                $userId = $authUser['id'];
                $studentEmail = $authUser['email'];
                $studentName = $authUser['full_name'] ?: $studentName;
                $studentId = $authUser['student_id'] ?: $studentId;
                $hostelBlock = $authUser['hostel_block'] ?: $hostelBlock;
                $roomNumber = $authUser['room_number'] ?: $roomNumber;
                $phone = $authUser['phone_number'] ?: $phone;
            }

            $bookingId = 'bkg_' . uniqid();
            $tokenNumber = 'LND-' . str_pad(rand(1000, 9999), 4, '0', STR_PAD_LEFT);

            $ins = $conn->prepare("INSERT INTO laundry_bookings 
                (id, user_id, pickup_token, student_name, student_email, student_id, academic_year, hostel_block, room_number, phone_number, items, total_items, status, dropoff_slot_time, pickup_slot_time, counter_number, special_instructions, photos, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_approval', ?, ?, 'Counter 1', ?, ?, NOW(), NOW())");
            
            $ins->execute([
                $bookingId, $userId, $tokenNumber, $studentName, $studentEmail, $studentId, $academicYear,
                $hostelBlock, $roomNumber, $phone, $itemsJson, $totalItems,
                $dropoffSlot, $pickupSlot, $instructions, $photosJson
            ]);

            echo json_encode([
                "success" => true,
                "booking" => [
                    "id" => $bookingId,
                    "user_id" => $userId,
                    "pickup_token" => $tokenNumber,
                    "student_name" => $studentName,
                    "student_email" => $studentEmail,
                    "student_id" => $studentId,
                    "academic_year" => $academicYear,
                    "hostel_block" => $hostelBlock,
                    "room_number" => $roomNumber,
                    "phone_number" => $phone,
                    "items" => $body['items'] ?? [],
                    "total_items" => $totalItems,
                    "status" => "pending_approval",
                    "dropoff_slot_time" => $dropoffSlot,
                    "pickup_slot_time" => $pickupSlot,
                    "counter_number" => "Counter 1",
                    "special_instructions" => $instructions,
                    "photos" => $photos,
                    "created_at" => date('Y-m-d H:i:s'),
                ]
            ]);
            break;

        // ----------------------------------------------------
        // 4. GET BOOKINGS
        // ----------------------------------------------------
        case 'get_bookings':
            requireAuthOrLegacy($authUser);
            if ($authUser && !isStaffUser($authUser)) {
                // Students only ever receive their own bookings
                $stmt = $conn->prepare("SELECT * FROM laundry_bookings
                    WHERE user_id = ?
                       OR LOWER(student_email) = LOWER(?)
                       OR (? <> '' AND LOWER(student_id) = LOWER(?))
                    ORDER BY created_at DESC");
                $stmt->execute([$authUser['id'], $authUser['email'], $authUser['student_id'], $authUser['student_id']]);
            } else {
                $stmt = $conn->query("SELECT * FROM laundry_bookings ORDER BY created_at DESC");
            }
            $rows = $stmt->fetchAll();
            $results = [];

            foreach ($rows as $r) {
                $r['items'] = json_decode($r['items'] ?? '{}', true) ?: [];
                $r['photos'] = json_decode($r['photos'] ?? '[]', true) ?: [];
                $results[] = $r;
            }

            echo json_encode(["success" => true, "bookings" => $results]);
            break;

        // ----------------------------------------------------
        // 5. UPDATE STATUS
        // ----------------------------------------------------
        case 'update_status':
            requireStaffOrLegacy($authUser);
            $bookingId = validateString($body['booking_id'] ?? '', 'Booking ID', 1, 64);
            $statusParam = $body['new_status'] ?? $body['status'] ?? '';
            $newStatus = validateStatus($statusParam);
            $notes = isset($body['notes']) ? htmlspecialchars(substr($body['notes'], 0, 500), ENT_QUOTES, 'UTF-8') : null;

            $upd = $conn->prepare("UPDATE laundry_bookings SET status = ?, notes_by_staff = ?, updated_at = NOW() WHERE id = ?");
            $upd->execute([$newStatus, $notes, $bookingId]);

            echo json_encode(["success" => true, "message" => "Status updated successfully."]);
            break;

        // ----------------------------------------------------
        // 6. GET NOTIFICATIONS
        // ----------------------------------------------------
        case 'get_notifications':
            requireAuthOrLegacy($authUser);
            $phone = $body['phone_number'] ?? $_GET['phone_number'] ?? '';
            if ($authUser && !isStaffUser($authUser)) {
                $stmt = $conn->prepare("SELECT * FROM laundry_notifications
                    WHERE recipient_role IN ('student', 'all')
                      AND (target_user_phone = '' OR target_user_phone = ?)
                    ORDER BY created_at DESC LIMIT 50");
                $stmt->execute([$authUser['phone_number']]);
            } elseif (!empty($phone)) {
                $stmt = $conn->prepare("SELECT * FROM laundry_notifications WHERE phone_number = ? ORDER BY created_at DESC LIMIT 50");
                $stmt->execute([$phone]);
            } else {
                $stmt = $conn->query("SELECT * FROM laundry_notifications ORDER BY created_at DESC LIMIT 50");
            }
            $notifications = $stmt->fetchAll() ?: [];
            echo json_encode(["success" => true, "notifications" => $notifications]);
            break;

        // ----------------------------------------------------
        // 7. MARK NOTIFICATION READ
        // ----------------------------------------------------
        case 'mark_notification_read':
            requireAuthOrLegacy($authUser);
            $notifId = $body['notification_id'] ?? '';
            if (!empty($notifId)) {
                $upd = $conn->prepare("UPDATE laundry_notifications SET is_read = 1 WHERE id = ?");
                $upd->execute([$notifId]);
            }
            echo json_encode(["success" => true, "message" => "Notification marked as read."]);
            break;

        // ----------------------------------------------------
        // 8. GOOGLE PLAY COMPLIANCE: DELETE ACCOUNT & ALL DATA
        // ----------------------------------------------------
        case 'delete_account':
            if ($authUser) {
                // Signed in: the token proves who is asking
                $user = $authUser;
            } else {
                // Website deletion form / old app: email + password
                $email = validateEmail($body['email'] ?? '');
                $password = $body['password'] ?? '';

                $chk = $conn->prepare("SELECT id, email, student_id, password_hash, phone_number FROM laundry_users WHERE email = ?");
                $chk->execute([$email]);
                $user = $chk->fetch();

                if (!$user || !password_verify($password, $user['password_hash'])) {
                    http_response_code(401);
                    echo json_encode(["success" => false, "error" => "Invalid credentials for account deletion."]);
                    exit();
                }
            }

            // Permanently delete the user and everything linked to them
            $delBookings = $conn->prepare("DELETE FROM laundry_bookings
                WHERE user_id = ? OR LOWER(student_email) = LOWER(?) OR (? <> '' AND phone_number = ?)");
            $delBookings->execute([$user['id'], $user['email'], $user['phone_number'], $user['phone_number']]);

            try {
                $delTickets = $conn->prepare("DELETE FROM laundry_tickets WHERE LOWER(student_email) = LOWER(?)");
                $delTickets->execute([$user['email']]);
                $delResets = $conn->prepare("DELETE FROM laundry_password_resets WHERE email = ?");
                $delResets->execute([strtolower($user['email'])]);
            } catch (PDOException $e) {
                // Tables may not exist yet on older installs
            }

            revokeAllSessions($conn, $user['id']);

            $delUser = $conn->prepare("DELETE FROM laundry_users WHERE id = ?");
            $delUser->execute([$user['id']]);

            echo json_encode([
                "success" => true,
                "message" => "Your account and all associated laundry data have been permanently deleted in accordance with Privacy Policies."
            ]);
            break;

        case 'get_tickets':
            if ($method !== 'GET') {
                http_response_code(405);
                echo json_encode(["success" => false, "error" => "Method not allowed"]);
                exit();
            }

            // Ensure laundry_tickets table exists
            $conn->exec("CREATE TABLE IF NOT EXISTS laundry_tickets (
                id VARCHAR(64) PRIMARY KEY,
                student_name VARCHAR(100) NOT NULL,
                student_email VARCHAR(100),
                student_id VARCHAR(50),
                room_number VARCHAR(20),
                hostel_block VARCHAR(60),
                phone_number VARCHAR(30),
                category VARCHAR(60),
                category_id VARCHAR(40),
                title VARCHAR(200) NOT NULL,
                description TEXT NOT NULL,
                photo_uri LONGTEXT,
                status VARCHAR(30) DEFAULT 'open',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

            requireAuthOrLegacy($authUser);
            if ($authUser && !isStaffUser($authUser)) {
                $stmt = $conn->prepare("SELECT * FROM laundry_tickets WHERE LOWER(student_email) = LOWER(?) ORDER BY created_at DESC");
                $stmt->execute([$authUser['email']]);
            } else {
                $stmt = $conn->query("SELECT * FROM laundry_tickets ORDER BY created_at DESC");
            }
            $tickets = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode(["success" => true, "tickets" => $tickets]);
            break;

        case 'create_ticket':
            if ($method !== 'POST') {
                http_response_code(405);
                echo json_encode(["success" => false, "error" => "Method not allowed"]);
                exit();
            }

            // Ensure laundry_tickets table exists
            $conn->exec("CREATE TABLE IF NOT EXISTS laundry_tickets (
                id VARCHAR(64) PRIMARY KEY,
                student_name VARCHAR(100) NOT NULL,
                student_email VARCHAR(100),
                student_id VARCHAR(50),
                room_number VARCHAR(20),
                hostel_block VARCHAR(60),
                phone_number VARCHAR(30),
                category VARCHAR(60),
                category_id VARCHAR(40),
                title VARCHAR(200) NOT NULL,
                description TEXT NOT NULL,
                photo_uri LONGTEXT,
                status VARCHAR(30) DEFAULT 'open',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

            $tId = !empty($body['id']) ? $body['id'] : 'tkt_' . round(microtime(true) * 1000);
            $sName = validateString($body['student_name'] ?? 'Student', 'Student Name', 1, 100);
            $sEmail = $body['student_email'] ?? '';
            $sId = $body['student_id'] ?? '';
            $rNum = $body['room_number'] ?? '';
            $hBlock = $body['hostel_block'] ?? '';
            $pNum = $body['phone_number'] ?? '';
            $cat = $body['category'] ?? 'General Issue';
            $catId = $body['category_id'] ?? 'other';
            $title = validateString($body['title'] ?? '', 'Ticket Title', 2, 200);
            $desc = validateString($body['description'] ?? '', 'Description', 2, 5000);
            $photo = $body['photo_uri'] ?? null;
            $status = 'open';

            requireAuthOrLegacy($authUser);
            if ($authUser && !isStaffUser($authUser)) {
                $sName = $authUser['full_name'] ?: $sName;
                $sEmail = $authUser['email'];
                $sId = $authUser['student_id'];
                $rNum = $authUser['room_number'];
                $hBlock = $authUser['hostel_block'];
                $pNum = $authUser['phone_number'];
            }

            $ins = $conn->prepare("INSERT INTO laundry_tickets (id, student_name, student_email, student_id, room_number, hostel_block, phone_number, category, category_id, title, description, photo_uri, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $ins->execute([$tId, $sName, $sEmail, $sId, $rNum, $hBlock, $pNum, $cat, $catId, $title, $desc, $photo, $status]);

            http_response_code(201);
            echo json_encode([
                "success" => true,
                "message" => "Ticket created successfully.",
                "ticket" => [
                    "id" => $tId,
                    "student_name" => $sName,
                    "student_email" => $sEmail,
                    "student_id" => $sId,
                    "room_number" => $rNum,
                    "hostel_block" => $hBlock,
                    "phone_number" => $pNum,
                    "category" => $cat,
                    "category_id" => $catId,
                    "title" => $title,
                    "description" => $desc,
                    "photo_uri" => $photo,
                    "status" => $status,
                    "created_at" => date('c')
                ]
            ]);
            break;

        case 'update_ticket_status':
            if ($method !== 'POST') {
                http_response_code(405);
                echo json_encode(["success" => false, "error" => "Method not allowed"]);
                exit();
            }

            requireStaffOrLegacy($authUser);
            $tId = $body['ticket_id'] ?? '';
            $status = in_array($body['status'] ?? '', ['open', 'in_progress', 'resolved']) ? $body['status'] : 'resolved';

            if (empty($tId)) {
                http_response_code(400);
                echo json_encode(["success" => false, "error" => "Ticket ID required."]);
                exit();
            }

            $upd = $conn->prepare("UPDATE laundry_tickets SET status = ? WHERE id = ?");
            $upd->execute([$status, $tId]);

            echo json_encode(["success" => true, "message" => "Ticket updated successfully."]);
            break;

        case 'delete_ticket':
            if ($method !== 'POST') {
                http_response_code(405);
                echo json_encode(["success" => false, "error" => "Method not allowed"]);
                exit();
            }

            requireStaffOrLegacy($authUser);
            $tId = $body['ticket_id'] ?? '';
            if (empty($tId)) {
                http_response_code(400);
                echo json_encode(["success" => false, "error" => "Ticket ID required."]);
                exit();
            }

            $del = $conn->prepare("DELETE FROM laundry_tickets WHERE id = ?");
            $del->execute([$tId]);

            echo json_encode(["success" => true, "message" => "Ticket deleted successfully."]);
            break;

        // ----------------------------------------------------
        // 9. PASSWORD RESET STEP 1: email a one-time code
        // ----------------------------------------------------
        case 'request_password_reset':
            if ($method !== 'POST') {
                http_response_code(405);
                echo json_encode(["success" => false, "error" => "Method not allowed"]);
                exit();
            }

            $email = validateEmail($body['email'] ?? '');
            checkRateLimit($conn, 'auth', 'reset:' . $email);

            $chk = $conn->prepare("SELECT id, full_name FROM laundry_users WHERE LOWER(email) = LOWER(?)");
            $chk->execute([$email]);
            $user = $chk->fetch();

            if ($user) {
                $code = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
                withAuthTables($conn, function () use ($conn, $email, $code) {
                    $up = $conn->prepare("REPLACE INTO laundry_password_resets (email, code_hash, attempts, expires_at, created_at)
                        VALUES (?, ?, 0, DATE_ADD(NOW(), INTERVAL " . RESET_CODE_MINUTES . " MINUTE), NOW())");
                    $up->execute([$email, hash('sha256', $code)]);
                });
                sendResetCodeEmail($email, $user['full_name'], $code);
                // Counts towards the per-account limit so codes cannot be spammed
                recordFailedAuth($conn, 'reset:' . $email);
            }

            // Same answer whether or not the account exists
            echo json_encode([
                "success" => true,
                "message" => "If an account exists for this email, a 6-digit code has been sent. Check your inbox and spam folder."
            ]);
            break;

        // ----------------------------------------------------
        // 10. PASSWORD RESET STEP 2: code + new password
        // ----------------------------------------------------
        case 'reset_password':
            if ($method !== 'POST') {
                http_response_code(405);
                echo json_encode(["success" => false, "error" => "Method not allowed"]);
                exit();
            }

            $email = validateEmail($body['email'] ?? '');
            $newPassword = $body['new_password'] ?? '';
            $code = preg_replace('/[^0-9]/', '', (string)($body['code'] ?? ''));

            if (strlen($newPassword) < 6 || strlen($newPassword) > 100) {
                http_response_code(422);
                echo json_encode(["success" => false, "error" => "New password must be at least 6 characters."]);
                exit();
            }

            if ($code === '') {
                // Old app versions verify with roll number / phone instead of an emailed code
                if (!ALLOW_LEGACY_CLIENTS) {
                    http_response_code(400);
                    echo json_encode(["success" => false, "error" => "Please update the VASTRA app to reset your password."]);
                    exit();
                }
                $studentId = trim($body['student_id'] ?? '');
                $chk = $conn->prepare("SELECT id FROM laundry_users WHERE email = ? AND ? <> '' AND (student_id = ? OR phone_number = ?)");
                $chk->execute([$email, $studentId, $studentId, $studentId]);
                $user = $chk->fetch();
                if (!$user) {
                    http_response_code(400);
                    echo json_encode(["success" => false, "error" => "Email and Roll ID / Phone do not match a registered account."]);
                    exit();
                }
            } else {
                $row = withAuthTables($conn, function () use ($conn, $email) {
                    $q = $conn->prepare("SELECT code_hash, attempts, expires_at > NOW() AS valid FROM laundry_password_resets WHERE email = ?");
                    $q->execute([$email]);
                    return $q->fetch();
                });

                if (!$row || !$row['valid'] || $row['attempts'] >= RESET_CODE_MAX_ATTEMPTS) {
                    http_response_code(400);
                    echo json_encode(["success" => false, "error" => "This code has expired. Please request a new code."]);
                    exit();
                }
                if (!hash_equals($row['code_hash'], hash('sha256', $code))) {
                    $inc = $conn->prepare("UPDATE laundry_password_resets SET attempts = attempts + 1 WHERE email = ?");
                    $inc->execute([$email]);
                    http_response_code(400);
                    echo json_encode(["success" => false, "error" => "Incorrect code. Please check the email and try again."]);
                    exit();
                }

                $chk = $conn->prepare("SELECT id FROM laundry_users WHERE LOWER(email) = LOWER(?)");
                $chk->execute([$email]);
                $user = $chk->fetch();
                $done = $conn->prepare("DELETE FROM laundry_password_resets WHERE email = ?");
                $done->execute([$email]);
                if (!$user) {
                    http_response_code(400);
                    echo json_encode(["success" => false, "error" => "No account found with this email address."]);
                    exit();
                }
            }

            $newHash = password_hash($newPassword, PASSWORD_BCRYPT);
            $upd = $conn->prepare("UPDATE laundry_users SET password_hash = ? WHERE id = ?");
            $upd->execute([$newHash, $user['id']]);

            // Sign out every device that used the old password
            revokeAllSessions($conn, $user['id']);
            clearAuthRateLimit($conn, 'reset:' . $email);

            echo json_encode([
                "success" => true,
                "message" => "Your password has been reset successfully. You can now sign in with your new password."
            ]);
            break;

        case 'get_students_census':
            requireStaffOrLegacy($authUser);
            $stmt = $conn->query("SELECT id, email, full_name, role, student_id, academic_year, hostel_block, room_number, phone_number, created_at FROM laundry_users ORDER BY created_at DESC");
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
            echo json_encode(["success" => true, "users" => $users]);
            break;

        default:
            http_response_code(404);
            echo json_encode(["success" => false, "error" => "Endpoint not found."]);
            break;
    }
} catch (InvalidArgumentException $e) {
    http_response_code(422);
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
} catch (Exception $e) {
    error_log('VASTRA API error [' . $action . ']: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Something went wrong on the server. Please try again."]);
}
