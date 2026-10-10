# Backend security update: deploy on cPanel

This update adds login tokens. Students now only receive their own data, and only staff can change orders. It also fixes password reset (email code), account deletion, and admin self-registration.

The API lives in `public_html/api/` (the app calls `https://rvsu.ac.in/api/index.php`). Do the steps **in this order**; step 2 must happen before step 3 or the API goes down.

## Step 1: Change the database password (urgent)

The old password was written in `db.php`, which is public on GitHub, so treat it as known to everyone.

1. cPanel → **MySQL® Databases** → *Current Users* → `ommx7iasogql_yatish_laundry_user` → **Change Password**.
2. Generate a strong password and copy it. You need it in step 2.

The live API stops working between this step and step 3. Do steps 1–3 together (about 5 minutes), ideally when the laundry is closed.

## Step 2: Create `config.php` on the server

1. cPanel → **File Manager** → `public_html/api/`.
2. **+ File** → name it `config.php` → right-click → **Edit**, and paste:

```php
<?php
define('DB_HOST', 'localhost');
define('DB_USER', 'ommx7iasogql_yatish_laundry_user');
define('DB_PASS', 'PASTE-THE-NEW-PASSWORD-HERE');
define('DB_NAME', 'ommx7iasogql_laundry_db');

define('MAIL_FROM', 'no-reply@rvsu.ac.in');

// Keep true until every student has the new app (see step 6)
define('ALLOW_LEGACY_CLIENTS', true);
```

3. Check the user and database names match what cPanel → MySQL® Databases shows, then **Save**.

`config.php` is never uploaded to GitHub (it is in `.gitignore`).

## Step 3: Upload the new files

Upload these from `src/backend/` into `public_html/api/`, replacing the old ones:

| File | What changed |
|---|---|
| `index.php` | Token checks on every action, students see only their own data, email-code password reset, real account deletion, generic error messages |
| `auth.php` | **New.** Login token and access-control helpers |
| `db.php` | No password in the code any more; reads `config.php` |
| `.htaccess` | Allows the new `X-Auth-Token` header; blocks direct access to `config.php`, `auth.php`, `db.php` |

Do **not** upload `config.sample.php` or this guide; they are only for reference.

## Step 4: Database changes

Two new tables. Either:

- **Easiest:** open this once in a browser: `https://rvsu.ac.in/api/index.php?action=init_schema`. It should say *"Database schema initialized successfully"*. (It only creates missing tables; it never deletes data.)
- **Or** cPanel → **phpMyAdmin** → select `ommx7iasogql_laundry_db` → **SQL** tab → run:

```sql
CREATE TABLE IF NOT EXISTS laundry_sessions (
    token_hash CHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    INDEX idx_session_user (user_id),
    INDEX idx_session_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS laundry_password_resets (
    email VARCHAR(100) PRIMARY KEY,
    code_hash CHAR(64) NOT NULL,
    attempts INT DEFAULT 0,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

If this step is forgotten, the server creates the tables itself on the first login.

## Step 5: Check it works

1. Open `https://rvsu.ac.in/api/config.php` in a browser. It must show **403 Forbidden**.
2. Sign in on the **current** Android app as a student. History should load as before (compatibility mode).
3. **Password-reset email:** cPanel → **Email Accounts** → create `no-reply@rvsu.ac.in` (or change `MAIL_FROM` to an existing mailbox on the domain). In the new app tap *Forgot Password → Send Code* and check that the email arrives. Look in spam the first time.

## Step 6: Switch off the old, open behaviour

While `ALLOW_LEGACY_CLIENTS` is `true`, requests **without** a token still behave the old way so the current Android app keeps working. **The data leak stays open until this is turned off.**

1. Publish the new Android build (version 1.0.5, versionCode 7) on Play Store, and the iOS app.
2. Once most students have updated (Play Console → Statistics shows install versions; give it about a week), edit `config.php` and set:

```php
define('ALLOW_LEGACY_CLIENTS', false);
```

From then on, every request needs a login token. Anyone still on an old app version is asked to update when they reset a password, and their data requests are refused.

## Staff and admin accounts

The app no longer lets anyone register as admin. To make someone staff or admin, set their role in phpMyAdmin:

```sql
UPDATE laundry_users SET role = 'staff' WHERE email = 'their-email@example.com';
```

(Use `'admin'` instead of `'staff'` for full admin.)
