import React, { useState, useEffect } from "react";
import { FaMapMarkerAlt, FaCheck, FaClock, FaCalendarAlt, FaBuilding, FaLaptop, FaUsers, FaArrowLeft } from "react-icons/fa";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../authConfig";

const POWER_AUTOMATE_ENDPOINT = "https://prod-04.australiaeast.logic.azure.com:443/workflows/a75f532d9a3245bd8ed975e741cc33e9/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=R40kYp3xkLou72fdz1g68xZCLymd0frwMCHmVAj98N8";

const CheckIn = () => {
  const { instance, accounts } = useMsal();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [locationPermission, setLocationPermission] = useState("prompt");
  const [officeUsers, setOfficeUsers] = useState([]);
  const [showOfficeUsers, setShowOfficeUsers] = useState(false);
  const [checkInTime, setCheckInTime] = useState(null);
  const [userName, setUserName] = useState("");
  const [selectedDesk, setSelectedDesk] = useState("Desk 1");
  const [sessionSummary, setSessionSummary] = useState(null);

  // Get user information on load
  useEffect(() => {
    if (accounts && accounts.length > 0) {
      const currentUser = accounts[0];
      setUserName(currentUser.name || currentUser.username);
    }
  }, [accounts]);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Check if user is already checked in (simulate with localStorage)
  useEffect(() => {
    const checkStatus = async () => {
      if (!accounts || accounts.length === 0) return;
      setIsLoading(true);
      try {
        const savedCheckIn = localStorage.getItem('checkInStatus');
        if (savedCheckIn) {
          const checkInData = JSON.parse(savedCheckIn);
          if (checkInData.userId === accounts[0].homeAccountId) {
            setIsCheckedIn(true);
            setCheckInTime(new Date(checkInData.checkInTime));
            setLocation(checkInData.location);
            setAddress(checkInData.address);
            setSelectedDesk(checkInData.desk);
          }
        }
        fetchOfficeUsers();
      } catch (error) {
        console.error("Error checking status:", error);
      } finally {
        setIsLoading(false);
      }
    };
    checkStatus();
  }, [accounts]);

  // Format date for display
  const formatDate = (date) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(date).toLocaleDateString(undefined, options);
  };

  // Format time for display
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Helper to format relative time
  const formatRelativeTime = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    return new Date(date).toLocaleDateString();
  };

  // Fetch users currently in office (demo data)
  const fetchOfficeUsers = async () => {
    try {
      const demoUsers = [
        { id: '1', name: 'Alex Johnson', checkInTime: new Date(Date.now() - 3600000).toISOString(), location: 'Main Office, Floor 3' },
        { id: '2', name: 'Samantha Lee', checkInTime: new Date(Date.now() - 7200000).toISOString(), location: 'North Wing, Floor 4' },
        { id: '3', name: 'Raj Patel', checkInTime: new Date(Date.now() - 1800000).toISOString(), location: 'Conference Room B' }
      ];
      setOfficeUsers(demoUsers);
    } catch (error) {
      console.error("Error fetching office users:", error);
    }
  };

  // Request location permission and get location
  const requestLocation = () => {
    setIsLoading(true);
    setLocationError(null);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const locationData = {
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6),
            accuracy: Math.round(position.coords.accuracy)
          };
          setLocation(locationData);
          setLocationPermission("granted");
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${locationData.latitude}&lon=${locationData.longitude}&zoom=18&addressdetails=1`,
              { headers: { 'Accept-Language': 'en' } }
            );
            if (response.ok) {
              const addressData = await response.json();
              setAddress({
                display: addressData.display_name,
                building: addressData.address.building || addressData.address.house_number || 'Main Building',
                road: addressData.address.road || '',
                suburb: addressData.address.suburb || addressData.address.neighbourhood || '',
                city: addressData.address.city || addressData.address.town || addressData.address.village || '',
                state: addressData.address.state || '',
                postcode: addressData.address.postcode || '',
                country: addressData.address.country || ''
              });
            }
          } catch (error) {
            console.error("Error fetching address:", error);
          }
          setIsLoading(false);
        },
        (error) => {
          let errorMessage = "Location access was denied";
          if (error.code === error.PERMISSION_DENIED) {
            setLocationPermission("denied");
            errorMessage = "Please allow location access to enable quick check-in";
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            errorMessage = "Location information is unavailable";
          } else if (error.code === error.TIMEOUT) {
            errorMessage = "Location request timed out";
          }
          setLocationError(errorMessage);
          setIsLoading(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    } else {
      setLocationError("Geolocation is not supported by this browser");
      setIsLoading(false);
    }
  };

  // Handle check-in submission with corrected error handling
  const handleCheckIn = async () => {
    if (!accounts || accounts.length === 0) return;
    setIsLoading(true);
    const now = new Date();
    setCheckInTime(now);
    const payload = {
      checkInID: "001",
      user: userName,
      deskID: selectedDesk,
      checkInTime: now.toISOString(),
      // For demo, assuming a default 9-hour workday
      checkOutTime: new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString(),
      status: "Checked In"
    };

    try {
      const response = await fetch(POWER_AUTOMATE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Error ${response.status}: ${text}`);
      }
      const resultText = await response.text();
      console.log("Power Automate Response:", resultText);
      const checkInData = {
        userId: accounts[0].homeAccountId,
        userName: userName,
        checkInTime: now.toISOString(),
        location: location,
        address: address,
        desk: selectedDesk
      };
      localStorage.setItem('checkInStatus', JSON.stringify(checkInData));
      setOfficeUsers([...officeUsers, {
        id: accounts[0].homeAccountId,
        name: userName,
        checkInTime: now.toISOString(),
        location: address ? `${address.building}, ${address.road}` : 'Main Office'
      }]);
      setIsCheckedIn(true);
    } catch (error) {
      console.error("Error in check-in:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle check-out: record actual check-out time and show session summary
  const handleCheckOut = () => {
    setIsLoading(true);
    const now = new Date();
    setTimeout(() => {
      const summary = {
        checkInTime: checkInTime,
        checkOutTime: now,
        desk: selectedDesk
      };
      setSessionSummary(summary);
      localStorage.removeItem('checkInStatus');
      if (accounts && accounts.length > 0) {
        const updatedUsers = officeUsers.filter(user => user.id !== accounts[0].homeAccountId);
        setOfficeUsers(updatedUsers);
      }
      setIsCheckedIn(false);
      setLocation(null);
      setAddress(null);
      setIsLoading(false);
    }, 1500);
  };

  // Display session summary after check-out
  if (sessionSummary) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="bg-white p-6 rounded-xl shadow-lg text-center">
          <h2 className="text-2xl font-bold mb-4">Session Summary</h2>
          <p className="mb-2"><strong>Desk:</strong> {sessionSummary.desk}</p>
          <p className="mb-2">
            <strong>Check In:</strong> {formatTime(sessionSummary.checkInTime)} on {formatDate(sessionSummary.checkInTime)}
          </p>
          <p className="mb-4">
            <strong>Check Out:</strong> {formatTime(sessionSummary.checkOutTime)} on {formatDate(sessionSummary.checkOutTime)}
          </p>
          <button 
            onClick={() => setSessionSummary(null)}
            className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
          >
            OK
          </button>
        </div>
      </div>
    );
  }

  // If user is checked in, show check-in success view (or office users list)
  if (isCheckedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden transform transition-all">
          {showOfficeUsers ? (
            <>
              <div className="bg-blue-600 p-6">
                <button 
                  className="flex items-center text-blue-100 hover:text-white mb-4"
                  onClick={() => setShowOfficeUsers(false)}
                >
                  <FaArrowLeft className="mr-2" />
                  Back to Check-In Status
                </button>
                <h2 className="text-2xl font-bold text-white">Currently In Office</h2>
                <p className="text-blue-100 mt-1">
                  {officeUsers.length} {officeUsers.length === 1 ? 'person' : 'people'} checked in today
                </p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {officeUsers.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                      No one is currently checked in
                    </p>
                  ) : (
                    officeUsers.map(user => (
                      <div key={user.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl flex items-start border border-gray-200 dark:border-gray-600">
                        <div className="bg-blue-100 dark:bg-blue-900/50 h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 mr-4">
                          <span className="text-blue-700 dark:text-blue-300 font-medium">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatRelativeTime(new Date(user.checkInTime))}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{user.location}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <button 
                  className="mt-6 w-full py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all"
                  onClick={() => setShowOfficeUsers(false)}
                >
                  Back to Check-In Status
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="bg-green-500 p-8 flex flex-col items-center">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-lg">
                  <FaCheck className="text-green-500 text-3xl" />
                </div>
                <h2 className="text-2xl font-bold text-white">Check-In Successful!</h2>
                <p className="text-white opacity-90 mt-2 text-center">
                  Your attendance has been recorded for today
                </p>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
                      <FaCalendarAlt className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Date</p>
                      <p className="font-medium text-gray-900 dark:text-white">{formatDate(checkInTime || currentTime)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
                      <FaClock className="text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Check-in Time</p>
                      <p className="font-medium text-gray-900 dark:text-white">{formatTime(checkInTime || currentTime)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full">
                      <FaBuilding className="text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {address ? `${address.building}, ${address.road}` : 'Main Office'}
                      </p>
                      {location && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {address ? `${address.city}, ${address.state}` : `Location verified within ${location.accuracy}m`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-8">
                  <button 
                    className="py-3 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all"
                    onClick={() => setShowOfficeUsers(true)}
                  >
                    <div className="flex items-center justify-center">
                      <FaUsers className="mr-2" />
                      <span>Who's In</span>
                    </div>
                  </button>
                  <button 
                    className="py-3 rounded-xl bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 font-medium hover:bg-red-100 dark:hover:bg-red-900/50 transition-all"
                    onClick={handleCheckOut}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <span className="w-5 h-5 border-2 border-red-300 border-t-red-500 rounded-full animate-spin mr-2"></span>
                        <span>Processing...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <FaCheck className="mr-2" />
                        <span>Check Out</span>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Default Check-In Form View
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white">Desk Check-In</h2>
              <p className="text-blue-100 mt-1">Confirm your attendance for today</p>
            </div>
            <button 
              className="flex items-center text-blue-100 hover:text-white bg-white/10 px-3 py-2 rounded-lg"
              onClick={() => setShowOfficeUsers(true)}
            >
              <FaUsers className="mr-2" />
              <span className="text-sm">Who's In</span>
            </button>
          </div>
          <div className="flex justify-between mt-6">
            <div className="flex items-center space-x-2 text-white bg-white/10 px-4 py-2 rounded-lg">
              <FaCalendarAlt />
              <span>{formatDate(currentTime).split(',')[0]}</span>
            </div>
            <div className="flex items-center space-x-2 text-white bg-white/10 px-4 py-2 rounded-lg">
              <FaClock />
              <span>{formatTime(currentTime)}</span>
            </div>
          </div>
        </div>
        <div className="p-6">
          {/* Desk Selection Dropdown */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select a Desk
            </label>
            <select 
              value={selectedDesk} 
              onChange={(e) => setSelectedDesk(e.target.value)}
              className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
            >
              {Array.from({ length: 10 }, (_, i) => (
                <option key={i} value={`Desk ${i + 1}`}>{`Desk ${i + 1}`}</option>
              ))}
            </select>
          </div>
          {/* Location Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your Location
            </label>
            {!location && (
              <button
                onClick={requestLocation}
                disabled={isLoading || locationPermission === "denied"}
                className={`flex items-center justify-center w-full py-3 px-4 rounded-xl border text-sm font-medium transition ${
                  locationPermission === "denied"
                    ? "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-600 cursor-not-allowed"
                    : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                }`}
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mr-2"></span>
                ) : (
                  <FaMapMarkerAlt className="text-blue-500 mr-2" />
                )}
                {locationPermission === "denied" 
                  ? "Location access denied" 
                  : "Get Current Location"}
              </button>
            )}
            {locationError && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{locationError}</p>
            )}
            {location && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-sm border border-blue-200 dark:border-blue-900">
                <div className="flex items-start">
                  <div className="bg-blue-100 dark:bg-blue-800 p-3 rounded-full mr-3 flex-shrink-0">
                    <FaMapMarkerAlt className="text-blue-600 dark:text-blue-300" />
                  </div>
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-300">Location verified</p>
                    {address ? (
                      <>
                        <p className="text-blue-700 dark:text-blue-400 mt-1">
                          {address.building}, {address.road}
                        </p>
                        <p className="text-blue-700 dark:text-blue-400 mt-0.5 text-xs">
                          {address.city}, {address.state} {address.postcode}
                        </p>
                      </>
                    ) : (
                      <p className="text-blue-700 dark:text-blue-400 mt-1">
                        You are within range of the office
                      </p>
                    )}
                    <div className="mt-2 text-xs text-blue-700 dark:text-blue-400">
                      <p>Accuracy: {location.accuracy} meters</p>
                      <p className="mt-1">Coordinates: {location.latitude}, {location.longitude}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={handleCheckIn}
            disabled={isLoading || (!location && locationPermission !== "denied")}
            className={`w-full py-3.5 px-4 rounded-xl flex items-center justify-center font-medium transition-all ${
              isLoading || (!location && locationPermission !== "denied")
                ? "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl hover:shadow-blue-500/20"
            }`}
          >
            {isLoading ? (
              <>
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
                Processing...
              </>
            ) : (
              "Check In Now"
            )}
          </button>
          {locationPermission === "denied" && (
            <div className="mt-4 text-sm text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50">
              <p>Location access denied. You can still check in manually.</p>
              <p className="mt-1 text-xs">To enable automatic verification, please allow location access in your browser settings.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckIn;
