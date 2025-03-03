import React, { useState } from "react";
import { FaUserCog, FaChair, FaClipboardList, FaChartBar, FaBell, FaSearch, FaSignOutAlt } from "react-icons/fa";
import { MdSpaceDashboard } from "react-icons/md";

// Data moved outside component for better organization
const dashboardData = {
  stats: [
    { id: 1, label: 'Total Bookings', value: '156', increase: '+12%' },
    { id: 2, label: 'Active Users', value: '892', increase: '+5%' },
    { id: 3, label: 'Available Desks', value: '45', increase: '-2%' },
    { id: 4, label: 'Utilization Rate', value: '78%', increase: '+8%' }
  ],
  recentBookings: [
    { id: 1, user: 'John Smith', desk: 'A-101', date: '2025-02-23', status: 'Active' },
    { id: 2, user: 'Sarah Johnson', desk: 'B-205', date: '2025-02-24', status: 'Pending' },
    { id: 3, user: 'Mike Brown', desk: 'C-304', date: '2025-02-25', status: 'Completed' }
  ],
  navItems: [
    { 
      id: 'dashboard', 
      label: 'Manage Bookings', 
      icon: FaClipboardList, 
      color: 'blue',
      description: 'View and update desk reservations.'
    },
    { 
      id: 'desks', 
      label: 'Manage Desks', 
      icon: FaChair, 
      color: 'yellow',
      description: 'Add, edit, or remove desks.'
    },
    { 
      id: 'users', 
      label: 'Manage Users', 
      icon: FaUserCog, 
      color: 'red',
      description: 'Control user access and roles.'
    },
    { 
      id: 'reports', 
      label: 'View Reports', 
      icon: FaChartBar, 
      color: 'green',
      description: 'Analyze desk usage trends.'
    }
  ]
};

// Sidebar Component
const Sidebar = ({ activeSection, onSectionChange }) => {
  const getNavItemClasses = (item) => {
    const baseClasses = "flex items-center text-gray-700 dark:text-gray-300";
    const hoverClasses = `hover:text-${item.color}-600 dark:hover:text-${item.color}-400`;
    const activeClasses = activeSection === item.id ? 
      `text-${item.color}-600 dark:text-${item.color}-400` : '';
    
    return `${baseClasses} ${hoverClasses} ${activeClasses}`;
  };

  return (
    <aside className="w-64 bg-white dark:bg-[#1a1f2e] shadow-lg p-6 hidden md:flex flex-col overflow-y-auto">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
        <MdSpaceDashboard className="mr-2 text-blue-500" /> Admin Dashboard
      </h2>
      <nav className="space-y-4 flex-1">
        {dashboardData.navItems.map(item => (
          <a
            key={item.id}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onSectionChange(item.id);
            }}
            className={getNavItemClasses(item)}
          >
            <item.icon className="mr-3" /> {item.label}
          </a>
        ))}
      </nav>
      <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
        <a
          href="#"
          onClick={(e) => e.preventDefault()}
          className="flex items-center text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
        >
          <FaSignOutAlt className="mr-3" /> Logout
        </a>
      </div>
    </aside>
  );
};

// Header Component
const Header = () => (
  <div className="bg-white dark:bg-[#1a1f2e] p-4 shadow-md flex justify-between items-center">
    <div className="relative">
      <input
        type="text"
        placeholder="Search..."
        className="pl-10 pr-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <FaSearch className="absolute left-3 top-3 text-gray-400" />
    </div>
    <div className="flex items-center space-x-4">
      <button className="relative p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
        <FaBell className="text-xl" />
        <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
      </button>
      <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
        AS
      </div>
    </div>
  </div>
);

// Stat Card Component
const StatCard = ({ label, value, increase }) => (
  <div className="bg-white dark:bg-[#1a1f2e] p-6 rounded-lg shadow-md">
    <h3 className="text-sm text-gray-500 dark:text-gray-400">{label}</h3>
    <div className="flex items-center mt-2">
      <span className="text-2xl font-bold text-gray-900 dark:text-white">{value}</span>
      <span className={`ml-2 text-sm ${increase.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
        {increase}
      </span>
    </div>
  </div>
);

// Action Card Component
const ActionCard = ({ item }) => {
  // Pre-defined color classes to avoid dynamic class issues with Tailwind
  const bgColorMap = {
    blue: "bg-blue-600",
    yellow: "bg-yellow-600",
    red: "bg-red-600",
    green: "bg-green-600"
  };

  return (
    <div className={`${bgColorMap[item.color]} text-white p-6 rounded-lg shadow-md flex items-center`}>
      <item.icon className="text-3xl mr-4" />
      <div>
        <h3 className="text-lg font-semibold">{item.label}</h3>
        <p className="text-sm">{item.description}</p>
      </div>
    </div>
  );
};

// Bookings Table Component
const BookingsTable = ({ bookings }) => {
  const getStatusClass = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white dark:bg-[#1a1f2e] rounded-lg shadow-md">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Bookings</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Desk</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {bookings.map((booking) => (
              <tr key={booking.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{booking.user}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{booking.desk}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{booking.date}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusClass(booking.status)}`}>
                    {booking.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Dashboard Content Component
const DashboardContent = () => (
  <>
    {/* Stats Section */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {dashboardData.stats.map(stat => (
        <StatCard key={stat.id} {...stat} />
      ))}
    </div>

    {/* Action Cards Section */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {dashboardData.navItems.map(item => (
        <ActionCard key={item.id} item={item} />
      ))}
    </div>

    {/* Recent Bookings Table */}
    <BookingsTable bookings={dashboardData.recentBookings} />
  </>
);

// Generic Section Component for "under development" sections
const GenericSection = ({ title }) => (
  <div>
    <h2 className="text-2xl font-semibold mb-4">{title}</h2>
    <p>This section is under development.</p>
  </div>
);

// Content Renderer Component
const ContentRenderer = ({ activeSection }) => {
  // Map section IDs to their respective titles for generic sections
  const sectionTitles = {
    desks: "Manage Desks",
    users: "Manage Users",
    reports: "View Reports"
  };

  if (activeSection === 'dashboard') {
    return <DashboardContent />;
  }
  
  return <GenericSection title={sectionTitles[activeSection]} />;
};

// Main AdminDashboard Component
const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState('dashboard');

  return (
    <div className="flex min-h-screen bg-[#f9fafb] dark:bg-[#0f1420]">
      {/* Sidebar */}
      <Sidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection} 
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <Header />
        <div className="p-6">
          <ContentRenderer activeSection={activeSection} />
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;