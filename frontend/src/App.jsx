import React, { useState, useEffect } from "react";
import AuthForm from "./AuthForm";
import Dashboard from "./Dashboard";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check authentication status on app load
  useEffect(() => {
    const checkAuthStatus = () => {
      // Try to get data from localStorage first (for persistence across sessions)
      const token = localStorage.getItem("authToken");
      const user = localStorage.getItem("currentUser");

      if (token && user) {
        try {
          const userData = JSON.parse(user);
          setCurrentUser(userData);
          setAuthToken(token);
          setIsAuthenticated(true);
          
          // Set token in window for Dashboard component
          window.authToken = token;
        } catch (error) {
          console.error("Error parsing user data:", error);
          // Clear corrupted data
          localStorage.removeItem("authToken");
          localStorage.removeItem("currentUser");
          window.authToken = null;
        }
      }
      setLoading(false);
    };

    checkAuthStatus();
  }, []);

  // Handle successful login
  const handleLoginSuccess = (user, token) => {
    console.log("Login successful:", user);
    
    // Create user object with token for Dashboard
    const userWithToken = {
      ...user,
      token: token
    };
    
    setCurrentUser(userWithToken);
    setAuthToken(token);
    setIsAuthenticated(true);

    // Store in localStorage for persistence
    localStorage.setItem("authToken", token);
    localStorage.setItem("currentUser", JSON.stringify(user));
    
    // Set token in window for Dashboard component
    window.authToken = token;
  };

  // Handle logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setAuthToken(null);
    
    // Clear localStorage
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUser");
    
    // Clear window token
    window.authToken = null;
  };

  // Loading screen while checking auth status
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <div style={styles.loadingText}>Loading application...</div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div>
      {isAuthenticated ? (
        <Dashboard 
          user={currentUser} 
          onLogout={handleLogout}
        />
      ) : (
        <AuthForm 
          onLoginSuccess={handleLoginSuccess}
        />
      )}
    </div>
  );
}

const styles = {
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },
  loadingSpinner: {
    width: "40px",
    height: "40px",
    border: "4px solid rgba(255, 255, 255, 0.3)",
    borderTop: "4px solid white",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: "20px",
  },
  loadingText: {
    color: "white",
    fontSize: "18px",
    margin: 0,
  },
};

export default App;