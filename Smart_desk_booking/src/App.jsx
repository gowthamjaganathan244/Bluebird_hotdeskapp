import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";

// Components
import Header from "./components/Header";
import Footer from "./components/Footer";

// Pages
import Login from "./pages/Login";
import Home from "./pages/Home";
import Booking from "./pages/Booking";
import CheckIn from "./pages/CheckIn";
import Reports from "./pages/Reports";
import AdminDashboard from "./pages/AdminDashboard";

// Wrapper component to access location
const AppContent = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === "/";
  
  // Load theme from localStorage on mount
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  // Toggle theme and save to localStorage
  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const newTheme = !prev;
      localStorage.setItem("theme", newTheme ? "dark" : "light");
      return newTheme;
    });
  };

  // Apply theme on mount & when toggled
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  return (
    <div className="flex flex-col min-h-screen w-full">
      {/* Header - Hide on login page */}
      {!isLoginPage && <Header toggleTheme={toggleTheme} isDarkMode={isDarkMode} />}

      {/* Main Content */}
      <main className={`flex-1 ${!isLoginPage ? 'pt-20 pb-16' : ''} bg-[#f9fafb] dark:bg-[#0f1420] flex justify-center items-center`}>
        <div className="container mx-auto px-4 w-full max-w-screen-lg">
          <Routes>
            <Route path="/" element={<Login isDarkMode={isDarkMode} toggleTheme={toggleTheme} />} />
            <Route path="/home" element={<Home />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/check-in" element={<CheckIn />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            
            {/* Redirect unknown routes to login */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </main>

      {/* Footer - Hide on login page */}
      {!isLoginPage && <Footer />}
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;