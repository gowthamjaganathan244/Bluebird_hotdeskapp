import React from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate(); // Hook to handle navigation

  const handleLogin = () => {
    // Simulate authentication process (Replace with actual Microsoft SSO)
    console.log("User signed in successfully!");

    // Redirect to Home Page after login
    navigate("/home"); // ✅ Redirect to Home Page
  };

  return (
    <div className="flex items-center justify-center bg-gray-50 dark:bg-[#0f1420]">
      <div className="max-w-md w-full bg-white dark:bg-[#1a1f2e] rounded-3xl shadow-lg">
        <div className="p-8">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Welcome to Bluebird
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Sign in with your Microsoft account to continue
          </p>

          <button 
            onClick={handleLogin} // Handle sign-in
            className="w-full flex items-center justify-center gap-3
                       bg-[#0f1420] hover:bg-[#0f1420]/90
                       text-white py-3 px-4 rounded-lg transition-colors duration-200"
          >
            <svg 
              className="w-5 h-5" 
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              <path d="M0 0h11.377v11.372H0zm12.623 0H24v11.372H12.623zM0 12.623h11.377V24H0zm12.623 0H24V24H12.623" />
            </svg>
            <span className="text-[16px] font-normal">Sign in with Microsoft</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
