import React, { useEffect, useState } from "react";
import { useMsal } from "@azure/msal-react";

const CheckIn = () => {
  const { accounts } = useMsal();
  const user = accounts[0];
  const [todayBookings, setTodayBookings] = useState([]);
  const [location, setLocation] = useState("");
  const [checkedIn, setCheckedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Get user details from MSAL account
  const userEmail = user?.username || "";
  const userName = user?.name || user?.displayName || "";

  const today = new Date().toISOString().split("T")[0];
  
  useEffect(() => {
    if (user) {
      fetchTodayBookings();
      checkIfAlreadyCheckedIn();
    }
  }, [user]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchTodayBookings = async () => {
    try {
      const res = await fetch(
        "https://prod-09.australiaeast.logic.azure.com:443/workflows/5d1396dd50a74f5ba68f3f451090b631/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=yDj_geU7D-qqzflrhxS_i_8St483g34mh0RSaHOZZFw",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: userEmail }),
        }
      );
      const data = await res.json();
      console.log("Bookings API response:", data);
      const todayBooking = (data || []).filter(
        (b) => b.Date === today && b.Status !== "Checked In"
      );
      console.log("Today's active bookings:", todayBooking);
      setTodayBookings(todayBooking);
    } catch (err) {
      console.error("❌ Failed to fetch today bookings:", err);
    }
  };

  const checkIfAlreadyCheckedIn = async () => {
    try {
      // Reset checkedIn status first
      setCheckedIn(false);
      
      const payload = {
        UserEmail: userEmail,
        Date: today
      };
      
      console.log("Checking check-in status with payload:", payload);
      
      const res = await fetch("https://prod-16.australiaeast.logic.azure.com:443/workflows/acbe6899ac01418d955fb13f561b9dfc/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=wtyIFzF9tO2aSpBT0YbtyYj8baqrqIY06kA0mEV7hMY", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
  
      const data = await res.json();
      console.log("Check-in status API response:", data);
      
      // Only set as checked in if there's a valid check-in record for today
      if (Array.isArray(data) && data.length > 0) {
        // Check if any of the returned records match today's date exactly
        const todayCheckins = data.filter(checkin => {
          const checkinDate = checkin.Date || checkin.date;
          console.log(`Comparing: API date "${checkinDate}" with today "${today}"`);
          return checkinDate === today;
        });
        
        console.log("Today's check-ins found:", todayCheckins.length);
        setCheckedIn(todayCheckins.length > 0);
      } else {
        console.log("No check-ins found or invalid response");
        setCheckedIn(false);
      }
    } catch (err) {
      console.error("❌ Failed to check check-in status:", err);
      setCheckedIn(false);
    }
  };
  
  const handleCheckIn = async (booking) => {
    if (!location) {
      alert("Please enter your current location.");
      return;
    }

    setLoading(true);
    try {
      // Updated payload to match SharePoint list schema
      const payload = {
        DeskID: booking.DeskID,
        Email: booking.UserEmail,
        User: userName, // Using "User" field name to match SharePoint column
        Location: location,
        Date: today,
      };

      console.log("Submitting check-in with payload:", payload);

      const res = await fetch(
        "https://prod-04.australiaeast.logic.azure.com:443/workflows/a75f532d9a3245bd8ed975e741cc33e9/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=R40kYp3xkLou72fdz1g68xZCLymd0frwMCHmVAj98N8",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (res.ok) {
        setCheckedIn(true);
        setTodayBookings([]);
        console.log("Check-in successful");
      } else {
        const errorData = await res.text();
        console.error("Check-in failed with response:", errorData);
        alert("❌ Check-in failed. Please try again.");
      }
    } catch (err) {
      console.error("❌ Check-in error:", err);
      alert("❌ Something went wrong during check-in.");
    }
    setLoading(false);
  };

  // Force a refresh of check-in status
  const refreshStatus = () => {
    checkIfAlreadyCheckedIn();
    fetchTodayBookings();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
        Office Check-In
      </h1>

      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Today is{" "}
        {currentTime.toLocaleDateString("en-AU", {
          weekday: "long",
          year: "numeric",
          month: "short",
          day: "numeric",
        })}{" "}
        – {currentTime.toLocaleTimeString("en-AU")}
      </p>

      {/* User information display */}
      <div className="mb-4 bg-blue-50 dark:bg-blue-900 p-3 rounded-lg">
        <p className="text-blue-800 dark:text-blue-200">
          <strong>User:</strong> {userName || "Not available"}
        </p>
      </div>

      {/* Debug button - remove for production */}
      <button 
        onClick={refreshStatus}
        className="mb-4 bg-gray-200 hover:bg-gray-300 text-gray-800 py-1 px-3 rounded-md text-sm"
      >
        Refresh Status
      </button>

      {checkedIn ? (
        <div className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 p-4 rounded-lg">
          ✅ You have checked in successfully today.
        </div>
      ) : todayBookings.length > 0 ? (
        todayBookings.map((booking) => (
          <div
            key={booking.DeskID}
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md mb-6"
          >
            <p className="text-gray-800 dark:text-gray-200 mb-2">
              <strong>Date:</strong> {booking.Date}
            </p>
            <p className="text-gray-800 dark:text-gray-200 mb-2">
              <strong>Desk:</strong> Desk {booking.DeskID}
            </p>

            <label className="block text-gray-700 dark:text-gray-300 mb-1">
              Enter your current location:
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 rounded-md border dark:bg-gray-700 dark:text-white mb-4"
              placeholder="e.g., Office or Client – ABC Corp"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />

            <button
              onClick={() => handleCheckIn(booking)}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded-md"
              disabled={loading}
            >
              {loading ? "Checking In..." : "Check In Now"}
            </button>
          </div>
        ))
      ) : (
        <p className="text-gray-600 dark:text-gray-400">
          No active bookings found for today.
        </p>
      )}
    </div>
  );
};

export default CheckIn;