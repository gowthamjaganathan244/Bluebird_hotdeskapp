import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar, Line } from "react-chartjs-2";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import { useMsal } from "@azure/msal-react";
import { Client } from "@microsoft/microsoft-graph-client";
import "react-big-calendar/lib/css/react-big-calendar.css";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Setup calendar localizer
const localizer = momentLocalizer(moment);

// Consistent theme colors
const themeColors = {
  primary: "#4F46E5", // Indigo
  primaryLight: "rgba(79, 70, 229, 0.1)",
  secondary: "#6366F1", // Slightly lighter indigo
  accent: "#8B5CF6", // Purple
  accentLight: "rgba(139, 92, 246, 0.6)",
  success: "#10B981", // Emerald
  text: {
    primary: "#1F2937", // Gray-800
    secondary: "#6B7280", // Gray-500
    light: "#9CA3AF" // Gray-400
  },
  background: {
    card: "#FFFFFF",
    page: "#F9FAFB", // Gray-50
    dark: "#111827" // Gray-900
  }
};

const Reports = () => {
  const { instance, accounts } = useMsal();
  const user = accounts[0];
  
  const [calendarEvents, setCalendarEvents] = useState([]);
  
  // State for charts
  const [deskUsageChartData, setDeskUsageChartData] = useState(null);
  const [deskUsageOptions, setDeskUsageOptions] = useState({});
  const [bookingTrendChartData, setBookingTrendChartData] = useState(null);
  const [bookingTrendOptions, setBookingTrendOptions] = useState({});
  
  const [isLoading, setIsLoading] = useState(true);
  const [bookingsByDay, setBookingsByDay] = useState({});
  
  // State for date filtering
  const [selectedDate, setSelectedDate] = useState(null);
  
  // Function to fetch all bookings
  const fetchAllBookings = async () => {
    try {
      // Using current user's email to get data
      const email = user?.username || "user@example.com";
      
      const res = await fetch("https://prod-09.australiaeast.logic.azure.com:443/workflows/5d1396dd50a74f5ba68f3f451090b631/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=yDj_geU7D-qqzflrhxS_i_8St483g34mh0RSaHOZZFw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email })
      });
  
      const data = await res.json();
      return data || [];
    } catch (err) {
      console.error("❌ Failed to fetch all bookings:", err);
      return [];
    }
  };
  
  // Function to fetch bookings for a specific date
  const fetchBookingsForDate = async (dateStr) => {
    try {
      const res = await fetch("https://prod-12.australiaeast.logic.azure.com:443/workflows/44e2e53e4cb943d1a5a6b234d5edfb9d/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=Im6MOrEDXrgSbi9CVi5H60uUlmom-SUBQvIRBfenkc4", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateStr })
      });
      const data = await res.json();
      return data || [];
    } catch (err) {
      console.error(`❌ Failed to fetch bookings for ${dateStr}:`, err);
      return [];
    }
  };

  // Load trend data on component mount
  useEffect(() => {
    const loadReportData = async () => {
      setIsLoading(true);
      
      // 1. Fetch all bookings (needed for proper data context)
      const allBookings = await fetchAllBookings();
      
      if (allBookings.length === 0) {
        setIsLoading(false);
        return;
      }
      
      // 2. Fetch data for booking trends (last 5 weekdays)
      const today = new Date();
      let weekdayCount = 0;
      let dayIndex = 0;
      const weekdayLabels = [];
      const dailyBookingCounts = [];
      const bookingsPerDay = {};
      
      // We need 5 weekdays, so keep going until we have 5
      while (weekdayCount < 5) {
        const date = new Date(today);
        date.setDate(today.getDate() - dayIndex);
        dayIndex++;
        
        // Skip weekends (0 = Sunday, 6 = Saturday)
        const dayOfWeek = date.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          continue;
        }
        
        weekdayCount++;
        const dateStr = date.toISOString().split('T')[0];
        
        // Add weekday name to labels
        const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
        weekdayLabels.unshift(weekday); // Add at beginning to show oldest first
        
        // Fetch bookings for this date
        const dailyBookings = await fetchBookingsForDate(dateStr);
        dailyBookingCounts.unshift(dailyBookings.length);
        
        // Store the bookings with user info for tooltips
        bookingsPerDay[weekday] = dailyBookings.map(booking => {
          return booking.User || (booking.UserEmail ? booking.UserEmail.split('@')[0] : 'Unknown');
        });
      }
      
      setBookingsByDay(bookingsPerDay);
      
      // Set booking trend chart data and options separately
      setBookingTrendChartData({
        labels: weekdayLabels,
        datasets: [
          {
            label: "Total Bookings",
            data: dailyBookingCounts,
            borderColor: themeColors.primary,
            backgroundColor: `${themeColors.primary}33`, // Adding 33 for 20% opacity
            tension: 0.3,
          },
        ]
      });
      
      setBookingTrendOptions({
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              precision: 0
            }
          }
        },
        plugins: {
          legend: {
            labels: {
              font: {
                family: "'Inter', 'Helvetica', 'Arial', sans-serif"
              }
            }
          },
          tooltip: {
            callbacks: {
              afterLabel: function(context) {
                const day = context.label;
                const users = bookingsPerDay[day] || [];
                if (users.length === 0) return '';
                
                return 'Booked by: ' + users.join(', ');
              }
            }
          }
        }
      });
      
      // 4. Fetch calendar events (from the original code)
      try {
        const accessToken = await instance.acquireTokenSilent({
          scopes: ["Calendars.Read"],
          account: accounts[0],
        });

        const client = Client.init({
          authProvider: (done) => done(null, accessToken.accessToken),
        });

        const res = await client
          .api("/me/events")
          .select("subject,start,end")
          .orderby("start/dateTime")
          .top(50)
          .get();

        const formattedEvents = res.value.map((event) => ({
          title: event.subject || "No title",
          start: new Date(event.start.dateTime),
          end: new Date(event.end.dateTime),
        }));

        setCalendarEvents(formattedEvents);
      } catch (error) {
        console.error("❌ Error fetching calendar events:", error);
      }
      
      setIsLoading(false);
    };

    loadReportData();
  }, [instance, accounts, user?.username]);

  // Load desk usage data for the selected date
  useEffect(() => {
    const loadDeskUsageForDate = async () => {
      if (!selectedDate) return;
      
      setIsLoading(true);

      const bookings = await fetchBookingsForDate(selectedDate);
      
      const deskCounts = {};
      const deskUserMap = {};

      bookings.forEach(booking => {
        const user = booking.User || (booking.UserEmail?.split('@')[0] || "Unknown");
        const deskId = String(booking.DeskID || "Unknown");

        deskCounts[deskId] = (deskCounts[deskId] || 0) + 1;
        if (!deskUserMap[deskId]) deskUserMap[deskId] = new Set();
        deskUserMap[deskId].add(user);
      });

      const sortedDesks = Object.keys(deskCounts).sort((a, b) => deskCounts[b] - deskCounts[a]);

      setDeskUsageChartData({
        labels: sortedDesks.map(id => `Desk ${id}`),
        datasets: [{
          label: `Bookings on ${selectedDate}`,
          data: sortedDesks.map(id => deskCounts[id]),
          backgroundColor: themeColors.accentLight
        }]
      });

      setDeskUsageOptions({
        responsive: true,
        scales: {
          y: { 
            beginAtZero: true, 
            ticks: { 
              stepSize: 1, 
              precision: 0 
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          x: {
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          }
        },
        plugins: {
          legend: {
            labels: {
              font: {
                family: "'Inter', 'Helvetica', 'Arial', sans-serif"
              }
            }
          },
          tooltip: {
            callbacks: {
              afterLabel: (ctx) => {
                const deskId = sortedDesks[ctx.dataIndex];
                const users = Array.from(deskUserMap[deskId] || []);
                return users.length ? "Booked by: " + users.join(', ') : '';
              }
            }
          }
        }
      });

      setIsLoading(false);
    };

    loadDeskUsageForDate();
  }, [selectedDate]);

  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Reports & Analytics
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-3xl">
            View detailed insights on desk bookings and occupancy trends.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading data...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            {/* Desk Usage Chart with Date Filter */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center flex-wrap gap-4">
                <h3 className="text-lg font-medium text-gray-800 dark:text-white">
                  Desk Usage Frequency
                </h3>
                <div className="flex items-center gap-3">
                  <label className="text-sm text-gray-600 dark:text-gray-400">
                    Date:
                  </label>
                  <input
                    type="date"
                    value={selectedDate || ""}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-3 py-1.5 text-sm text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
              
              <div className="p-6">
                {!selectedDate ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 max-w-xs">
                      Select a date to view desk booking data for that day
                    </p>
                  </div>
                ) : deskUsageChartData && deskUsageChartData.labels.length > 0 ? (
                  <div className="h-80">
                    <Bar data={deskUsageChartData} options={deskUsageOptions} />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">
                      No desk bookings found for {selectedDate}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Booking Trends */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-800 dark:text-white">
                  Booking Trends (Last 5 Workdays)
                </h3>
              </div>
              
              <div className="p-6">
                {bookingTrendChartData ? (
                  <div className="h-80">
                    <Line 
                      data={bookingTrendChartData} 
                      options={bookingTrendOptions} 
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">
                      No booking trend data available
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Calendar View */}
            
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;