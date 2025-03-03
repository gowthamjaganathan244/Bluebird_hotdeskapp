import React from 'react';

const Footer = () => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-sm">
      <div className="container mx-auto">
        <div className="px-4 h-14 flex items-center justify-between">
          <span className="text-sm text-gray-700">
            © 2025 Bluebird Advisory
          </span>
          <div className="hidden sm:flex items-center space-x-6">
            <a href="#" className="text-sm text-gray-600 hover:text-gray-900">
              Privacy Policy
            </a>
            <a href="#" className="text-sm text-gray-600 hover:text-gray-900">
              Terms of Service
            </a>
            <a href="#" className="text-sm text-gray-600 hover:text-gray-900">
              Contact
            </a>
            <a href="#" className="text-sm text-gray-600 hover:text-gray-900">
              Support
            </a>
          </div>
          <div className="flex sm:hidden space-x-4">
            <a href="#" className="text-sm text-gray-600 hover:text-gray-900">
              Help
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;