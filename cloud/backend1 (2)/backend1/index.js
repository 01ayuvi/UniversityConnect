const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = 12; // Higher salt rounds for better security

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

// PostgreSQL connection
// Cloud databases (Neon etc.) need SSL; a database on the same machine does not.
const isLocalDb = /@(localhost|127\.0\.0\.1)[:/]/.test(process.env.DATABASE_URL || "");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocalDb ? false : { rejectUnauthorized: false },
});

// Verify DB connection
pool.connect((err, client, release) => {
  if (err) {
    console.error("❌ Database connection error:", err);
  } else {
    console.log("✅ Connected to Neon PostgreSQL database");
    release();
  }
});

// JWT Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res
        .status(403)
        .json({ success: false, message: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
}

// Admin Authorization Middleware
function requireAdmin(req, res, next) {
  if (req.user.type !== 'admin') {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin privileges required."
    });
  }
  next();
}

// Helper: Generate JWT
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
}

// Helper: Hash password
async function hashPassword(password) {
  try {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    return hashedPassword;
  } catch (error) {
    console.error("❌ Password hashing error:", error);
    throw new Error("Error hashing password");
  }
}

// Helper: Compare password
async function comparePassword(plainPassword, hashedPassword) {
  try {
    const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
    return isMatch;
  } catch (error) {
    console.error("❌ Password comparison error:", error);
    throw new Error("Error comparing password");
  }
}

// Helper: Form fields left blank arrive as "" - treat them as missing
function blankToNull(value) {
  return value === '' || value === undefined ? null : value;
}

// Helper: Format user data consistently
function formatUserData(user, userType) {
  const baseData = {
    id: user.id || user.admin_id || user.employee_id,
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    email_id: user.email_id || '',
    username: user.username || '',
    phone_number: user.phone_number || 'Not specified',
    gender: user.gender || 'Not specified',
    age: user.age ? `${user.age} years` : 'Not specified',
    profile_pic_url: user.profile_pic_url || `https://picsum.photos/seed/${user.username || 'default'}/100`,
    user_type: userType
  };

  // Add employee-specific fields
  if (userType === 'employee') {
    baseData.department = user.department || 'Not specified';
    baseData.role = user.role || 'Not specified';
  }

  return baseData;
}

// Root Route
app.get("/", (req, res) => {
  res.json({
    message: "🌐 Authentication API Server",
    status: "running",
    timestamp: new Date().toISOString(),
  });
});

// ======================== AUTH ROUTES ========================

// Signup Route
app.post("/api/auth/signup", async (req, res) => {
  const {
    email,
    username,
    firstName,
    lastName,
    password,
    phoneNumber = '',
    gender = ''
  } = req.body;
  // Public signup always creates an employee; any userType in the request is ignored.
  // Admins can only be created by an existing admin through POST /api/users.

  // Form fields left blank arrive as "" - treat them as missing.
  // The signup form sends "jobRole", so accept it as "role".
  const age = blankToNull(req.body.age);
  const department = blankToNull(req.body.department) ?? 'General';
  const role = blankToNull(req.body.role) ?? blankToNull(req.body.jobRole) ?? 'New Employee';

  console.log("📝 Signup attempt for:", email);

  // Validation
  if (!email || !username || !firstName || !lastName || !password) {
    return res.status(400).json({
      success: false,
      message: "Required fields: email, username, firstName, lastName, password",
    });
  }

  // Password strength validation
  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 8 characters long",
    });
  }

  try {
    // Check if user already exists in either table
    const existingUserCheck = await pool.query(
      `SELECT email_id, 'admin' as type FROM admins WHERE email_id = $1 OR username = $2
       UNION
       SELECT email_id, 'employee' as type FROM employees WHERE email_id = $1 OR username = $2`,
      [email, username]
    );

    if (existingUserCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "User with this email or username already exists",
      });
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    await pool.query(
      `INSERT INTO employees (username, first_name, last_name, email_id, phone_number, password, gender, age, department, role, profile_pic_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        username,
        firstName,
        lastName,
        email,
        phoneNumber,
        hashedPassword,
        gender,
        age,
        department,
        role,
        `https://picsum.photos/seed/${username}/100`
      ]
    );

    console.log("✅ Signup successful for:", email);

    // Don't return user data or token after signup - force them to login
    res.status(201).json({
      success: true,
      message: "Account created successfully! Please login with your credentials.",
      redirectTo: "/login" // Frontend can use this to redirect
    });

  } catch (error) {
    console.error("❌ Signup error:", error);
    
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: "User with this email or username already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error during signup",
    });
  }
});

// Login Route
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  console.log("🔐 Login attempt for:", email);

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }

  try {
    // Check admins table
    let result = await pool.query(
      `SELECT admin_id as id, username, first_name, last_name, email_id, phone_number, 
              gender, age, profile_pic_url, password, 'admin' as user_type 
       FROM admins WHERE email_id = $1`,
      [email]
    );

    let userType = 'admin';

    // If not found in admins, check employees
    if (result.rows.length === 0) {
      result = await pool.query(
        `SELECT employee_id as id, username, first_name, last_name, email_id, phone_number, 
                gender, age, department, role, profile_pic_url, password, 'employee' as user_type 
         FROM employees WHERE email_id = $1`,
        [email]
      );
      userType = 'employee';
    }

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const user = result.rows[0];

    // Compare the provided password with the hashed password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const userData = formatUserData(user, userType);
    delete userData.password; // Remove password from response

    const token = generateToken({
      id: user.id,
      email: user.email_id,
      type: userType,
    });

    console.log("✅ Login successful for:", email);

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: userData,
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
});

// Profile Route (Get own profile)
app.get("/api/auth/profile", authenticateToken, async (req, res) => {
  try {
    const { id, type } = req.user;
    console.log("📖 Profile fetch for user:", id, "type:", type);
    
    let result;

    if (type === "admin") {
      result = await pool.query(
        `SELECT admin_id as id, username, first_name, last_name, email_id, phone_number, 
                gender, age, profile_pic_url 
         FROM admins WHERE admin_id = $1`,
        [id]
      );
    } else {
      result = await pool.query(
        `SELECT employee_id as id, username, first_name, last_name, email_id, phone_number, 
                gender, age, department, role, profile_pic_url 
         FROM employees WHERE employee_id = $1`,
        [id]
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const userData = formatUserData(result.rows[0], type);
    console.log("✅ Profile data fetched:", userData);

    res.json({
      success: true,
      user: userData,
    });
  } catch (error) {
    console.error("❌ Profile fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching profile",
    });
  }
});

// Update Profile Route (Self)
app.put("/api/auth/profile", authenticateToken, async (req, res) => {
  try {
    const { id, type } = req.user;
    const { 
      firstName, 
      lastName, 
      phoneNumber, 
      gender, 
      age,
      department,
      role 
    } = req.body;

    console.log("📝 Profile update for user:", id, "type:", type);
    console.log("📝 Update data:", req.body);

    let result;

    if (type === "admin") {
      result = await pool.query(
        `UPDATE admins 
         SET first_name = COALESCE($1, first_name),
             last_name = COALESCE($2, last_name),
             phone_number = COALESCE($3, phone_number),
             gender = COALESCE($4, gender),
             age = COALESCE($5, age)
         WHERE admin_id = $6
         RETURNING admin_id as id, username, first_name, last_name, email_id, phone_number, gender, age, profile_pic_url`,
        [firstName, lastName, phoneNumber, gender, age, id]
      );
    } else {
      result = await pool.query(
        `UPDATE employees 
         SET first_name = COALESCE($1, first_name),
             last_name = COALESCE($2, last_name),
             phone_number = COALESCE($3, phone_number),
             gender = COALESCE($4, gender),
             age = COALESCE($5, age),
             department = COALESCE($6, department),
             role = COALESCE($7, role)
         WHERE employee_id = $8
         RETURNING employee_id as id, username, first_name, last_name, email_id, phone_number, gender, age, department, role, profile_pic_url`,
        [firstName, lastName, phoneNumber, gender, age, department, role, id]
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const userData = formatUserData(result.rows[0], type);

    console.log("✅ Profile updated successfully for:", id);

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: userData,
    });
  } catch (error) {
    console.error("❌ Profile update error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating profile",
    });
  }
});

// Logout Route
app.post("/api/auth/logout", authenticateToken, (req, res) => {
  console.log("👋 User logged out:", req.user.email);
  res.json({
    success: true,
    message: "Logged out successfully",
  });
});

// Change Password Route
app.put("/api/auth/change-password", authenticateToken, async (req, res) => {
  try {
    const { id, type } = req.user;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required"
      });
    }

    // Password strength validation for new password
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters long"
      });
    }

    // First verify current password
    let result;
    if (type === "admin") {
      result = await pool.query(
        `SELECT password FROM admins WHERE admin_id = $1`,
        [id]
      );
    } else {
      result = await pool.query(
        `SELECT password FROM employees WHERE employee_id = $1`,
        [id]
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Verify current password using bcrypt
    const isCurrentPasswordValid = await comparePassword(currentPassword, result.rows[0].password);

    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect"
      });
    }

    // Hash the new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password
    if (type === "admin") {
      await pool.query(
        `UPDATE admins SET password = $1 WHERE admin_id = $2`,
        [hashedNewPassword, id]
      );
    } else {
      await pool.query(
        `UPDATE employees SET password = $1 WHERE employee_id = $2`,
        [hashedNewPassword, id]
      );
    }

    console.log("✅ Password changed for user:", id);

    res.json({
      success: true,
      message: "Password changed successfully"
    });
  } catch (error) {
    console.error("❌ Password change error:", error);
    res.status(500).json({
      success: false,
      message: "Server error changing password"
    });
  }
});

// ======================== ADMIN CRUD ROUTES ========================

// Get all users (Admin only)
app.get("/api/users", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', userType = '' } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = '';
    let queryParams = [limit, offset];
    let paramCount = 2;

    if (search) {
      whereClause += ` AND (first_name ILIKE $${++paramCount} OR last_name ILIKE $${paramCount} OR email_id ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    let query;
    if (userType === 'admin') {
      query = `
        SELECT admin_id as id, username, first_name, last_name, email_id, phone_number, 
               gender, age, profile_pic_url, 'admin' as user_type
        FROM admins 
        WHERE 1=1 ${whereClause}
        ORDER BY first_name, last_name
        LIMIT $1 OFFSET $2
      `;
    } else if (userType === 'employee') {
      query = `
        SELECT employee_id as id, username, first_name, last_name, email_id, phone_number, 
               gender, age, department, role, profile_pic_url, 'employee' as user_type
        FROM employees 
        WHERE 1=1 ${whereClause}
        ORDER BY first_name, last_name
        LIMIT $1 OFFSET $2
      `;
    } else {
      // Both halves of a UNION must have the same columns, so admins get NULL department/role
      query = `
        SELECT admin_id as id, username, first_name, last_name, email_id, phone_number,
               gender, age, NULL as department, NULL as role, profile_pic_url, 'admin' as user_type
        FROM admins
        WHERE 1=1 ${whereClause}
        UNION ALL
        SELECT employee_id as id, username, first_name, last_name, email_id, phone_number, 
               gender, age, department, role, profile_pic_url, 'employee' as user_type
        FROM employees 
        WHERE 1=1 ${whereClause}
        ORDER BY first_name, last_name
        LIMIT $1 OFFSET $2
      `;
    }

    const result = await pool.query(query, queryParams);
    
    // Get total count for pagination
    let countQuery;
    let countParams = [];
    let countParamIndex = 0;

    if (search) {
      countParams.push(`%${search}%`);
      countParamIndex = 1;
    }

    if (userType === 'admin') {
      countQuery = `SELECT COUNT(*) FROM admins WHERE 1=1 ${search ? `AND (first_name ILIKE $${countParamIndex} OR last_name ILIKE $${countParamIndex} OR email_id ILIKE $${countParamIndex})` : ''}`;
    } else if (userType === 'employee') {
      countQuery = `SELECT COUNT(*) FROM employees WHERE 1=1 ${search ? `AND (first_name ILIKE $${countParamIndex} OR last_name ILIKE $${countParamIndex} OR email_id ILIKE $${countParamIndex})` : ''}`;
    } else {
      countQuery = `
        SELECT (
          (SELECT COUNT(*) FROM admins WHERE 1=1 ${search ? `AND (first_name ILIKE $${countParamIndex} OR last_name ILIKE $${countParamIndex} OR email_id ILIKE $${countParamIndex})` : ''}) +
          (SELECT COUNT(*) FROM employees WHERE 1=1 ${search ? `AND (first_name ILIKE $${countParamIndex} OR last_name ILIKE $${countParamIndex} OR email_id ILIKE $${countParamIndex})` : ''})
        ) as count
      `;
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalUsers = parseInt(countResult.rows[0].count);

    const formattedUsers = result.rows.map(user => formatUserData(user, user.user_type));

    res.json({
      success: true,
      data: formattedUsers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
        hasNextPage: page * limit < totalUsers,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error("❌ Get users error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching users",
    });
  }
});

// Get user by ID (Admin only)
app.get("/api/users/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query; // 'admin' or 'employee'

    if (!type) {
      return res.status(400).json({
        success: false,
        message: "User type parameter is required"
      });
    }

    let result;

    if (type === 'admin') {
      result = await pool.query(
        `SELECT admin_id as id, username, first_name, last_name, email_id, phone_number, 
                gender, age, profile_pic_url
         FROM admins WHERE admin_id = $1`,
        [id]
      );
    } else {
      result = await pool.query(
        `SELECT employee_id as id, username, first_name, last_name, email_id, phone_number, 
                gender, age, department, role, profile_pic_url
         FROM employees WHERE employee_id = $1`,
        [id]
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const userData = formatUserData(result.rows[0], type);

    res.json({
      success: true,
      user: userData,
    });
  } catch (error) {
    console.error("❌ Get user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching user",
    });
  }
});

// Update user by ID (Admin only)
app.put("/api/users/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query;
    const updateData = req.body;

    if (!type) {
      return res.status(400).json({
        success: false,
        message: "User type parameter is required"
      });
    }

    let result;

    if (type === 'admin') {
      const { firstName, lastName, phoneNumber, gender, age } = updateData;
      result = await pool.query(
        `UPDATE admins 
         SET first_name = COALESCE($1, first_name),
             last_name = COALESCE($2, last_name),
             phone_number = COALESCE($3, phone_number),
             gender = COALESCE($4, gender),
             age = COALESCE($5, age)
         WHERE admin_id = $6
         RETURNING admin_id as id, username, first_name, last_name, email_id, phone_number, gender, age, profile_pic_url`,
        [firstName, lastName, phoneNumber, gender, age, id]
      );
    } else {
      const { firstName, lastName, phoneNumber, gender, age, department, role } = updateData;
      result = await pool.query(
        `UPDATE employees 
         SET first_name = COALESCE($1, first_name),
             last_name = COALESCE($2, last_name),
             phone_number = COALESCE($3, phone_number),
             gender = COALESCE($4, gender),
             age = COALESCE($5, age),
             department = COALESCE($6, department),
             role = COALESCE($7, role)
         WHERE employee_id = $8
         RETURNING employee_id as id, username, first_name, last_name, email_id, phone_number, gender, age, department, role, profile_pic_url`,
        [firstName, lastName, phoneNumber, gender, age, department, role, id]
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const userData = formatUserData(result.rows[0], type);

    res.json({
      success: true,
      message: "User updated successfully",
      user: userData,
    });
  } catch (error) {
    console.error("❌ Update user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating user",
    });
  }
});

// Delete user by ID (Admin only)
app.delete("/api/users/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query;

    if (!type) {
      return res.status(400).json({
        success: false,
        message: "User type parameter is required"
      });
    }

    // Prevent admin from deleting themselves
    if (type === 'admin' && req.user.id == id) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete your own admin account"
      });
    }

    let result;

    if (type === 'admin') {
      result = await pool.query(
        `DELETE FROM admins WHERE admin_id = $1 RETURNING admin_id`,
        [id]
      );
    } else {
      result = await pool.query(
        `DELETE FROM employees WHERE employee_id = $1 RETURNING employee_id`,
        [id]
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`,
    });
  } catch (error) {
    console.error("❌ Delete user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error deleting user",
    });
  }
});

// Create new user (Admin only)
app.post("/api/users", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { 
      email, 
      username, 
      firstName, 
      lastName, 
      password, 
      phoneNumber = '',
      gender = '',
      userType = 'employee'
    } = req.body;

    // Treat blank fields as missing (age "" would break the INTEGER column)
    const age = blankToNull(req.body.age);
    const department = blankToNull(req.body.department) ?? 'General';
    const role = blankToNull(req.body.role) ?? 'New Employee';

    // Validation
    if (!email || !username || !firstName || !lastName || !password) {
      return res.status(400).json({
        success: false,
        message: "Required fields: email, username, firstName, lastName, password",
      });
    }

    // Password strength validation
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    // Check if user already exists
    const existingUserCheck = await pool.query(
      `SELECT email_id FROM admins WHERE email_id = $1 OR username = $2
       UNION
       SELECT email_id FROM employees WHERE email_id = $1 OR username = $2`,
      [email, username]
    );

    if (existingUserCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "User with this email or username already exists",
      });
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    let result;

    if (userType === 'admin') {
      result = await pool.query(
        `INSERT INTO admins (username, first_name, last_name, email_id, phone_number, password, gender, age, profile_pic_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING admin_id as id, username, first_name, last_name, email_id, phone_number, gender, age, profile_pic_url`,
        [username, firstName, lastName, email, phoneNumber, hashedPassword, gender, age, `https://picsum.photos/seed/${username}/100`]
      );
    } else {
      result = await pool.query(
        `INSERT INTO employees (username, first_name, last_name, email_id, phone_number, password, gender, age, department, role, profile_pic_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING employee_id as id, username, first_name, last_name, email_id, phone_number, gender, age, department, role, profile_pic_url`,
        [username, firstName, lastName, email, phoneNumber, hashedPassword, gender, age, department, role, `https://picsum.photos/seed/${username}/100`]
      );
    }

    const userData = formatUserData(result.rows[0], userType);

    res.status(201).json({
      success: true,
      message: `${userType.charAt(0).toUpperCase() + userType.slice(1)} created successfully`,
      user: userData,
    });
  } catch (error) {
    console.error("❌ Create user error:", error);
    
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: "User with this email or username already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error creating user",
    });
  }
});

// ======================== DASHBOARD STATS ========================

// Get dashboard statistics (Admin only)
app.get("/api/dashboard/stats", authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Get counts
    const adminCountResult = await pool.query("SELECT COUNT(*) FROM admins");
    const employeeCountResult = await pool.query("SELECT COUNT(*) FROM employees");
    
    // Get recent registrations (last 30 days)
    const recentAdminsResult = await pool.query(`
      SELECT COUNT(*) FROM admins 
      WHERE created_at >= NOW() - INTERVAL '30 days'
    `);
    
    const recentEmployeesResult = await pool.query(`
      SELECT COUNT(*) FROM employees 
      WHERE created_at >= NOW() - INTERVAL '30 days'
    `);

    // Get department-wise employee count
    const departmentStatsResult = await pool.query(`
      SELECT department, COUNT(*) as count 
      FROM employees 
      GROUP BY department 
      ORDER BY count DESC
    `);

    const stats = {
      totalAdmins: parseInt(adminCountResult.rows[0].count),
      totalEmployees: parseInt(employeeCountResult.rows[0].count),
      totalUsers: parseInt(adminCountResult.rows[0].count) + parseInt(employeeCountResult.rows[0].count),
      recentAdmins: parseInt(recentAdminsResult.rows[0].count),
      recentEmployees: parseInt(recentEmployeesResult.rows[0].count),
      departmentStats: departmentStatsResult.rows
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error("❌ Dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching dashboard statistics",
    });
  }
});

// ======================== ERROR HANDLERS ========================

// 404 Handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("❌ Unhandled error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

// ======================== SERVER START ========================

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
});