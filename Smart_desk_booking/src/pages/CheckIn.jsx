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
  const [checkOutTime, setCheckOutTime] = useState("");
  const [checkOutLoading, setCheckOutLoading] = useState(false);

  // Extract user details from the MSAL account.
  const userEmail = user?.username || "";
  const userName = user?.name || user?.displayName || "";

  // Today's date in YYYY-MM-DD format
  // local date in ISO‑style “YYYY‑MM‑DD”
  const today = new Date().toLocaleDateString("en-CA"); 
// “en‑CA” gives 2025‑04‑19 (year‑month‑day) in your locale

  
  // On first load (or when the user changes), check if the user has already checked in today.
  useEffect(() => {
    if (user) {
      checkIfAlreadyCheckedIn();
    }
  }, [user, today]);
  
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
      // Reset check-in status and check-out time
      setCheckedIn(false);
      setCheckOutTime(""); // ✅ Clear previous value
  
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
  
      if (Array.isArray(data) && data.length > 0) {
        // Properly filter for check-ins that exactly match today's date
        const todayCheckins = data.filter((checkin) => {
          const checkinDate = String(checkin.Date || checkin.date).trim();
          const todayDate = String(today).trim();
          
          console.log(`Comparing dates: "${checkinDate}" vs "${todayDate}"`);
          
          // Exact string comparison to ensure we only match today's date
          return checkinDate === todayDate;
        });
  
        console.log("Today's check-ins after filtering:", todayCheckins);
        
        if (todayCheckins.length > 0) {
          setCheckedIn(true);
          setCheckOutTime(todayCheckins[0].CheckOutTime || ""); // ✅ Set Check-out Time here
          console.log("Check-out time found:", todayCheckins[0].CheckOutTime);
        } else {
          setCheckedIn(false);
          setCheckOutTime("");
          console.log("No check-ins found for today's date");
        }
      } else {
        console.log("No check-ins found or invalid response");
        setCheckedIn(false);
        setCheckOutTime("");
      }
    } catch (err) {
      console.error("❌ Failed to check check-in status:", err);
      setCheckedIn(false);
      setCheckOutTime("");
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

      // Use an integer value (0) instead of an empty string for DeskID when not in office
      const deskIDValue = 
        location === "Office" && booking && booking.DeskID ? 
        parseInt(booking.DeskID, 10) : 
        0;

      // Create the payload with DeskID as an integer
      const payload = {
        DeskID: deskIDValue,
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

  // Handle the check-out request
  const handleCheckOut = async () => {
    setErrorMessage("");
    setCheckOutLoading(true);
    
    try {
      // Create payload for checkout
      const payload = {
        Email: userEmail,
        User: userName || userEmail,
        Date: today,
        Action: "CheckOut" // Add an action field to differentiate this from check-in
      };

      console.log("Submitting check-out with payload:", payload);

      // You'll need to replace this URL with your actual Power Automate flow URL for checkout
      // For now, we're using the same endpoint as check-in but with the Action field to differentiate
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
        // Update checkout time with current time
        const currentTimeStr = new Date().toLocaleTimeString("en-AU", {hour: '2-digit', minute: '2-digit'});
        setCheckOutTime(currentTimeStr);
        console.log("Check-out successful");
      } else {
        // Extract error message if available
        const errorMsg = responseData?.error?.message || 
                        responseData?.message || 
                        `Check-out failed with status ${res.status}`;
        
        console.error("Check-out failed:", errorMsg);
        setErrorMessage(errorMsg);
        alert("❌ Check-out failed. Please try again.");
      }
    } catch (err) {
      console.error("❌ Check-out error:", err);
      setErrorMessage(`Error: ${err.message}`);
      alert("❌ Something went wrong during check-out.");
    }
    setCheckOutLoading(false);
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
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md mb-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-800 dark:text-gray-200 mb-2">
                <span className="font-medium">Date:</span> {booking.Date}
              </p>
              <p className="text-gray-800 dark:text-gray-200">
                <span className="font-medium">Desk:</span> Desk {booking.DeskID}
              </p>
            </div>
            <div className="text-teal-600 dark:text-teal-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
          </div>

          <button
            onClick={() => handleCheckIn(booking)}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center"
            disabled={loading}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Checking In...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Check In Now
              </>
            )}
          </button>
        </div>
      ));
    } else {
      return (
        <div className="bg-yellow-50 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 p-5 rounded-xl mb-4 border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-medium mb-2">No desk bookings found for today</p>
              <p className="text-sm mb-4">You can still check in to the office without a desk booking.</p>
            </div>
          </div>
          <button
            onClick={() => handleCheckIn(null)}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center mt-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Checking In...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Check In to Office
              </>
            )}
          </button>
        </div>
      );
    }
  };

  // Icons for different locations
  const locationIcons = {
    "Office": (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    "Work From Home": (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    "Client location": (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
          Office Check-In/Out
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {currentTime.toLocaleDateString("en-AU", {
            weekday: "long",
            year: "numeric",
            month: "short",
            day: "numeric",
          })}{" "}
          • {currentTime.toLocaleTimeString("en-AU", {hour: '2-digit', minute: '2-digit'})}
        </p>
      </div>

      {/* Display User Info */}
      <div className="mb-6 bg-blue-50 dark:bg-blue-900/30 p-4 rounded-xl border border-blue-200 dark:border-blue-800 flex items-center">
        <div className="bg-blue-100 dark:bg-blue-800 rounded-full p-2 mr-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-700 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div>
          <p className="text-blue-800 dark:text-blue-200 font-medium">{userName || "Not available"}</p>
          <p className="text-blue-600 dark:text-blue-300 text-sm">{userEmail || ""}</p>
        </div>
      </div>

      {/* Refresh button */}
      <div className="flex justify-end mb-4">
        <button 
          onClick={refreshStatus}
          className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 py-2 px-3 rounded-lg text-sm transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Display error message if any */}
      {errorMessage && (
        <div className="bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-200 p-4 rounded-lg mb-6 border border-red-200 dark:border-red-800 flex items-start">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}

      {checkedIn ? (
        <div className="bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-200 p-6 rounded-xl border border-green-200 dark:border-green-800 text-center">
          <div className="flex justify-center mb-3">
            <div className="bg-green-100 dark:bg-green-800 rounded-full p-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-600 dark:text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h3 className="text-xl font-semibold mb-2">You're Checked In!</h3>
<p>You have successfully checked in for today.</p>

{checkOutTime && (
  <p className="mt-2 text-green-700 dark:text-green-300">
    <strong>Check-out Time:</strong>{" "}
    {new Date(checkOutTime).toLocaleTimeString("en-AU", {
      hour: "2-digit",
      minute: "2-digit",
    })}
  </p>)}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md mb-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Check In for Today</h2>
          
          <div className="mb-5">
            <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
              Where are you working from today?
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button 
                onClick={() => setLocation("Office")}
                className={`flex flex-col items-center justify-center p-4 rounded-lg border ${
                  location === "Office" 
                    ? "bg-teal-50 dark:bg-teal-900/30 border-teal-300 dark:border-teal-700 text-teal-800 dark:text-teal-300" 
                    : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <div className={`p-2 rounded-full mb-2 ${
                  location === "Office" 
                    ? "bg-teal-100 dark:bg-teal-800 text-teal-600 dark:text-teal-300" 
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                }`}>
                  {locationIcons["Office"]}
                </div>
                <span className="text-sm">Office</span>
              </button>
              
              <button 
                onClick={() => setLocation("Work From Home")}
                className={`flex flex-col items-center justify-center p-4 rounded-lg border ${
                  location === "Work From Home" 
                    ? "bg-teal-50 dark:bg-teal-900/30 border-teal-300 dark:border-teal-700 text-teal-800 dark:text-teal-300" 
                    : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <div className={`p-2 rounded-full mb-2 ${
                  location === "Work From Home" 
                    ? "bg-teal-100 dark:bg-teal-800 text-teal-600 dark:text-teal-300" 
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                }`}>
                  {locationIcons["Work From Home"]}
                </div>
                <span className="text-sm">Home</span>
              </button>
              
              <button 
                onClick={() => setLocation("Client location")}
                className={`flex flex-col items-center justify-center p-4 rounded-lg border ${
                  location === "Client location" 
                    ? "bg-teal-50 dark:bg-teal-900/30 border-teal-300 dark:border-teal-700 text-teal-800 dark:text-teal-300" 
                    : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <div className={`p-2 rounded-full mb-2 ${
                  location === "Client location" 
                    ? "bg-teal-100 dark:bg-teal-800 text-teal-600 dark:text-teal-300" 
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                }`}>
                  {locationIcons["Client location"]}
                </div>
                <span className="text-sm">Client</span>
              </button>
            </div>
          </div>

          {/* When "Client location" is selected, show the client details input */}
          {location === "Client location" && (
            <div className="mb-5">
              <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
                Client details:
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <input
                  type="text"
                  className="w-full pl-10 pr-3 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="e.g., ABC Corporation"
                  value={clientLocation}
                  onChange={(e) => setClientLocation(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Render desk details for Office location */}
          {renderDeskDetails()}

          {/* Check-in button for Work From Home and Client location */}
          {location && (location === "Work From Home" || location === "Client location") && (
            <button
              onClick={() => handleCheckIn(null)}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center mt-4"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Checking In...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Check In Now
                </>
              )}
            </button>
          )}
        </div>
      )}

      
      
    </div>
  );
};

export default CheckIn;