// setup_database.js
// Creates the tables this project needs and fills them with sample users.
// Safe to run more than once: it never deletes or overwrites existing rows.
//
// HOW TO RUN (from the backend folder, the one that contains index.js):
//   1. Make sure .env has a working DATABASE_URL
//   2. node setup_database.js

const bcrypt = require("bcrypt");
const { Pool } = require("pg");
require("dotenv").config();

const SALT_ROUNDS = 12; // same value index.js uses

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is missing. Add it to the .env file first.");
  process.exit(1);
}

// Cloud databases (Neon etc.) need SSL; a database on the same machine does not.
const isLocal = /@(localhost|127\.0\.0\.1)[:/]/.test(process.env.DATABASE_URL);
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

// [first name, last name, phone, gender, age, plain password]
const admins = [
  ["Aarav", "Malik", "9810000001", "male", 34, "secure_pass1"],
  ["Misha", "Patel", "9810000002", "female", 31, "secure_pass2"],
  ["Aditya", "Roy", "9810000003", "male", 38, "secure_pass3"],
  ["Saanvi", "Mehra", "9810000004", "female", 29, "secure_pass4"],
  ["Kabir", "Khan", "9810000005", "male", 41, "secure_pass5"],
];

// [first name, last name, phone, gender, age, department, role, plain password]
const employees = [
  ["Ria", "Jain", "9820000001", "female", 24, "Computer Science", "Teaching Assistant", "emp_pass1"],
  ["Vivan", "Ghosh", "9820000002", "male", 27, "Computer Science", "Lab Instructor", "emp_pass2"],
  ["Khushi", "Mehta", "9820000003", "female", 26, "Admissions", "Admissions Officer", "emp_pass3"],
  ["Zayd", "Ali", "9820000004", "male", 30, "IT Services", "System Administrator", "emp_pass4"],
  ["Anvi", "Verma", "9820000005", "female", 25, "Library", "Assistant Librarian", "emp_pass5"],
  ["Yug", "Sharma", "9820000006", "male", 28, "Finance", "Accounts Executive", "emp_pass6"],
  ["Ishaan", "Seth", "9820000007", "male", 32, "Electronics", "Assistant Professor", "emp_pass7"],
  ["Sana", "Chauhan", "9820000008", "female", 29, "Human Resources", "HR Executive", "emp_pass8"],
  ["Manav", "Kapoor", "9820000009", "male", 35, "Mechanical", "Associate Professor", "emp_pass9"],
  ["Ananya", "Singh", "9820000010", "female", 27, "Computer Science", "Assistant Professor", "emp_pass10"],
  ["Rudra", "Rathi", "9820000011", "male", 26, "IT Services", "Network Engineer", "emp_pass11"],
  ["Kriti", "Joshi", "9820000012", "female", 31, "Examinations", "Exam Coordinator", "emp_pass12"],
  ["Arjun", "Saxena", "9820000013", "male", 33, "Placements", "Placement Officer", "emp_pass13"],
  ["Tanisha", "Kamal", "9820000014", "female", 24, "Admissions", "Counsellor", "emp_pass14"],
  ["Dev", "Sawhney", "9820000015", "male", 29, "Finance", "Accounts Officer", "emp_pass15"],
  ["Parina", "Thakur", "9820000016", "female", 28, "Library", "Librarian", "emp_pass16"],
  ["Vihaan", "Tripathi", "9820000017", "male", 36, "Electronics", "Associate Professor", "emp_pass17"],
  ["Navya", "Shah", "9820000018", "female", 26, "Human Resources", "Recruiter", "emp_pass18"],
  ["Ronit", "Gill", "9820000019", "male", 30, "Mechanical", "Lab Instructor", "emp_pass19"],
  ["Diya", "Arora", "9820000020", "female", 25, "Placements", "Training Coordinator", "emp_pass20"],
];

const usernameOf = (first, last) => `${first}${last}`.toLowerCase();
const emailOf = (first, last) => `${first}.${last}@company.com`.toLowerCase();
const picOf = (username) => `https://picsum.photos/seed/${username}/100`;

async function main() {
  console.log("🔌 Connecting to the database...");
  await pool.query("SELECT 1");
  console.log("✅ Connected");

  console.log("🏗️  Creating tables (skipped if they already exist)...");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admins (
      admin_id        SERIAL PRIMARY KEY,
      username        VARCHAR(50)  NOT NULL UNIQUE,
      first_name      VARCHAR(50)  NOT NULL,
      last_name       VARCHAR(50)  NOT NULL,
      email_id        VARCHAR(100) NOT NULL UNIQUE,
      phone_number    VARCHAR(20),
      password        TEXT         NOT NULL,
      gender          VARCHAR(30),
      age             INTEGER,
      profile_pic_url TEXT,
      created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS employees (
      employee_id     SERIAL PRIMARY KEY,
      username        VARCHAR(50)  NOT NULL UNIQUE,
      first_name      VARCHAR(50)  NOT NULL,
      last_name       VARCHAR(50)  NOT NULL,
      email_id        VARCHAR(100) NOT NULL UNIQUE,
      phone_number    VARCHAR(20),
      password        TEXT         NOT NULL,
      gender          VARCHAR(30),
      age             INTEGER,
      department      VARCHAR(100) DEFAULT 'General',
      role            VARCHAR(100) DEFAULT 'New Employee',
      profile_pic_url TEXT,
      created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log("👤 Adding sample admins...");
  let added = 0;
  for (const [first, last, phone, gender, age, plain] of admins) {
    const username = usernameOf(first, last);
    const result = await pool.query(
      `INSERT INTO admins (username, first_name, last_name, email_id, phone_number, password, gender, age, profile_pic_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT DO NOTHING`,
      [username, first, last, emailOf(first, last), phone, await bcrypt.hash(plain, SALT_ROUNDS), gender, age, picOf(username)]
    );
    added += result.rowCount;
  }
  console.log(`   ${added} added, ${admins.length - added} already there`);

  console.log("👥 Adding sample employees...");
  added = 0;
  for (const [first, last, phone, gender, age, department, role, plain] of employees) {
    const username = usernameOf(first, last);
    const result = await pool.query(
      `INSERT INTO employees (username, first_name, last_name, email_id, phone_number, password, gender, age, department, role, profile_pic_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT DO NOTHING`,
      [username, first, last, emailOf(first, last), phone, await bcrypt.hash(plain, SALT_ROUNDS), gender, age, department, role, picOf(username)]
    );
    added += result.rowCount;
  }
  console.log(`   ${added} added, ${employees.length - added} already there`);

  const a = await pool.query("SELECT COUNT(*) FROM admins");
  const e = await pool.query("SELECT COUNT(*) FROM employees");
  console.log(`\n🎉 Done. The database now has ${a.rows[0].count} admins and ${e.rows[0].count} employees.`);
  console.log("\n📋 Test logins:");
  console.log("   Admin:    aarav.malik@company.com / secure_pass1");
  console.log("   Employee: ria.jain@company.com   / emp_pass1");
}

main()
  .catch((error) => {
    console.error("\n❌ Setup failed:", error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
