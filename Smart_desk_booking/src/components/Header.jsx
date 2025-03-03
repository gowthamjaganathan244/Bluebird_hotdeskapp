import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import companyLogo from '../assets/bluebird.png';

const Header = ({ isDarkMode, toggleTheme, isLoggedIn = true, logoutUser = () => console.log('Logout clicked'), userName = "User" }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b bg-white shadow-sm">
      <div className="container mx-auto">
        <nav className="flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center space-x-2">
            <img
              src={companyLogo}
              alt="Bluebird Logo"
              className="w-12 h-12 text-blue-500 flex-shrink-0"
            />
            <h1 className="text-3xl font-bold" style={{ color: '#0C184F' }}>Bluebird</h1>
          </Link>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={toggleTheme}
                className={`
                  relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full 
                  border-2 border-transparent transition-colors duration-200 ease-in-out
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  ${isDarkMode ? 'bg-blue-500' : 'bg-gray-200'}
                `}
                role="switch"
                aria-checked={isDarkMode}
              >
                <span className="sr-only">Toggle dark mode</span>
                <span
                  className={`
                    pointer-events-none inline-block h-5 w-5 transform rounded-full 
                    bg-white shadow ring-0 transition duration-200 ease-in-out
                    ${isDarkMode ? 'translate-x-5' : 'translate-x-0'}
                  `}
                />
              </button>
            </div>
            
            <div className="relative" ref={dropdownRef}>
              {isLoggedIn ? (
                <>
                  <button
                    onClick={toggleDropdown}
                    className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 focus:outline-none"
                    type="button"
                    aria-expanded={isDropdownOpen}
                    aria-haspopup="true"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center">
                      <span className="font-medium text-sm">{userName.charAt(0).toUpperCase()}</span>
                    </div>
                    <span className="font-medium hidden sm:inline">{userName}</span>
                    <svg 
                      className="w-4 h-4" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 py-1 z-10">
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        Your Profile
                      </Link>
                      <Link
                        to="/admin"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        Admin Login
                      </Link>
                      <button
                        onClick={() => {
                          logoutUser();
                          setIsDropdownOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <span className="font-medium hidden sm:inline">Sign In</span>
                </Link>
              )}
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;