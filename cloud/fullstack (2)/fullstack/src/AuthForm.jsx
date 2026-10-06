import React, { useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function AuthForm({ onLoginSuccess }) {
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({ 
    email: "", 
    username: "", 
    password: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    gender: "",
    age: "",
    department: "",
    jobRole: ""
  });
  const [focusedField, setFocusedField] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Basic validation
    if (!form.email || !form.password) {
      setError("Please fill in all required fields");
      setLoading(false);
      return;
    }

    if (isSignup && !form.username) {
      setError("Please choose a username");
      setLoading(false);
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    // Password strength validation (for signup)
    if (isSignup && form.password.length < 8) {
      setError("Password must be at least 8 characters long");
      setLoading(false);
      return;
    }

    try {
      let response;
      let endpoint;
      let body;

      if (isSignup) {
        endpoint = `${API_BASE_URL}/api/auth/signup`;
        body = {
          email: form.email,
          username: form.username,
          password: form.password,
          firstName: form.firstName,
          lastName: form.lastName,
          phoneNumber: form.phoneNumber,
          gender: form.gender,
          age: form.age,
          department: form.department,
          jobRole: form.jobRole
        };
      } else {
        endpoint = `${API_BASE_URL}/api/auth/login`;
        body = {
          email: form.email,
          password: form.password
        };
      }

      response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || (isSignup ? "Signup failed" : "Login failed"));
      }

      if (data.success) {
        if (onLoginSuccess) {
          onLoginSuccess(data.user, data.token);
        } else {
          console.log("Authentication successful, but no callback provided");
        }
      } else {
        setError(data.message || (isSignup ? "Signup failed" : "Login failed"));
      }
    } catch (err) {
      console.error(`❌ ${isSignup ? "Signup" : "Login"} error:`, err);
      setError(err.message || `Network error during ${isSignup ? "signup" : "login"}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleTabClick = (signupTab) => {
    setIsSignup(signupTab);
    setForm({ 
      email: "", 
      username: "", 
      password: "", 
      firstName: "", 
      lastName: "",
      phoneNumber: "",
      gender: "",
      age: "",
      department: "",
      jobRole: ""
    });
    setError("");
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div style={styles.pageContainer}>
      {/* Luxury Background */}
      <div style={styles.backgroundOverlay}>
        <div style={styles.gradientOrb1}></div>
        <div style={styles.gradientOrb2}></div>
        <div style={styles.gradientOrb3}></div>
      </div>

      {/* Geometric Pattern Overlay */}
      <div style={styles.geometricPattern}>
        <svg width="100%" height="100%" style={styles.patternSvg}>
          {[...Array(12)].map((_, i) => (
            <circle
              key={i}
              cx={`${10 + (i * 8) % 80}%`}
              cy={`${10 + (i * 13) % 80}%`}
              r="1"
              fill="rgba(212, 175, 55, 0.1)"
              style={{
                animation: `shimmer ${3 + (i % 3)}s ease-in-out infinite ${i * 0.2}s`
              }}
            />
          ))}
        </svg>
      </div>

      <div style={styles.mainContainer}>
        {/* Left Side - Welcome Panel */}
        <div style={styles.welcomePanel}>
          <div style={styles.welcomeContent}>
            <div style={styles.brandSection}>
              <div style={styles.luxuryLogo}>
                <div style={styles.logoInner}>
                  <div style={styles.logoGem}>◆</div>
                </div>
              </div>
            </div>
            
            <div style={styles.welcomeText}>
              <h2 style={styles.welcomeTitle}>
                {isSignup ? "Join the Elite" : "Welcome Back"}
              </h2>
              <p style={styles.welcomeDescription}>
                {isSignup 
                  ? "Elevate your experience with our exclusive platform designed for those who appreciate excellence."
                  : "Continue your journey in luxury. Your premium experience awaits."
                }
              </p>
            </div>

            <div style={styles.decorativeElements}>
              <div style={styles.decorativeLine}></div>
              <div style={styles.decorativeCircle}></div>
              <div style={styles.decorativeLine}></div>
            </div>
          </div>
        </div>

        {/* Right Side - Form Panel */}
        <div style={styles.formPanel}>
          <div style={styles.formContent}>
            {/* Mode Toggle */}
            <div style={styles.modeToggle}>
              <button
                onClick={() => handleTabClick(false)}
                style={{
                  ...styles.modeButton,
                  ...(isSignup ? styles.modeButtonInactive : styles.modeButtonActive),
                }}
              >
                Sign In
              </button>
              <button
                onClick={() => handleTabClick(true)}
                style={{
                  ...styles.modeButton,
                  ...(isSignup ? styles.modeButtonActive : styles.modeButtonInactive),
                }}
              >
                Sign Up
              </button>
              <div 
                style={{
                  ...styles.modeIndicator,
                  transform: `translateX(${isSignup ? '100%' : '0%'})`
                }}
              ></div>
            </div>

            {/* Error Message */}
            {error && (
              <div style={styles.errorCard}>
                <div style={styles.errorIconContainer}>
                  <span style={styles.errorIcon}>⚠</span>
                </div>
                <div style={styles.errorContent}>
                  <p style={styles.errorMessage}>{error}</p>
                </div>
              </div>
            )}

            {/* Form */}
            <div style={styles.form}>
              {/* Email Field */}
              <div style={styles.fieldGroup}>
                <label style={styles.fieldLabel}>Email Address</label>
                <div 
                  style={{
                    ...styles.inputWrapper,
                    ...(focusedField === 'email' ? styles.inputWrapperFocused : {})
                  }}
                >
                  <div style={styles.inputIconContainer}>
                    <span style={styles.inputIcon}>✉</span>
                  </div>
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    value={form.email}
                    onChange={handleChange}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField("")}
                    required
                    disabled={loading}
                    style={styles.input}
                  />
                </div>
              </div>

              {/* Username Field (Sign Up Only) */}
              {isSignup && (
                <div style={styles.fieldGroup}>
                  <label style={styles.fieldLabel}>Username</label>
                  <div 
                    style={{
                      ...styles.inputWrapper,
                      ...(focusedField === 'username' ? styles.inputWrapperFocused : {})
                    }}
                  >
                    <div style={styles.inputIconContainer}>
                      <span style={styles.inputIcon}>👤</span>
                    </div>
                    <input
                      type="text"
                      name="username"
                      placeholder="Choose username"
                      value={form.username}
                      onChange={handleChange}
                      onFocus={() => setFocusedField("username")}
                      onBlur={() => setFocusedField("")}
                      required
                      disabled={loading}
                      style={styles.input}
                    />
                  </div>
                </div>
              )}

              {/* First Name Field (Sign Up Only) */}
              {isSignup && (
                <div style={styles.fieldGroup}>
                  <label style={styles.fieldLabel}>First Name</label>
                  <div 
                    style={{
                      ...styles.inputWrapper,
                      ...(focusedField === 'firstName' ? styles.inputWrapperFocused : {})
                    }}
                  >
                    <div style={styles.inputIconContainer}>
                      <span style={styles.inputIcon}>👋</span>
                    </div>
                    <input
                      type="text"
                      name="firstName"
                      placeholder="Your first name"
                      value={form.firstName}
                      onChange={handleChange}
                      onFocus={() => setFocusedField("firstName")}
                      onBlur={() => setFocusedField("")}
                      required
                      disabled={loading}
                      style={styles.input}
                    />
                  </div>
                </div>
              )}

              {/* Last Name Field (Sign Up Only) */}
              {isSignup && (
                <div style={styles.fieldGroup}>
                  <label style={styles.fieldLabel}>Last Name</label>
                  <div 
                    style={{
                      ...styles.inputWrapper,
                      ...(focusedField === 'lastName' ? styles.inputWrapperFocused : {})
                    }}
                  >
                    <div style={styles.inputIconContainer}>
                      <span style={styles.inputIcon}>👪</span>
                    </div>
                    <input
                      type="text"
                      name="lastName"
                      placeholder="Your last name"
                      value={form.lastName}
                      onChange={handleChange}
                      onFocus={() => setFocusedField("lastName")}
                      onBlur={() => setFocusedField("")}
                      required
                      disabled={loading}
                      style={styles.input}
                    />
                  </div>
                </div>
              )}

              {/* Phone Number Field (Sign Up Only) */}
              {isSignup && (
                <div style={styles.fieldGroup}>
                  <label style={styles.fieldLabel}>Phone Number</label>
                  <div 
                    style={{
                      ...styles.inputWrapper,
                      ...(focusedField === 'phoneNumber' ? styles.inputWrapperFocused : {})
                    }}
                  >
                    <div style={styles.inputIconContainer}>
                      <span style={styles.inputIcon}>📱</span>
                    </div>
                    <input
                      type="tel"
                      name="phoneNumber"
                      placeholder="Your phone number"
                      value={form.phoneNumber}
                      onChange={handleChange}
                      onFocus={() => setFocusedField("phoneNumber")}
                      onBlur={() => setFocusedField("")}
                      disabled={loading}
                      style={styles.input}
                    />
                  </div>
                </div>
              )}

              {/* Gender Field (Sign Up Only) */}
              {isSignup && (
                <div style={styles.fieldGroup}>
                  <label style={styles.fieldLabel}>Gender</label>
                  <div 
                    style={{
                      ...styles.inputWrapper,
                      ...(focusedField === 'gender' ? styles.inputWrapperFocused : {})
                    }}
                  >
                    <div style={styles.inputIconContainer}>
                      <span style={styles.inputIcon}>⚥</span>
                    </div>
                    <select
                      name="gender"
                      value={form.gender}
                      onChange={handleChange}
                      onFocus={() => setFocusedField("gender")}
                      onBlur={() => setFocusedField("")}
                      disabled={loading}
                      style={{...styles.input, ...styles.select}}
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Age Field (Sign Up Only) */}
              {isSignup && (
                <div style={styles.fieldGroup}>
                  <label style={styles.fieldLabel}>Age</label>
                  <div 
                    style={{
                      ...styles.inputWrapper,
                      ...(focusedField === 'age' ? styles.inputWrapperFocused : {})
                    }}
                  >
                    <div style={styles.inputIconContainer}>
                      <span style={styles.inputIcon}>🎂</span>
                    </div>
                    <input
                      type="number"
                      name="age"
                      placeholder="Your age"
                      value={form.age}
                      onChange={handleChange}
                      onFocus={() => setFocusedField("age")}
                      onBlur={() => setFocusedField("")}
                      min="13"
                      max="120"
                      disabled={loading}
                      style={styles.input}
                    />
                  </div>
                </div>
              )}

              {/* Department Field (Sign Up Only) */}
              {isSignup && (
                <div style={styles.fieldGroup}>
                  <label style={styles.fieldLabel}>Department</label>
                  <div 
                    style={{
                      ...styles.inputWrapper,
                      ...(focusedField === 'department' ? styles.inputWrapperFocused : {})
                    }}
                  >
                    <div style={styles.inputIconContainer}>
                      <span style={styles.inputIcon}>🏢</span>
                    </div>
                    <input
                      type="text"
                      name="department"
                      placeholder="Your department"
                      value={form.department}
                      onChange={handleChange}
                      onFocus={() => setFocusedField("department")}
                      onBlur={() => setFocusedField("")}
                      disabled={loading}
                      style={styles.input}
                    />
                  </div>
                </div>
              )}

              {/* Job Role Field (Sign Up Only) */}
              {isSignup && (
                <div style={styles.fieldGroup}>
                  <label style={styles.fieldLabel}>Job Role</label>
                  <div 
                    style={{
                      ...styles.inputWrapper,
                      ...(focusedField === 'jobRole' ? styles.inputWrapperFocused : {})
                    }}
                  >
                    <div style={styles.inputIconContainer}>
                      <span style={styles.inputIcon}>💼</span>
                    </div>
                    <input
                      type="text"
                      name="jobRole"
                      placeholder="Your job role"
                      value={form.jobRole}
                      onChange={handleChange}
                      onFocus={() => setFocusedField("jobRole")}
                      onBlur={() => setFocusedField("")}
                      disabled={loading}
                      style={styles.input}
                    />
                  </div>
                </div>
              )}

              {/* Password Field */}
              <div style={styles.fieldGroup}>
                <label style={styles.fieldLabel}>Password</label>
                <div 
                  style={{
                    ...styles.inputWrapper,
                    ...(focusedField === 'password' ? styles.inputWrapperFocused : {})
                  }}
                >
                  <div style={styles.inputIconContainer}>
                    <span style={styles.inputIcon}>🔐</span>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter password"
                    value={form.password}
                    onChange={handleChange}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField("")}
                    required
                    disabled={loading}
                    style={styles.input}
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    style={styles.toggleButton}
                  >
                    {showPassword ? '👁' : '👁‍🗨'}
                  </button>
                </div>
                {isSignup && (
                  <p style={styles.passwordHint}>
                    Password must be at least 8 characters long
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  ...styles.submitButton,
                  ...(loading ? styles.submitButtonDisabled : {})
                }}
              >
                <div style={styles.buttonContent}>
                  <span style={styles.buttonIcon}>
                    {loading ? '⟳' : isSignup ? '✦' : '→'}
                  </span>
                  <span style={styles.buttonText}>
                    {loading ? 'Processing...' : isSignup ? 'Create Account' : 'Sign In'}
                  </span>
                </div>
                {!loading && <div style={styles.buttonShine}></div>}
              </button>
            </div>

            {/* Demo Info */}
            {!isSignup && (
              <div style={styles.demoCard}>
                <div style={styles.demoIconContainer}>
                  <span style={styles.demoIcon}>⚡</span>
                </div>
                <div style={styles.demoContent}>
                  <h4 style={styles.demoTitle}>Demo Environment</h4>
                  <p style={styles.demoText}>Use your database credentials to access</p>
                </div>
              </div>
            )}

            {/* Footer */}
            <div style={styles.formFooter}>
              <p style={styles.footerText}>
                {isSignup ? "Already have an account?" : "New to our platform?"}
              </p>
              <button
                type="button"
                onClick={() => handleTabClick(!isSignup)}
                style={styles.linkButton}
                disabled={loading}
              >
                {isSignup ? "Sign in instead" : "Create account"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=Playfair+Display:wght@400;500;600;700&display=swap');
        
        @keyframes luxuryGlow {
          0%, 100% {
            transform: scale(1) rotate(0deg);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.1) rotate(2deg);
            opacity: 1;
          }
        }

        @keyframes shimmer {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.2);
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes buttonShine {
          0% {
            transform: translateX(-100%) rotate(45deg);
          }
          100% {
            transform: translateX(300%) rotate(45deg);
          }
        }

        @keyframes logoRotate {
          0% {
            transform: rotateY(0deg);
          }
          100% {
            transform: rotateY(360deg);
          }
        }

        .luxury-form-panel {
          animation: slideInRight 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .luxury-welcome-panel {
          animation: slideInLeft 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .luxury-logo:hover .logo-inner {
          animation: logoRotate 1s ease-in-out;
        }

        .luxury-button:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 0 20px 40px rgba(212, 175, 55, 0.4);
        }

        .luxury-input:focus {
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
}
const styles = {
  pageContainer: {
    minHeight: '100vh',
    position: 'relative',
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
    fontFamily: "'Poppins', sans-serif",
    overflow: 'hidden',
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  gradientOrb1: {
    position: 'absolute',
    top: '-20%',
    left: '-10%',
    width: '60%',
    height: '60%',
    background: 'radial-gradient(circle, rgba(212, 175, 55, 0.15) 0%, transparent 70%)',
    borderRadius: '50%',
    animation: 'luxuryGlow 20s ease-in-out infinite',
  },
  gradientOrb2: {
    position: 'absolute',
    bottom: '-20%',
    right: '-10%',
    width: '50%',
    height: '50%',
    background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
    borderRadius: '50%',
    animation: 'luxuryGlow 25s ease-in-out infinite reverse',
  },
  gradientOrb3: {
    position: 'absolute',
    top: '30%',
    right: '20%',
    width: '30%',
    height: '30%',
    background: 'radial-gradient(circle, rgba(244, 63, 94, 0.08) 0%, transparent 70%)',
    borderRadius: '50%',
    animation: 'luxuryGlow 15s ease-in-out infinite',
  },
  geometricPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
    opacity: 0.4,
  },
  patternSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  mainContainer: {
    position: 'relative',
    zIndex: 10,
    display: 'flex',
    minHeight: '100vh',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    gap: '40px',
  },
  welcomePanel: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 40px',
    className: 'luxury-welcome-panel',
  },
  welcomeContent: {
    textAlign: 'center',
    maxWidth: '400px',
  },
  brandSection: {
    marginBottom: '60px',
  },
  luxuryLogo: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '30px',
    className: 'luxury-logo',
  },
  logoInner: {
    width: '80px',
    height: '80px',
    background: 'linear-gradient(135deg, #d4af37 0%, #ffd700 50%, #b8860b 100%)',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 20px 40px rgba(212, 175, 55, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
    position: 'relative',
    className: 'logo-inner',
  },
  logoGem: {
    fontSize: '32px',
    color: '#ffffff',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
  },
  brandTitle: {
    fontSize: '48px',
    fontWeight: '700',
    fontFamily: "'Playfair Display', serif",
    background: 'linear-gradient(135deg, #d4af37, #ffd700)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: '0 0 10px 0',
    letterSpacing: '3px',
  },
  brandSubtitle: {
    fontSize: '16px',
    color: 'rgba(212, 175, 55, 0.8)',
    margin: 0,
    letterSpacing: '2px',
    textTransform: 'uppercase',
    fontWeight: '300',
  },
  welcomeText: {
    marginBottom: '50px',
  },
  welcomeTitle: {
    fontSize: '36px',
    fontWeight: '600',
    color: '#ffffff',
    margin: '0 0 20px 0',
    fontFamily: "'Playfair Display', serif",
  },
  welcomeDescription: {
    fontSize: '16px',
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: '1.6',
    margin: 0,
    fontWeight: '300',
  },
  decorativeElements: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '20px',
  },
  decorativeLine: {
    width: '60px',
    height: '1px',
    background: 'linear-gradient(90deg, transparent, #d4af37, transparent)',
  },
  decorativeCircle: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#d4af37',
    boxShadow: '0 0 20px rgba(212, 175, 55, 0.5)',
  },
  formPanel: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    className: 'luxury-form-panel',
  },
  formContent: {
    width: '100%',
    maxWidth: '420px',
    padding: '50px 40px',
    background: 'rgba(255, 255, 255, 0.02)',
    backdropFilter: 'blur(20px)',
    borderRadius: '30px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 30px 60px rgba(0, 0, 0, 0.3)',
  },
  modeToggle: {
    position: 'relative',
    display: 'flex',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '20px',
    padding: '8px',
    marginBottom: '40px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  modeButton: {
    flex: 1,
    padding: '16px 24px',
    background: 'none',
    border: 'none',
    borderRadius: '16px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    position: 'relative',
    zIndex: 2,
  },
  modeButtonActive: {
    color: '#ffffff',
  },
  modeButtonInactive: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  modeIndicator: {
    position: 'absolute',
    top: '8px',
    left: '8px',
    width: 'calc(50% - 8px)',
    height: 'calc(100% - 16px)',
    background: 'linear-gradient(135deg, #d4af37, #b8860b)',
    borderRadius: '16px',
    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    zIndex: 1,
    boxShadow: '0 4px 20px rgba(212, 175, 55, 0.3)',
  },
  errorCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    background: 'rgba(244, 63, 94, 0.1)',
    border: '1px solid rgba(244, 63, 94, 0.2)',
    borderRadius: '20px',
    padding: '20px',
    marginBottom: '30px',
  },
  errorIconContainer: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: 'rgba(244, 63, 94, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  errorIcon: {
    color: '#f43f5e',
    fontSize: '14px',
  },
  errorContent: {
    flex: 1,
  },
  errorMessage: {
    color: '#f43f5e',
    fontSize: '14px',
    margin: 0,
    fontWeight: '500',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '28px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  fieldLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: '0.5px',
  },
  inputWrapper: {
    position: 'relative',
    transition: 'all 0.3s ease',
  },
  inputWrapperFocused: {
    transform: 'translateY(-2px)',
  },
  inputIconContainer: {
    position: 'absolute',
    left: '20px',
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 2,
  },
  inputIcon: {
    fontSize: '18px',
    opacity: 0.6,
  },
  input: {
    width: '100%',
    padding: '20px 20px 20px 60px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    fontSize: '16px',
    color: '#ffffff',
    outline: 'none',
    transition: 'all 0.3s ease',
    fontWeight: '400',
    boxSizing: 'border-box',
    className: 'luxury-input',
  },
  passwordHint: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.5)',
    margin: '4px 0 0 0',
    fontStyle: 'italic',
  },
  toggleButton: {
    position: 'absolute',
    right: '20px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    color: 'rgba(255, 255, 255, 0.6)',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '4px',
    borderRadius: '8px',
    transition: 'all 0.3s ease',
  },
  submitButton: {
    width: '100%',
    padding: '20px 30px',
    background: 'linear-gradient(135deg, #d4af37, #b8860b)',
    border: 'none',
    borderRadius: '16px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    overflow: 'hidden',
    marginTop: '20px',
    boxShadow: '0 10px 30px rgba(212, 175, 55, 0.3)',
    className: 'luxury-button',
  },
  submitButtonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
    transform: 'none !important',
  },
  buttonContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    position: 'relative',
    zIndex: 2,
  },
  buttonIcon: {
    fontSize: '18px',
  },
  buttonText: {
    fontSize: '16px',
    fontWeight: '600',
    letterSpacing: '0.5px',
  },
  buttonShine: {
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
    animation: 'buttonShine 2s ease-in-out infinite',
  },
  demoCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    background: 'rgba(139, 92, 246, 0.1)',
    border: '1px solid rgba(139, 92, 246, 0.2)',
    borderRadius: '20px',
    padding: '20px',
    marginTop: '30px',
  },
  demoIconContainer: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    background: 'rgba(139, 92, 246, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  demoIcon: {
    fontSize: '20px',
  },
  demoContent: {
    flex: 1,
  },
  demoTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#8b5cf6',
    margin: '0 0 6px 0',
  },
  demoText: {
    fontSize: '14px',
    color: 'rgba(139, 92, 246, 0.8)',
    margin: 0,
    lineHeight: '1.4',
  },
  formFooter: {
    textAlign: 'center',
    marginTop: '40px',
    paddingTop: '30px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  },
  footerText: {
    fontSize: '15px',
    color: 'rgba(255, 255, 255, 0.6)',
    margin: '0 0 16px 0',
  },
  linkButton: {
    background: 'none',
    border: 'none',
    color: '#d4af37',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
    padding: '10px 20px',
    borderRadius: '12px',
    transition: 'all 0.3s ease',
    textDecoration: 'underline',
    textDecorationColor: 'transparent',
  },
};

