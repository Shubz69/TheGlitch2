-- Query to find admin account in the database
-- Run this in MySQL Workbench or your MySQL client

-- IMPORTANT: First, select the database
USE trading_platform;

-- Find all admin users (with password hash - passwords are hashed for security)
SELECT id, username, email, name, role, password, created_at 
FROM users 
WHERE role = 'ADMIN' OR role = 'admin';

-- If you want to see all users (to identify admin by email)
-- Note: password column will show hashed values, not plain text
SELECT id, username, email, name, role, password, created_at 
FROM users 
ORDER BY created_at ASC;

-- Check if admin account exists (count)
SELECT COUNT(*) as admin_count 
FROM users 
WHERE role = 'ADMIN' OR role = 'admin';

-- IMPORTANT NOTE:
-- Passwords are stored as bcrypt hashes (e.g., $2b$10$...)
-- You CANNOT see the original password - it's encrypted for security
-- To reset the password, use the "Forgot Password" feature on the website
-- OR manually update the password hash in the database (not recommended)

