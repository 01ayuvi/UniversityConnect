import React, { useState, useEffect } from "react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const EditProfileModal = ({ user, isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    gender: '',
    age: '',
    department: '',
    role: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Initialize form data when modal opens or user changes
  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        phoneNumber: user.phone_number === 'Not specified' ? '' : user.phone_number || '',
        gender: user.gender === 'Not specified' ? '' : user.gender || '',
        age: user.age && user.age !== 'Not specified years' ? user.age.replace(' years', '') : '',
        department: user.department === 'Not specified' ? '' : user.department || '',
        role: user.role === 'Not specified' ? '' : user.role || ''
      });
      setError('');
      setSuccess('');
    }
  }, [isOpen, user]);

  // Get auth token
  const getAuthToken = () => {
    return user?.token || window.authToken || null;
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      // Prepare the data to send
      const updateData = {
        firstName: formData.firstName || null,
        lastName: formData.lastName || null,
        phoneNumber: formData.phoneNumber || null,
        gender: formData.gender || null,
        age: formData.age ? parseInt(formData.age) : null
      };

      // Add employee-specific fields if user is an employee
      if (user.user_type === 'employee') {
        updateData.department = formData.department || null;
        updateData.role = formData.role || null;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      setSuccess('Profile updated successfully!');
      
      // Call success callback with updated user data
      if (onSuccess) {
        onSuccess(data.user);
      }

      // Close modal after a brief delay to show success message
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (error) {
      console.error('Profile update error:', error);
      setError(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>Edit Profile</h2>
          <button 
            style={styles.closeButton} 
            onClick={handleClose}
            disabled={loading}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGrid}>
            {/* Basic Information */}
            <div style={styles.formSection}>
              <h3 style={styles.sectionTitle}>Basic Information</h3>
              
              <div style={styles.inputGroup}>
                <label style={styles.label}>First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  style={styles.input}
                  required
                  disabled={loading}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  style={styles.input}
                  required
                  disabled={loading}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Phone Number</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  style={styles.input}
                  placeholder="Enter your phone number"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Personal Details */}
            <div style={styles.formSection}>
              <h3 style={styles.sectionTitle}>Personal Details</h3>
              
              <div style={styles.inputRow}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    style={styles.select}
                    disabled={loading}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Age</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    style={styles.input}
                    min="18"
                    max="100"
                    placeholder="Age"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Employee-specific fields */}
            {user?.user_type === 'employee' && (
              <div style={styles.formSection}>
                <h3 style={styles.sectionTitle}>Work Information</h3>
                
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Department</label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    style={styles.select}
                    disabled={loading}
                  >
                    <option value="">Select Department</option>
                    <option value="General">General</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Finance">Finance</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Operations">Operations</option>
                    <option value="Sales">Sales</option>
                    <option value="Customer Service">Customer Service</option>
                    <option value="Research & Development">Research & Development</option>
                  </select>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Job Role</label>
                  <input
                    type="text"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    style={styles.input}
                    placeholder="Enter your job role"
                    disabled={loading}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Error and Success Messages */}
          {error && (
            <div style={styles.errorMessage}>
              <span style={styles.errorIcon}>⚠️</span>
              {error}
            </div>
          )}

          {success && (
            <div style={styles.successMessage}>
              <span style={styles.successIcon}>✅</span>
              {success}
            </div>
          )}

          {/* Form Actions */}
          <div style={styles.formActions}>
            <button
              type="button"
              onClick={handleClose}
              style={styles.cancelButton}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                ...styles.submitButton,
                ...(loading ? styles.submitButtonLoading : {})
              }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span style={styles.spinner}></span>
                  Updating...
                </>
              ) : (
                'Update Profile'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Enhanced Dashboard Component with Edit Profile Modal
export default function Dashboard({ user, onLogout }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    loginCount: 0,
    daysActive: 0,
    lastLogin: "Today",
    accountAge: "0Y",
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Get auth token from state instead of localStorage
  const getAuthToken = () => {
    return user?.token || window.authToken || null;
  };

  // Make authenticated API calls
  const makeAuthenticatedRequest = async (endpoint, options = {}) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "API request failed");
    }

    return data;
  };

  // Fetch user profile from backend
  const fetchUserProfile = async () => {
    try {
      const response = await makeAuthenticatedRequest("/api/auth/profile");
      return response.user;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      throw error;
    }
  };

  // Fetch dashboard data (for admins)
  const fetchDashboardData = async () => {
    try {
      // Backend returns { success, stats }
      const response = await makeAuthenticatedRequest("/api/dashboard/stats");
      return { stats: response.stats };
    } catch (error) {
      if (error.message.includes("Access denied")) {
        return null;
      }
      console.error("Error fetching dashboard data:", error);
      throw error;
    }
  };

  // Initialize dashboard data
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        let userData = user;
        
        if (!userData) {
          userData = await fetchUserProfile();
        }

        setCurrentUser(userData);

        if (userData && userData.user_type === "admin") {
          try {
            const dashData = await fetchDashboardData();
            setDashboardData(dashData);
          } catch (error) {
            console.warn("Could not fetch dashboard data:", error.message);
          }
        }

        setStats({
          loginCount: Math.floor(Math.random() * 100) + 20,
          daysActive: Math.floor(Math.random() * 300) + 50,
          lastLogin: "Today",
          accountAge: (Math.random() * 3 + 0.5).toFixed(1) + "Y",
        });
      } catch (error) {
        console.error("Dashboard initialization error:", error);
        setError(error.message || "Failed to load dashboard");

        if (
          error.message.includes("token") ||
          error.message.includes("authentication")
        ) {
          handleLogout();
        }
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();
  }, [user]);

  // Handle logout
  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to logout?")) {
      try {
        await makeAuthenticatedRequest("/api/auth/logout", {
          method: "POST",
        });
      } catch (error) {
        console.error("Logout API error:", error);
      }

      window.authToken = null;

      if (onLogout) {
        onLogout();
      } else {
        window.location.href = "/";
      }
    }
  };

  // Handle edit profile
  const handleEditProfile = () => {
    setEditModalOpen(true);
  };

  // Handle profile update success
  const handleProfileUpdateSuccess = (updatedUser) => {
    setCurrentUser(updatedUser);
    // Also update the user token if needed
    if (user && user.token) {
      updatedUser.token = user.token;
    }
  };

  const handleSettings = () => {
    alert("Settings functionality - would open settings modal or page");
  };

  const handleViewProfile = () => {
    alert("View Full Profile - would show detailed profile information");
  };

  // Loading state
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p style={styles.loadingText}>Loading your workspace...</p>
        <style>{keyframes}</style>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorCard}>
          <div style={styles.errorIcon}>⚠️</div>
          <h2 style={styles.errorTitle}>Something went wrong</h2>
          <p style={styles.errorMessage}>{error}</p>
          <div style={styles.errorActions}>
            <button style={styles.retryBtn} onClick={() => window.location.reload()}>
              Try Again
            </button>
            <button style={styles.logoutBtn} onClick={handleLogout}>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorCard}>
          <div style={styles.errorIcon}>🔐</div>
          <h2 style={styles.errorTitle}>Authentication Required</h2>
          <p style={styles.errorMessage}>Please sign in to access your dashboard.</p>
          <button style={styles.retryBtn} onClick={handleLogout}>
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
    ...(currentUser.user_type === "admin" ? [{ id: 'admin', label: 'Admin Panel', icon: '👑' }] : [])
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return <OverviewContent currentUser={currentUser} stats={stats} dashboardData={dashboardData} />;
      case 'profile':
        return <ProfileContent currentUser={currentUser} onEdit={handleEditProfile} onView={handleViewProfile} />;
      case 'analytics':
        return <AnalyticsContent stats={stats} />;
      case 'settings':
        return <SettingsContent onSettings={handleSettings} />;
      case 'admin':
        return <AdminContent dashboardData={dashboardData} currentUser={currentUser} />;
      default:
        return <OverviewContent currentUser={currentUser} stats={stats} dashboardData={dashboardData} />;
    }
  };

  return (
    <div style={styles.container}>
      <style>{keyframes}</style>
      
      {/* Sidebar */}
      <div style={{...styles.sidebar, ...(sidebarCollapsed ? styles.sidebarCollapsed : {})}}>
        <div style={styles.sidebarHeader}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>💎</span>
            {!sidebarCollapsed && <span style={styles.logoText}>Workspace</span>}
          </div>
          <button 
            style={styles.toggleBtn} 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        <nav style={styles.navigation}>
          {navigationItems.map((item) => (
            <button
              key={item.id}
              style={{
                ...styles.navItem,
                ...(activeSection === item.id ? styles.navItemActive : {})
              }}
              onClick={() => setActiveSection(item.id)}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              {!sidebarCollapsed && <span style={styles.navLabel}>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div style={styles.sidebarFooter}>
          <div style={styles.userPreview}>
            <img 
              style={styles.userAvatar}
              src={currentUser.profile_pic_url || "https://via.placeholder.com/40x40?text=U"}
              alt="Avatar"
              onError={(e) => {
                e.target.src = "https://via.placeholder.com/40x40?text=U";
              }}
            />
            {!sidebarCollapsed && (
              <div style={styles.userInfo}>
                <div style={styles.userName}>{currentUser.first_name}</div>
                <div style={styles.userRole}>
                  {currentUser.user_type === 'admin' ? 'Administrator' : 'Employee'}
                </div>
              </div>
            )}
          </div>
          <button style={styles.logoutButton} onClick={handleLogout}>
            <span>🚪</span>
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{...styles.mainContent, ...(sidebarCollapsed ? styles.mainContentExpanded : {})}}>
        <div style={styles.topBar}>
          <div style={styles.breadcrumb}>
            <span style={styles.breadcrumbItem}>Dashboard</span>
            <span style={styles.breadcrumbSeparator}>/</span>
            <span style={styles.breadcrumbActive}>
              {navigationItems.find(item => item.id === activeSection)?.label || 'Overview'}
            </span>
          </div>
          <div style={styles.topBarActions}>
            <div style={styles.timeDisplay}>
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>

        <div style={styles.contentArea}>
          {renderContent()}
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        user={currentUser}
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSuccess={handleProfileUpdateSuccess}
      />
    </div>
  );
}

// Content Components (same as before)
const OverviewContent = ({ currentUser, stats, dashboardData }) => (
  <div style={styles.overviewContent}>
    <div style={styles.welcomeSection}>
      <h1 style={styles.welcomeTitle}>
        Welcome back, {currentUser.first_name}! 👋
      </h1>
      <p style={styles.welcomeSubtitle}>
        Here's what's happening with your account today.
      </p>
    </div>

    <div style={styles.statsGrid}>
      <div style={styles.statCard}>
        <div style={styles.statIcon}>🔐</div>
        <div style={styles.statContent}>
          <div style={styles.statNumber}>{stats.loginCount}</div>
          <div style={styles.statLabel}>Total Logins</div>
        </div>
      </div>
      <div style={styles.statCard}>
        <div style={styles.statIcon}>📅</div>
        <div style={styles.statContent}>
          <div style={styles.statNumber}>{stats.daysActive}</div>
          <div style={styles.statLabel}>Days Active</div>
        </div>
      </div>
      <div style={styles.statCard}>
        <div style={styles.statIcon}>⏰</div>
        <div style={styles.statContent}>
          <div style={styles.statNumber}>{stats.lastLogin}</div>
          <div style={styles.statLabel}>Last Login</div>
        </div>
      </div>
      <div style={styles.statCard}>
        <div style={styles.statIcon}>🎂</div>
        <div style={styles.statContent}>
          <div style={styles.statNumber}>{stats.accountAge}</div>
          <div style={styles.statLabel}>Account Age</div>
        </div>
      </div>
    </div>

    {currentUser.user_type === "admin" && dashboardData && (
      <div style={styles.adminOverview}>
        <h3 style={styles.sectionTitle}>Admin Overview</h3>
        <div style={styles.adminStatsGrid}>
          <div style={styles.adminStatCard}>
            <div style={styles.adminStatNumber}>{dashboardData.stats.totalAdmins}</div>
            <div style={styles.adminStatLabel}>Administrators</div>
          </div>
          <div style={styles.adminStatCard}>
            <div style={styles.adminStatNumber}>{dashboardData.stats.totalEmployees}</div>
            <div style={styles.adminStatLabel}>Employees</div>
          </div>
          <div style={styles.adminStatCard}>
            <div style={styles.adminStatNumber}>{dashboardData.stats.totalUsers}</div>
            <div style={styles.adminStatLabel}>Total Users</div>
          </div>
        </div>
      </div>
    )}
  </div>
);

const ProfileContent = ({ currentUser, onEdit, onView }) => {
  const infoItems = [
    { label: "Email Address", value: currentUser.email_id, icon: "📧" },
    { label: "Phone Number", value: currentUser.phone_number, icon: "📱" },
    { label: "Gender", value: currentUser.gender, icon: "👤" },
    { label: "Age", value: currentUser.age, icon: "🎂" },
  ];

  if (currentUser.user_type === "employee") {
    infoItems.push(
      { label: "Department", value: currentUser.department, icon: "🏢" },
      { label: "Job Role", value: currentUser.role, icon: "💼" },
    );
  }

  return (
    <div style={styles.profileContent}>
      <div style={styles.profileHeader}>
        <img
          style={styles.profileImage}
          src={currentUser.profile_pic_url || "https://via.placeholder.com/120x120?text=Profile"}
          alt="Profile"
          onError={(e) => {
            e.target.src = "https://via.placeholder.com/120x120?text=Profile";
          }}
        />
        <div style={styles.profileInfo}>
          <h2 style={styles.profileName}>
            {currentUser.first_name} {currentUser.last_name}
          </h2>
          <div style={styles.profileBadge}>
            {currentUser.user_type === "admin" ? "👑 Administrator" : `💼 ${currentUser.role || "Employee"}`}
          </div>
          <p style={styles.profileEmail}>{currentUser.email_id}</p>
          <div style={styles.profileActions}>
            <button style={styles.primaryBtn} onClick={onEdit}>
              Edit Profile
            </button>
            <button style={styles.secondaryBtn} onClick={onView}>
              View Details
            </button>
          </div>
        </div>
      </div>

      <div style={styles.profileDetails}>
        <h3 style={styles.sectionTitle}>Personal Information</h3>
        <div style={styles.detailsGrid}>
          {infoItems.map((item, index) => (
            <div key={index} style={styles.detailItem}>
              <div style={styles.detailIcon}>{item.icon}</div>
              <div style={styles.detailContent}>
                <div style={styles.detailLabel}>{item.label}</div>
                <div style={styles.detailValue}>{item.value || "Not specified"}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const AnalyticsContent = ({ stats }) => (
  <div style={styles.analyticsContent}>
    <h2 style={styles.pageTitle}>Analytics & Insights</h2>
    <div style={styles.analyticsGrid}>
      <div style={styles.analyticsCard}>
        <h4 style={styles.analyticsTitle}>Activity Overview</h4>
        <div style={styles.activityChart}>
          <div style={styles.chartPlaceholder}>📊 Activity Chart</div>
        </div>
      </div>
      <div style={styles.analyticsCard}>
        <h4 style={styles.analyticsTitle}>Login Trends</h4>
        <div style={styles.activityChart}>
          <div style={styles.chartPlaceholder}>📈 Login Trends</div>
        </div>
      </div>
    </div>
  </div>
);

const SettingsContent = ({ onSettings }) => (
  <div style={styles.settingsContent}>
    <h2 style={styles.pageTitle}>Settings & Preferences</h2>
    <div style={styles.settingsGrid}>
      <div style={styles.settingCard}>
        <div style={styles.settingIcon}>🔒</div>
        <div style={styles.settingContent}>
          <h4 style={styles.settingTitle}>Security</h4>
          <p style={styles.settingDescription}>Manage your password and security preferences</p>
          <button style={styles.settingBtn} onClick={onSettings}>Configure</button>
        </div>
      </div>
      <div style={styles.settingCard}>
        <div style={styles.settingIcon}>🔔</div>
        <div style={styles.settingContent}>
          <h4 style={styles.settingTitle}>Notifications</h4>
          <p style={styles.settingDescription}>Control how you receive notifications</p>
          <button style={styles.settingBtn} onClick={onSettings}>Configure</button>
        </div>
      </div>
      <div style={styles.settingCard}>
        <div style={styles.settingIcon}>🎨</div>
        <div style={styles.settingContent}>
          <h4 style={styles.settingTitle}>Appearance</h4>
          <p style={styles.settingDescription}>Customize the look and feel</p>
          <button style={styles.settingBtn} onClick={onSettings}>Configure</button>
        </div>
      </div>
    </div>
  </div>
);

const AdminContent = ({ dashboardData, currentUser }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);

  // Fetch all users
  const fetchAllUsers = async () => {
    try {
      const token = currentUser?.token || window.authToken;
      // Backend returns { data, pagination } and defaults to 10 per page, so ask for all users
      const response = await fetch(`${API_BASE_URL}/api/users?limit=1000`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (response.ok) {
        setUsers(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllUsers();
  }, []);

  return (
    <div style={styles.adminContent}>
      <h2 style={styles.pageTitle}>Admin Panel</h2>
      
      <div style={styles.adminActions}>
        <button style={styles.adminActionBtn}>👥 Manage Users ({users.length})</button>
        <button style={styles.adminActionBtn}>📊 View Reports</button>
        <button style={styles.adminActionBtn}>⚙️ System Settings</button>
      </div>

      {dashboardData && (
        <div style={styles.adminStatsGrid}>
          <div style={styles.adminStatCard}>
            <div style={styles.adminStatNumber}>{dashboardData.stats.totalAdmins}</div>
            <div style={styles.adminStatLabel}>Administrators</div>
          </div>
          <div style={styles.adminStatCard}>
            <div style={styles.adminStatNumber}>{dashboardData.stats.totalEmployees}</div>
            <div style={styles.adminStatLabel}>Employees</div>
          </div>
          <div style={styles.adminStatCard}>
            <div style={styles.adminStatNumber}>{dashboardData.stats.totalUsers}</div>
            <div style={styles.adminStatLabel}>Total Users</div>
          </div>
        </div>
      )}

      <div style={styles.usersSection}>
        <h3 style={styles.sectionTitle}>All Users</h3>
        {loading ? (
          <div style={styles.loadingText}>Loading users...</div>
        ) : (
          <div style={styles.usersTable}>
            <div style={styles.tableHeader}>
              <div style={styles.tableCell}>Name</div>
              <div style={styles.tableCell}>Email</div>
              <div style={styles.tableCell}>Type</div>
              <div style={styles.tableCell}>Department</div>
              <div style={styles.tableCell}>Actions</div>
            </div>
            {users.map((user) => (
              <div key={`${user.user_type}-${user.id}`} style={styles.tableRow}>
                <div style={styles.tableCell}>
                  <div style={styles.userCell}>
                    <img 
                      src={user.profile_pic_url || "https://via.placeholder.com/32x32?text=U"} 
                      style={styles.userTableAvatar}
                      alt="Avatar"
                    />
                    {user.first_name} {user.last_name}
                  </div>
                </div>
                <div style={styles.tableCell}>{user.email_id}</div>
                <div style={styles.tableCell}>
                  <span style={{
                    ...styles.userTypeBadge,
                    ...(user.user_type === 'admin' ? styles.adminBadge : styles.employeeBadge)
                  }}>
                    {user.user_type === 'admin' ? '👑 Admin' : '💼 Employee'}
                  </span>
                </div>
                <div style={styles.tableCell}>{user.department || 'N/A'}</div>
                <div style={styles.tableCell}>
                  <button 
                    style={styles.viewBtn}
                    onClick={() => setSelectedUser(user)}
                  >
                    View
                  </button>
                  <button style={styles.editBtn}>Edit</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div style={styles.modalOverlay} onClick={() => setSelectedUser(null)}>
          <div style={styles.userDetailsModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3>User Details</h3>
              <button onClick={() => setSelectedUser(null)}>×</button>
            </div>
            <div style={styles.userDetailsContent}>
              <img 
                src={selectedUser.profile_pic_url || "https://via.placeholder.com/80x80?text=U"} 
                style={styles.userDetailsAvatar}
                alt="Avatar"
              />
              <div style={styles.userDetailsInfo}>
                <h4>{selectedUser.first_name} {selectedUser.last_name}</h4>
                <p><strong>Email:</strong> {selectedUser.email_id}</p>
                <p><strong>Phone:</strong> {selectedUser.phone_number || 'Not specified'}</p>
                <p><strong>Age:</strong> {selectedUser.age || 'Not specified'}</p>
                <p><strong>Gender:</strong> {selectedUser.gender || 'Not specified'}</p>
                <p><strong>Type:</strong> {selectedUser.user_type}</p>
                {selectedUser.user_type === 'employee' && (
                  <>
                    <p><strong>Department:</strong> {selectedUser.department || 'Not specified'}</p>
                    <p><strong>Role:</strong> {selectedUser.role || 'Not specified'}</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
const keyframes = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideIn {
    from { transform: translateX(-100%); }
    to { transform: translateX(0); }
  }
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
  @keyframes shimmer {
    0% { background-position: -200px 0; }
    100% { background-position: calc(200px + 100%) 0; }
  }
`;

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#1a1a2e',
  },

  // Sidebar Styles
  sidebar: {
    width: '280px',
    background: 'linear-gradient(180deg, #16213e 0%, #0f172a 100%)',
    color: '#f8fafc',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    height: '100vh',
    left: 0,
    top: 0,
    zIndex: 1000,
    transition: 'all 0.3s ease',
    borderRight: '1px solid rgba(203, 213, 225, 0.1)',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
  sidebarCollapsed: {
    width: '80px',
  },
  sidebarHeader: {
    padding: '24px',
    borderBottom: '1px solid rgba(203, 213, 225, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(79, 70, 229, 0.1) 100%)',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logoIcon: {
    fontSize: '24px',
    filter: 'drop-shadow(0 0 10px rgba(139, 92, 246, 0.5))',
  },
  logoText: {
    fontSize: '20px',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textShadow: '0 0 20px rgba(251, 191, 36, 0.3)',
  },
  toggleBtn: {
    background: 'rgba(139, 92, 246, 0.2)',
    border: '1px solid rgba(139, 92, 246, 0.3)',
    color: '#fbbf24',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '8px',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(10px)',
  },
  navigation: {
    flex: 1,
    padding: '24px 0',
  },
  navItem: {
    width: '100%',
    background: 'none',
    border: 'none',
    color: '#cbd5e1',
    padding: '16px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontSize: '16px',
    position: 'relative',
  },
  navItemActive: {
    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(79, 70, 229, 0.2) 100%)',
    color: '#fbbf24',
    borderRight: '3px solid #fbbf24',
    boxShadow: 'inset 0 0 20px rgba(139, 92, 246, 0.1)',
  },
  navIcon: {
    fontSize: '20px',
    minWidth: '20px',
    filter: 'drop-shadow(0 0 5px rgba(251, 191, 36, 0.3))',
  },
  navLabel: {
    fontWeight: '500',
  },
  sidebarFooter: {
    padding: '24px',
    borderTop: '1px solid rgba(203, 213, 225, 0.1)',
    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(79, 70, 229, 0.05) 100%)',
  },
  userPreview: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  userAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid rgba(251, 191, 36, 0.5)',
    boxShadow: '0 0 15px rgba(251, 191, 36, 0.3)',
  },
  userInfo: {
    flex: 1,
    minWidth: 0,
  },
  userName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#fbbf24',
    marginBottom: '2px',
    textShadow: '0 0 10px rgba(251, 191, 36, 0.3)',
  },
  userRole: {
    fontSize: '12px',
    color: '#cbd5e1',
  },
  logoutButton: {
    width: '100%',
    background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
    border: 'none',
    color: 'white',
    padding: '12px',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(220, 38, 38, 0.3)',
  },

  // Main Content Styles
  mainContent: {
    flex: 1,
    marginLeft: '280px',
    display: 'flex',
    flexDirection: 'column',
    transition: 'margin-left 0.3s ease',
  },
  mainContentExpanded: {
    marginLeft: '80px',
  },
  topBar: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(203, 213, 225, 0.2)',
    padding: '20px 32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
  },
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
  },
  breadcrumbItem: {
    color: '#6b7280',
  },
  breadcrumbSeparator: {
    color: '#d1d5db',
  },
  breadcrumbActive: {
    color: '#8b5cf6',
    fontWeight: '600',
  },
  topBarActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  timeDisplay: {
    fontSize: '14px',
    color: '#6b7280',
    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    fontWeight: '600',
  },
  contentArea: {
    flex: 1,
    padding: '32px',
    animation: 'fadeIn 0.5s ease',
  },

  // Overview Content
  overviewContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
  },
  welcomeSection: {
    marginBottom: '8px',
  },
  welcomeTitle: {
    fontSize: '32px',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #1e293b 0%, #8b5cf6 100%)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: '0 0 8px 0',
    textShadow: '0 0 30px rgba(139, 92, 246, 0.3)',
  },
  welcomeSubtitle: {
    fontSize: '16px',
    color: '#1e293b',
    margin: 0,
    opacity: 0.8,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px',
  },
    statCard: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: '20px',
    padding: '32px',
    border: '1px solid rgba(203, 213, 225, 0.2)',
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-5px)',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    },
  },
  statIcon: {
    fontSize: '40px',
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(79, 70, 229, 0.1) 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statContent: {
    display: 'flex',
    flexDirection: 'column',
  },
  statNumber: {
    fontSize: '32px',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #1e293b 0%, #8b5cf6 100%)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '4px',
  },
  statLabel: {
    fontSize: '14px',
    color: '#64748b',
    fontWeight: '500',
  },
  adminOverview: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: '20px',
    padding: '32px',
    border: '1px solid rgba(203, 213, 225, 0.2)',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0 0 24px 0',
    position: 'relative',
    '&::after': {
      content: '""',
      position: 'absolute',
      bottom: '-8px',
      left: 0,
      width: '60px',
      height: '4px',
      background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
      borderRadius: '2px',
    },
  },
  adminStatsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '24px',
    marginTop: '24px',
  },
  adminStatCard: {
    background: 'rgba(241, 245, 249, 0.7)',
    borderRadius: '16px',
    padding: '24px',
    textAlign: 'center',
    border: '1px solid rgba(203, 213, 225, 0.3)',
  },
  adminStatNumber: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#8b5cf6',
    marginBottom: '8px',
  },
  adminStatLabel: {
    fontSize: '14px',
    color: '#64748b',
    fontWeight: '500',
  },

  // Profile Content
  profileContent: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: '20px',
    padding: '32px',
    border: '1px solid rgba(203, 213, 225, 0.2)',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
  },
  profileHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '32px',
    marginBottom: '32px',
  },
  profileImage: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '4px solid rgba(139, 92, 246, 0.3)',
    boxShadow: '0 0 30px rgba(139, 92, 246, 0.2)',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: '28px',
    fontWeight: 'bold',
    margin: '0 0 8px 0',
    color: '#1e293b',
  },
  profileBadge: {
    display: 'inline-block',
    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(79, 70, 229, 0.1) 100%)',
    color: '#8b5cf6',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '12px',
    border: '1px solid rgba(139, 92, 246, 0.2)',
  },
  profileEmail: {
    fontSize: '16px',
    color: '#64748b',
    margin: '0 0 16px 0',
  },
  profileActions: {
    display: 'flex',
    gap: '12px',
  },
  primaryBtn: {
    background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 20px rgba(139, 92, 246, 0.4)',
    },
  },
  secondaryBtn: {
    background: 'rgba(255, 255, 255, 0.9)',
    color: '#8b5cf6',
    border: '1px solid rgba(139, 92, 246, 0.3)',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    '&:hover': {
      background: 'rgba(139, 92, 246, 0.05)',
      transform: 'translateY(-2px)',
    },
  },
  profileDetails: {
    marginTop: '32px',
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
  },
  detailItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px',
    borderRadius: '12px',
    background: 'rgba(241, 245, 249, 0.5)',
    transition: 'all 0.3s ease',
    '&:hover': {
      background: 'rgba(241, 245, 249, 0.8)',
      transform: 'translateY(-2px)',
    },
  },
  detailIcon: {
    fontSize: '24px',
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'rgba(139, 92, 246, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#8b5cf6',
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: '14px',
    color: '#64748b',
    marginBottom: '4px',
  },
  detailValue: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e293b',
  },

  // Analytics Content
  analyticsContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
  },
  pageTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1e293b',
    margin: 0,
  },
  analyticsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '24px',
  },
  analyticsCard: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: '20px',
    padding: '32px',
    border: '1px solid rgba(203, 213, 225, 0.2)',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
  },
  analyticsTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0 0 24px 0',
  },
  activityChart: {
    height: '300px',
    background: 'rgba(241, 245, 249, 0.5)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#64748b',
  },
  chartPlaceholder: {
    fontSize: '18px',
    fontWeight: '500',
    opacity: 0.7,
  },

  // Settings Content
  settingsContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
  },
  settingsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
  },
  settingCard: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: '20px',
    padding: '24px',
    border: '1px solid rgba(203, 213, 225, 0.2)',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-5px)',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    },
  },
  settingIcon: {
    fontSize: '24px',
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'rgba(139, 92, 246, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#8b5cf6',
    flexShrink: 0,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0 0 8px 0',
  },
  settingDescription: {
    fontSize: '14px',
    color: '#64748b',
    margin: '0 0 16px 0',
  },
  settingBtn: {
    background: 'rgba(139, 92, 246, 0.05)',
    color: '#8b5cf6',
    border: '1px solid rgba(139, 92, 246, 0.2)',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    '&:hover': {
      background: 'rgba(139, 92, 246, 0.1)',
    },
  },

  // Admin Content
  adminContent: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: '20px',
    padding: '32px',
    border: '1px solid rgba(203, 213, 225, 0.2)',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
  },
  adminActions: {
    display: 'flex',
    gap: '16px',
    marginBottom: '32px',
    flexWrap: 'wrap',
  },
  adminActionBtn: {
    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(79, 70, 229, 0.1) 100%)',
    color: '#8b5cf6',
    border: '1px solid rgba(139, 92, 246, 0.3)',
    padding: '12px 24px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    '&:hover': {
      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(79, 70, 229, 0.2) 100%)',
      transform: 'translateY(-2px)',
    },
  },
  recentActivity: {
    marginTop: '32px',
  },
  activityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  activityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px',
    borderRadius: '12px',
    background: 'rgba(241, 245, 249, 0.5)',
    transition: 'all 0.3s ease',
    '&:hover': {
      background: 'rgba(241, 245, 249, 0.8)',
    },
  },
  activityIcon: {
    fontSize: '20px',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'rgba(139, 92, 246, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#8b5cf6',
    flexShrink: 0,
  },
  activityDetails: {
    flex: 1,
  },
  activityText: {
    fontSize: '14px',
    color: '#1e293b',
    marginBottom: '4px',
  },
  activityTime: {
    fontSize: '12px',
    color: '#64748b',
  },
  noData: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    textAlign: 'center',
  },
  noDataIcon: {
    fontSize: '48px',
    marginBottom: '16px',
    opacity: 0.5,
  },
  noDataText: {
    fontSize: '16px',
    color: '#64748b',
    margin: 0,
  },

  // Loading and Error States
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
  },
  loadingSpinner: {
    width: '50px',
    height: '50px',
    border: '5px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '50%',
    borderTopColor: 'white',
    animation: 'spin 1s linear infinite',
    marginBottom: '20px',
  },
  loadingText: {
    fontSize: '18px',
    marginTop: '20px',
  },
  errorContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
  },
  errorCard: {
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '20px',
    padding: '40px',
    maxWidth: '500px',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
  },
  errorIcon: {
    fontSize: '48px',
    marginBottom: '20px',
  },
  errorTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '0 0 16px 0',
    color: '#1e293b',
  },
  errorMessage: {
    fontSize: '16px',
    color: '#64748b',
    margin: '0 0 24px 0',
  },
  errorActions: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
  },
  retryBtn: {
    background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 5px 15px rgba(139, 92, 246, 0.4)',
    },
  },
  usersSection: {
  marginTop: '30px',
},
usersTable: {
  backgroundColor: 'white',
  borderRadius: '12px',
  overflow: 'hidden',
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
},
tableHeader: {
  display: 'flex',
  backgroundColor: '#f8f9fa',
  fontWeight: 'bold',
  padding: '15px',
  borderBottom: '1px solid #dee2e6',
},
tableRow: {
  display: 'flex',
  padding: '15px',
  borderBottom: '1px solid #f1f3f4',
  ':hover': {
    backgroundColor: '#f8f9fa',
  },
},
tableCell: {
  flex: 1,
  padding: '0 10px',
  display: 'flex',
  alignItems: 'center',
},
userCell: {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
},
userTableAvatar: {
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  objectFit: 'cover',
},
userTypeBadge: {
  padding: '4px 8px',
  borderRadius: '12px',
  fontSize: '12px',
  fontWeight: 'bold',
},
adminBadge: {
  backgroundColor: '#fff3cd',
  color: '#856404',
},
employeeBadge: {
  backgroundColor: '#d1ecf1',
  color: '#0c5460',
},
viewBtn: {
  padding: '6px 12px',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  marginRight: '5px',
  fontSize: '12px',
},
editBtn: {
  padding: '6px 12px',
  backgroundColor: '#28a745',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '12px',
},
modalOverlay: {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
},
userDetailsModal: {
  backgroundColor: 'white',
  borderRadius: '12px',
  padding: '20px',
  maxWidth: '500px',
  width: '90%',
  maxHeight: '80vh',
  overflow: 'auto',
},
userDetailsContent: {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '15px',
},
userDetailsAvatar: {
  width: '80px',
  height: '80px',
  borderRadius: '50%',
  objectFit: 'cover',
},
userDetailsInfo: {
  textAlign: 'center',
},
  logoutBtn: {
    background: 'rgba(255, 255, 255, 0.9)',
    color: '#8b5cf6',
    border: '1px solid rgba(139, 92, 246, 0.3)',
    padding: '12px 24px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    '&:hover': {
      background: 'rgba(139, 92, 246, 0.05)',
      transform: 'translateY(-2px)',
    },
  },
};