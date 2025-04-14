import React, { useEffect, useState } from "react";
import { useMsal } from "@azure/msal-react";

const CheckIn = () => {
  const { accounts } = useMsal();
  const user = accounts[0];
  const [todayBookings, setTodayBookings] = useState([]);
  const [location, setLocation] = useState("");
  const [clientLocation, setClientLocation] = useState("");
  const [checkedIn, setCheckedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showDeskDetails, setShowDeskDetails] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Extract user details from the MSAL account.
  const userEmail = user?.username || "";
  const userName = user?.name || user?.displayName || "";

  // Today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];
  
  // On first load (or when the user changes), check if the user has already checked in today.
  useEffect(() => {
    if (user) {
      checkIfAlreadyCheckedIn();
    }
  }, [user]);
  
  // Update the current time every second for display.
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // When the user selects a location, if it's "Office", fetch desk bookings for today.
  useEffect(() => {
    if (location === "Office") {
      fetchTodayBookings();
      setShowDeskDetails(true);
    } else {
      setShowDeskDetails(false);
    }
    // Clear any previous error messages when changing location
    setErrorMessage("");
  }, [location]);

  // Fetch today's desk bookings from the backend service.
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
      // Filter out bookings for today that have not been checked in.
      const todayBooking = (data || []).filter(
        (b) => b.Date === today && b.Status !== "Checked In"
      );
      console.log("Today's active bookings:", todayBooking);
      setTodayBookings(todayBooking);
    } catch (err) {
      console.error("❌ Failed to fetch today bookings:", err);
      setErrorMessage("Failed to fetch bookings. Please try refreshing.");
    }
  };

  // Check whether the user has already checked in today.
  const checkIfAlreadyCheckedIn = async () => {
    try {
      // Reset the check-in status.
      setCheckedIn(false);
      
      const payload = {
        UserEmail: userEmail,
        Date: today
      };
      
      console.log("Checking check-in status with payload:", payload);
      
      const res = await fetch(
        "https://prod-16.australiaeast.logic.azure.com:443/workflows/acbe6899ac01418d955fb13f561b9dfc/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=wtyIFzF9tO2aSpBT0YbtyYj8baqrqIY06kA0mEV7hMY",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
  
      const data = await res.json();
      console.log("Check-in status API response:", data);
      
      // If records are returned, check for today's date in the response.
      if (Array.isArray(data) && data.length > 0) {
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
  
  // Handle the check-in request.
  const handleCheckIn = async (booking = null) => {
    // Clear previous error messages
    setErrorMessage("");
    
    // Validate that the user selected a location.
    if (!location) {
      alert("Please select your current location.");
      return;
    }

    // If the user has selected "Client location", ensure client details are provided.
    if (location === "Client location" && !clientLocation) {
      alert("Please enter the client location details.");
      return;
    }

    setLoading(true);
    try {
      // Set the location value. For a client location, append the client details.
      let locationValue = location;
      if (location === "Client location") {
        locationValue = `Client - ${clientLocation}`;
      }

      // FIXED: Use an integer value (0) instead of an empty string for DeskID when not in office
      // This matches the API schema which expects DeskID to be an integer
      const deskIDValue = 
        location === "Office" && booking && booking.DeskID ? 
        parseInt(booking.DeskID, 10) : // Ensure it's a number
        0; // Default to 0 when no desk is selected

      // Create the payload with DeskID as an integer
      const payload = {
        DeskID: deskIDValue, // Now this is always an integer
        Email: userEmail,
        User: userName || userEmail,
        Location: locationValue,
        Date: today
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

      // Get the response as text first to avoid JSON parsing errors
      const responseText = await res.text();
      console.log("Raw API response:", responseText);
      
      let responseData;
      try {
        // Try to parse as JSON if possible
        responseData = responseText ? JSON.parse(responseText) : {};
        console.log("Parsed API response data:", responseData);
      } catch (e) {
        console.log("Response is not JSON format:", responseText);
      }

      if (res.ok) {
        setCheckedIn(true);
        setTodayBookings([]);
        console.log("Check-in successful");
      } else {
        // Extract error message if available
        const errorMsg = responseData?.error?.message || 
                         responseData?.message || 
                         `Check-in failed with status ${res.status}`;
        
        console.error("Check-in failed:", errorMsg);
        setErrorMessage(errorMsg);
        alert("❌ Check-in failed. Please try again.");
      }
    } catch (err) {
      console.error("❌ Check-in error:", err);
      setErrorMessage(`Error: ${err.message}`);
      alert("❌ Something went wrong during check-in.");
    }
    setLoading(false);
  };

  // Function to force refresh the check-in and booking statuses.
  const refreshStatus = () => {
    checkIfAlreadyCheckedIn();
    if (location === "Office") {
      fetchTodayBookings();
    }
    // Clear any error messages
    setErrorMessage("");
  };

  // Render desk booking details if available (only for office check-ins).
  const renderDeskDetails = () => {
    if (!showDeskDetails) return null;

    if (todayBookings.length > 0) {
      return todayBookings.map((booking) => (
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

          <button
            onClick={() => handleCheckIn(booking)}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded-md"
            disabled={loading}
          >
            {loading ? "Checking In..." : "Check In Now"}
          </button>
        </div>
      ));
    } else {
      return (
        <div className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 p-4 rounded-lg mb-4">
          No desk bookings found for today. You can still check in to the office.
          <button
            onClick={() => handleCheckIn(null)}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded-md mt-4"
            disabled={loading}
          >
            {loading ? "Checking In..." : "Check In to Office"}
          </button>
        </div>
      );
    }
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

      {/* Display User Info */}
      <div className="mb-4 bg-blue-50 dark:bg-blue-900 p-3 rounded-lg">
        <p className="text-blue-800 dark:text-blue-200">
          <strong>User:</strong> {userName || "Not available"}
        </p>
      </div>

      {/* Debug: Refresh status button */}
      <button 
        onClick={refreshStatus}
        className="mb-4 bg-gray-200 hover:bg-gray-300 text-gray-800 py-1 px-3 rounded-md text-sm"
      >
        Refresh Status
      </button>

      {/* Display error message if any */}
      {errorMessage && (
        <div className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 p-4 rounded-lg mb-4">
          Error: {errorMessage}
        </div>
      )}

      {checkedIn ? (
        <div className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 p-4 rounded-lg">
          ✅ You have checked in successfully today.
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md mb-6">
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-1">
              Select your current location:
            </label>
            <select
              className="w-full px-4 py-2 rounded-md border dark:bg-gray-700 dark:text-white"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            >
              <option value="">Select location...</option>
              <option value="Office">Office</option>
              <option value="Work From Home">Work From Home</option>
              <option value="Client location">Client location</option>
            </select>
          </div>

          {/* When "Client location" is selected, show the client details input */}
          {location === "Client location" && (
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 mb-1">
                Client details:
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 rounded-md border dark:bg-gray-700 dark:text-white"
                placeholder="e.g., ABC Corporation"
                value={clientLocation}
                onChange={(e) => setClientLocation(e.target.value)}
              />
            </div>
          )}

          {/* Render desk details for Office location */}
          {renderDeskDetails()}

          {/* Check-in button for Work From Home and Client location */}
          {location && (location === "Work From Home" || location === "Client location") && (
            <button
              onClick={() => handleCheckIn(null)}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded-md"
              disabled={loading}
            >
              {loading ? "Checking In..." : "Check In Now"}
            </button>
          )}
        </div>
      )}

      {/* Add debug info section */}
      <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-900 rounded-lg text-xs text-gray-600 dark:text-gray-400">
        <details>
          <summary className="cursor-pointer">Debug Information</summary>
          <div className="mt-2">
            <p><strong>User Email:</strong> {userEmail || "Not available"}</p>
            <p><strong>User Name:</strong> {userName || "Not available"}</p>
            <p><strong>Current Date:</strong> {today}</p>
            <p><strong>Selected Location:</strong> {location || "None"}</p>
            <p><strong>Client Location:</strong> {clientLocation || "N/A"}</p>
            <p><strong>Check-in Status:</strong> {checkedIn ? "Checked In" : "Not Checked In"}</p>
          </div>
        </details>
      </div>
    </div>
  );
};

export default CheckIn;