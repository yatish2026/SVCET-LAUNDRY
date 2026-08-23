<?php
/**
 * SVCET CampusWash - Sample DB Config (Copy to config.php on server)
 */

define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_USER', getenv('DB_USER') ?: 'yatish_laundry_user');
define('DB_PASS', getenv('DB_PASS') ?: 'YOUR_SECURE_PASSWORD');
define('DB_NAME', getenv('DB_NAME') ?: 'laundry_db');
