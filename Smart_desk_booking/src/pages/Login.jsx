import React, { useState, useEffect } from 'react';
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../authConfig";
import companyLogo from '../assets/bluebird.png';
import { useNavigate } from 'react-router-dom';

const Login = ({ isDarkMode, toggleTheme }) => {
  const { instance, accounts } = useMsal();
  const navigate = useNavigate();
  
  // Check if user is already signed in
  useEffect(() => {
    if (accounts.length > 0) {
      // User is already signed in, redirect to home
      navigate('/home');
    }
  }, [accounts, navigate]);

  const handleLogin = async () => {
    try {
      // Use MSAL instance to handle login
      console.log("Initiating Microsoft authentication flow...");
      await instance.loginRedirect(loginRequest);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  return (
    <div className={`flex items-center justify-center min-h-screen px-4 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Dark mode toggle button - positioned at top right */}
      <button 
        className={`absolute top-4 right-4 p-2 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} transition-colors duration-200`}
        onClick={toggleTheme}
        aria-label="Toggle dark mode"
      >
        {isDarkMode ? (
          <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
      </button>

      <div className={`w-full max-w-md sm:max-w-lg md:max-w-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl shadow-lg transition-all duration-300 transform hover:scale-105 mx-auto`}>
        <div className="p-4 sm:p-6 md:p-8 flex flex-col items-center">
          {/* Company logo centered - responsive sizing */}
          <div className="flex flex-col items-center justify-center mb-4 sm:mb-6 md:mb-8 animate-fadeIn">
            <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 mb-2">
              {/* Company logo with responsive sizing */}
              <img 
                src={companyLogo} 
                alt="Bluebird Logo" 
                className="w-full h-full object-contain" 
              />
            </div>
            <div className={`text-center mt-2 animate-fadeIn ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              <h1 className="text-xl sm:text-2xl font-bold mb-1">Bluebird</h1>
              <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Desk Booking</p>
            </div>
          </div>
          
          {/* Sign in button with animation - responsive padding */}
          <button
            onClick={handleLogin}
            className={`w-full flex items-center justify-center gap-2 sm:gap-3
                    ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#0f1420] hover:bg-[#0f1420]/90'}
                    text-white py-2 sm:py-3 px-3 sm:px-4 rounded-lg 
                    transition-all duration-300 transform hover:translate-y-1
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M0 0h11.377v11.372H0zm12.623 0H24v11.372H12.623zM0 12.623h11.377V24H0zm12.623 0H24V24H12.623" />
            </svg>
            <span className="text-sm sm:text-base md:text-[16px] font-normal">Sign in with Microsoft</span>
          </button>
        </div>
      </div>

      {/* Add custom animation styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out forwards;
        }
        
        /* Add media queries for responsive design */
        @media (max-width: 640px) {
          .animate-fadeIn {
            animation-duration: 0.6s;
          }
        }
      `}</style>
    </div>
  );
};

export default Login;