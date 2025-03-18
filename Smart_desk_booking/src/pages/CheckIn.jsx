import React, { useState, useEffect } from "react";
import { FaMapMarkerAlt, FaCheck, FaClock, FaCalendarAlt, FaBuilding, FaLaptop } from "react-icons/fa";

const CheckIn = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [locationPermission, setLocationPermission] = useState("prompt");

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  // Format the current date for display
  const formatDate = (date) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  };

  // Format time for display
  const formatTime = (date) => {
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Request location permission and get location
  const requestLocation = () => {
    setIsLoading(true);
    setLocationError(null);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6),
            accuracy: Math.round(position.coords.accuracy)
          });
          setLocationPermission("granted");
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

  // Handle check-in submission
  const handleCheckIn = () => {
    setIsLoading(true);
    
    // Simulate API call with a timeout
    setTimeout(() => {
      setIsCheckedIn(true);
      setIsLoading(false);
    }, 1500);
  };

  if (isCheckedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100 dark:bg-gray-900">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="bg-green-500 p-8 flex flex-col items-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4">
              <FaCheck className="text-green-500 text-3xl" />
            </div>
            <h2 className="text-xl font-bold text-white">Check-In Successful!</h2>
            <p className="text-white opacity-90 mt-2 text-center">
              Your attendance has been recorded for today
            </p>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <FaCalendarAlt className="text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Date</p>
                  <p className="font-medium text-gray-900 dark:text-white">{formatDate(currentTime)}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <FaClock className="text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Check-in Time</p>
                  <p className="font-medium text-gray-900 dark:text-white">{formatTime(currentTime)}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <FaBuilding className="text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                  <p className="font-medium text-gray-900 dark:text-white">Main Office</p>
                </div>
              </div>
            </div>
            
            <button 
              className="mt-6 w-full py-3 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-medium"
              onClick={() => setIsCheckedIn(false)}
            >
              Back to Check-In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
          <h2 className="text-2xl font-bold text-white">Desk Check-In</h2>
          <p className="text-blue-100 mt-1">Confirm your attendance for today</p>
          
          <div className="mt-4 flex items-center space-x-2 text-white">
            <FaCalendarAlt />
            <span>{formatDate(currentTime)}</span>
          </div>
          
          <div className="mt-2 flex items-center space-x-2 text-white">
            <FaClock />
            <span>{formatTime(currentTime)}</span>
          </div>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Selected Desk
            </label>
            <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <FaLaptop className="text-gray-500 dark:text-gray-400 mr-3" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Desk A-42</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">North Wing, 4th Floor</p>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your Location
            </label>
            
            {!location && (
              <button
                onClick={requestLocation}
                disabled={isLoading || locationPermission === "denied"}
                className={`flex items-center justify-center w-full py-2.5 px-4 rounded-lg border text-sm font-medium transition ${
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
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-sm">
                <div className="flex items-start">
                  <FaMapMarkerAlt className="text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-300">
                      Location verified
                    </p>
                    <p className="text-blue-700 dark:text-blue-400 mt-1">
                      You are within range of the office
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <button
            onClick={handleCheckIn}
            disabled={isLoading || (!location && locationPermission !== "denied")}
            className={`w-full py-3 px-4 rounded-lg flex items-center justify-center font-medium transition-all ${
              isLoading || (!location && locationPermission !== "denied")
                ? "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white"
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
            <p className="mt-4 text-sm text-center text-gray-500 dark:text-gray-400">
              Location access denied. You can still check in manually.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckIn;