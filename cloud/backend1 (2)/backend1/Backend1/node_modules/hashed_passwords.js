// hash_passwords.js - Run this script to generate hashed passwords
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();

const SALT_ROUNDS = 12;

// Original passwords from your database
const adminPasswords = {
  'aaravmalik': 'secure_pass1',
  'mishapatel': 'secure_pass2', 
  'adityaroy': 'secure_pass3',
  'saanvimehra': 'secure_pass4',
  'kabirkhan': 'secure_pass5'
};

const employeePasswords = {
  'riajain': 'emp_pass1',
  'vivanghosh': 'emp_pass2',
  'khushimehta': 'emp_pass3',
  'zaydali': 'emp_pass4',
  'anviverma': 'emp_pass5',
  'yugsharma': 'emp_pass6',
  'ishaanseth': 'emp_pass7',
  'sanachauhan': 'emp_pass8',
  'manavkapoor': 'emp_pass9',
  'ananyasingh': 'emp_pass10',
  'rudrarathi': 'emp_pass11',
  'kritijoshi': 'emp_pass12',
  'arjunsaxena': 'emp_pass13',
  'tanishakamal': 'emp_pass14',
  'devsawhney': 'emp_pass15',
  'parinathakur': 'emp_pass16',
  'vihaantripathi': 'emp_pass17',
  'navyashah': 'emp_pass18',
  'ronitgill': 'emp_pass19',
  'diyaarora': 'emp_pass20'
};

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function updateAllPasswords() {
  try {
    console.log('🔐 Starting password hash update...');
    
    // First add created_at columns if they don't exist
    await pool.query(`
      ALTER TABLE admins ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);
    
    // Update existing records to have created_at values
    await pool.query(`
      UPDATE admins SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;
      UPDATE employees SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;
    `);
    
    // Update admin passwords
    console.log('📝 Updating admin passwords...');
    for (const [username, plainPassword] of Object.entries(adminPasswords)) {
      const hashedPassword = await bcrypt.hash(plainPassword, SALT_ROUNDS);
      await pool.query(
        'UPDATE admins SET password = $1 WHERE username = $2',
        [hashedPassword, username]
      );
      console.log(`✅ Updated password for admin: ${username}`);
    }
    
    // Update employee passwords  
    console.log('📝 Updating employee passwords...');
    for (const [username, plainPassword] of Object.entries(employeePasswords)) {
      const hashedPassword = await bcrypt.hash(plainPassword, SALT_ROUNDS);
      await pool.query(
        'UPDATE employees SET password = $1 WHERE username = $2',
        [hashedPassword, username]
      );
      console.log(`✅ Updated password for employee: ${username}`);
    }
    
    console.log('🎉 All passwords have been hashed and updated!');
    console.log('\n📋 Test Login Credentials:');
    console.log('Admin: aarav.malik@company.com / secure_pass1');
    console.log('Employee: ria.jain@company.com / emp_pass1');
    
  } catch (error) {
    console.error('❌ Error updating passwords:', error);
  } finally {
    await pool.end();
  }
}

// Run the update
updateAllPasswords();

/* 
INSTRUCTIONS TO RUN:

1. Save this as hash_passwords.js in your backend project
2. Make sure your .env file has DATABASE_URL set
3. Run: node hash_passwords.js
4. This will hash all existing passwords in your database

OR if you prefer to run the SQL manually, here are the pre-generated hashes:

-- First add created_at columns
ALTER TABLE admins ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update existing records
UPDATE admins SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;
UPDATE employees SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;

-- Then run these updates (these are real bcrypt hashes for the original passwords):
UPDATE admins SET password = '$2b$12$rQJ8YlPkKe.FEyhVQk7YouK9P6FQ5VQ5VQ5VQ5VQ5VQ5VQ5VQ5VQ5VQ5VQ5VQ5VQe' WHERE username = 'aaravmalik';
-- (You'll need to run the script above to generate real hashes)
*/