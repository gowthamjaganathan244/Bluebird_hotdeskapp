import React from 'react';

const Footer = () => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-md rounded-t-md backdrop-blur-sm bg-opacity-90">
      <div className="container mx-auto max-w-4xl">
        <div className="px-6 h-14 flex items-center justify-between">
          <span className="text-sm text-gray-700">
            © 2025 Bluebird Advisory
          </span>
          
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