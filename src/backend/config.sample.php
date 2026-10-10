<?php
/**
 * VASTRA - Server configuration
 * Copy this file to config.php in the same folder on the server and fill in the values.
 * config.php is git-ignored: never commit real passwords.
 */

// cPanel → MySQL Databases
define('DB_HOST', 'localhost');
define('DB_USER', 'cpaneluser_laundry_user');
define('DB_PASS', 'YOUR_SECURE_PASSWORD');
define('DB_NAME', 'cpaneluser_laundry_db');

// Sender address for password-reset emails. Create this mailbox (or a forwarder)
// in cPanel → Email Accounts so the emails are not marked as spam.
define('MAIL_FROM', 'no-reply@rvsu.ac.in');

// true  = app versions released before login tokens keep working (less secure).
// false = every request must carry a login token. Switch to false once all
//         students have updated to the new Android and iOS app.
define('ALLOW_LEGACY_CLIENTS', true);
