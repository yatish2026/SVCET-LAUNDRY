<?php
/**
 * VASTRA - Session tokens & access control
 *
 * Login/register issue a random session token. The app sends it back on every
 * request in the "X-Auth-Token" header. Only a SHA-256 hash of the token is
 * stored, so a database leak does not expose usable tokens.
 */

define('SESSION_LIFETIME_DAYS', 60);
define('RESET_CODE_MINUTES', 15);
define('RESET_CODE_MAX_ATTEMPTS', 5);

// While true, requests WITHOUT a token keep the old open behaviour so the
// Android/iOS builds that predate login tokens keep working. Set it to false
// in config.php once every student has updated the app.
if (!defined('ALLOW_LEGACY_CLIENTS')) {
    define('ALLOW_LEGACY_CLIENTS', true);
}

function ensureAuthTables($conn) {
    $conn->exec("CREATE TABLE IF NOT EXISTS laundry_sessions (
        token_hash CHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL,
        INDEX idx_session_user (user_id),
        INDEX idx_session_expires (expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    $conn->exec("CREATE TABLE IF NOT EXISTS laundry_password_resets (
        email VARCHAR(100) PRIMARY KEY,
        code_hash CHAR(64) NOT NULL,
        attempts INT DEFAULT 0,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
}

/** Runs $fn; if the auth tables do not exist yet (MySQL error 42S02), creates them and retries once. */
function withAuthTables($conn, $fn) {
    try {
        return $fn();
    } catch (PDOException $e) {
        if ($e->getCode() !== '42S02') throw $e;
        ensureAuthTables($conn);
        return $fn();
    }
}

function issueSession($conn, $userId) {
    $token = bin2hex(random_bytes(32));
    withAuthTables($conn, function () use ($conn, $token, $userId) {
        $ins = $conn->prepare("INSERT INTO laundry_sessions (token_hash, user_id, created_at, last_used_at, expires_at)
                               VALUES (?, ?, NOW(), NOW(), DATE_ADD(NOW(), INTERVAL " . SESSION_LIFETIME_DAYS . " DAY))");
        $ins->execute([hash('sha256', $token), $userId]);
    });
    return $token;
}

function getRequestToken() {
    $token = $_SERVER['HTTP_X_AUTH_TOKEN'] ?? '';
    if ($token === '') {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
        if (stripos($authHeader, 'Bearer ') === 0) {
            $token = substr($authHeader, 7);
        }
    }
    $token = trim($token);
    return preg_match('/^[a-f0-9]{64}$/', $token) ? $token : '';
}

/**
 * Returns the signed-in user (without password hash) or null.
 * A token that is present but invalid/expired is rejected with 401 so the app
 * can send the user back to the login screen.
 */
function getAuthUser($conn) {
    $token = getRequestToken();
    if ($token === '') {
        if (!empty($_SERVER['HTTP_X_AUTH_TOKEN'])) {
            sendAuthError(401, 'SESSION_EXPIRED', 'Your session has expired. Please sign in again.');
        }
        return null;
    }

    $stmt = $conn->prepare("SELECT u.id, u.email, u.full_name, u.role, u.student_id, u.academic_year,
                                   u.hostel_block, u.room_number, u.phone_number, s.last_used_at
                            FROM laundry_sessions s
                            JOIN laundry_users u ON u.id = s.user_id
                            WHERE s.token_hash = ? AND s.expires_at > NOW()
                            LIMIT 1");
    withAuthTables($conn, function () use ($stmt, $token) {
        $stmt->execute([hash('sha256', $token)]);
    });
    $user = $stmt->fetch();

    if (!$user) {
        sendAuthError(401, 'SESSION_EXPIRED', 'Your session has expired. Please sign in again.');
    }

    // Touch the session at most once an hour to avoid a write on every poll
    if (strtotime($user['last_used_at']) < time() - 3600) {
        $touch = $conn->prepare("UPDATE laundry_sessions SET last_used_at = NOW() WHERE token_hash = ?");
        $touch->execute([hash('sha256', $token)]);
    }
    unset($user['last_used_at']);
    return $user;
}

function isStaffUser($user) {
    return $user && in_array($user['role'], ['staff', 'admin'], true);
}

/** Signed-in user, or null when legacy (token-less) clients are still allowed. */
function requireAuthOrLegacy($authUser) {
    if (!$authUser && !ALLOW_LEGACY_CLIENTS) {
        sendAuthError(401, 'AUTH_REQUIRED', 'Please sign in to continue.');
    }
    return $authUser;
}

/** Staff/admin only. Legacy token-less clients pass while ALLOW_LEGACY_CLIENTS is true. */
function requireStaffOrLegacy($authUser) {
    requireAuthOrLegacy($authUser);
    if ($authUser && !isStaffUser($authUser)) {
        sendAuthError(403, 'FORBIDDEN', 'Only laundry staff can perform this action.');
    }
}

function revokeSession($conn) {
    $token = getRequestToken();
    if ($token !== '') {
        withAuthTables($conn, function () use ($conn, $token) {
            $del = $conn->prepare("DELETE FROM laundry_sessions WHERE token_hash = ?");
            $del->execute([hash('sha256', $token)]);
        });
    }
}

function revokeAllSessions($conn, $userId) {
    withAuthTables($conn, function () use ($conn, $userId) {
        $del = $conn->prepare("DELETE FROM laundry_sessions WHERE user_id = ?");
        $del->execute([$userId]);
    });
}

function sendAuthError($status, $code, $message) {
    http_response_code($status);
    echo json_encode(["success" => false, "code" => $code, "error" => $message]);
    exit();
}

function sendResetCodeEmail($email, $fullName, $code) {
    $from = defined('MAIL_FROM') ? MAIL_FROM : 'no-reply@rvsu.ac.in';
    $subject = 'VASTRA password reset code';
    $message = "Hello " . ($fullName ?: 'Student') . ",\r\n\r\n"
        . "Your VASTRA password reset code is: " . $code . "\r\n\r\n"
        . "It expires in " . RESET_CODE_MINUTES . " minutes. If you did not ask to reset your password, ignore this email.\r\n\r\n"
        . "- VASTRA Hostel Laundry, RVS University";
    $headers = "From: VASTRA Laundry <" . $from . ">\r\n"
        . "Reply-To: " . $from . "\r\n"
        . "Content-Type: text/plain; charset=UTF-8\r\n";
    return @mail($email, $subject, $message, $headers, '-f' . $from);
}
