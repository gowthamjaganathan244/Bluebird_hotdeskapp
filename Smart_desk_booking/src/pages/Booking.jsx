import React, { useState, useEffect } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import DatePicker from "react-multi-date-picker";
import { useMsal } from "@azure/msal-react";
import FloorMap from "./FloorMap";

const Booking = () => {
  const { accounts } = useMsal();
  const currentUser = accounts[0];

  const initialDesksData = {
    leftSection: [
      { id: 1, name: "Desk 1" },
      { id: 2, name: "Desk 2" },
      { id: 3, name: "Desk 3" },
      { id: 4, name: "Desk 4" },
      { id: 5, name: "Desk 5" },
      { id: 6, name: "Desk 6" },
    ],
    rightSection: [
      { id: 7, name: "Desk 7" },
      { id: 8, name: "Desk 8" },
      { id: 9, name: "Desk 9" },
      { id: 10, name: "Desk 10" },
    ]
  };

  const [bookingMode, setBookingMode] = useState("single"); // "single" or "recurring"
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDesk, setSelectedDesk] = useState(null);
  const [desks, setDesks] = useState({});
  const [confirmation, setConfirmation] = useState(null);
  
  // Recurring booking specific states
  const [recurrenceStartDate, setRecurrenceStartDate] = useState(null);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(null);
  const [selectedDaysOfWeek, setSelectedDaysOfWeek] = useState([]);
  const [recurringDates, setRecurringDates] = useState([]);
  const [availabilityChecked, setAvailabilityChecked] = useState(false);
  const [recurringResults, setRecurringResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [floorMapDate, setFloorMapDate] = useState(null);
  const [showFloorMap, setShowFloorMap] = useState(false);

  const today = new Date();
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + 90);

  // Sample holidays - in production, this would come from an API or config
  const holidays = [
    "2025-04-18", // Good Friday
    "2025-04-21", // Easter Monday
    "2025-05-26", // Memorial Day
    "2025-07-04", // Independence Day
    // Add more holidays as needed
  ];

  const daysOfWeek = [
    { id: 1, name: "Monday" },
    { id: 2, name: "Tuesday" },
    { id: 3, name: "Wednesday" },
    { id: 4, name: "Thursday" },
    { id: 5, name: "Friday" }
  ];

  // Function to check if a date is a weekend or holiday
  const isDisabledDate = (date) => {
    const dayOfWeek = date.weekDay.index;
    const formattedDate = date.format("YYYY-MM-DD");
    
    // Check if weekend (6 = Saturday, 0 = Sunday in this library)
    const isWeekend = dayOfWeek === 6 || dayOfWeek === 0;
    
    // Check if holiday
    const isHoliday = holidays.includes(formattedDate);
    
    return isWeekend || isHoliday;
  };

  const fetchDeskBookings = async (dateStr) => {
    try {
      const response = await fetch("https://prod-12.australiaeast.logic.azure.com:443/workflows/44e2e53e4cb943d1a5a6b234d5edfb9d/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=Im6MOrEDXrgSbi9CVi5H60uUlmom-SUBQvIRBfenkc4", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateStr })
      });
      const data = await response.json();

      const allDesks = [
        ...initialDesksData.leftSection,
        ...initialDesksData.rightSection,
      ];

      const updatedDesks = allDesks.map(desk => {
        const booked = data.find(b => b.DeskID === desk.id);
        return booked
          ? { ...desk, status: "booked", user: booked.UserEmail }
          : { ...desk, status: "available", user: null };
      });

      setDesks(prev => ({
        ...prev,
        [dateStr]: updatedDesks
      }));
      
      return updatedDesks;
    } catch (error) {
      console.error("❌ Error fetching desks from SharePoint:", error);
      return null;
    }
  };

  const handleDateChange = (date) => {
    const formatted = date.format("YYYY-MM-DD");
    setSelectedDate(formatted);
    setFloorMapDate(formatted); // Update floor map date
    setSelectedDesk(null);
    fetchDeskBookings(formatted);
  };

  // For recurring mode, to show the floor map
  const handleFloorMapDateChange = (date) => {
    const formatted = date.format("YYYY-MM-DD");
    setFloorMapDate(formatted);
    fetchDeskBookings(formatted);
  };

  const handleDeskClick = (deskId) => {
    if (bookingMode === "single" && !selectedDate) {
      alert("Please select a date first.");
      return;
    }

    const currentDateStr = bookingMode === "single" ? selectedDate : floorMapDate;
    if (!currentDateStr) return;
    
    const deskList = desks[currentDateStr] || [];

    // Block if user already booked any desk (in single booking mode)
    if (bookingMode === "single") {
      const alreadyBookedByUser = deskList.some(
        (desk) => desk.user === currentUser?.username
      );
      if (alreadyBookedByUser) {
        alert("You already booked a desk on this date.");
        return;
      }
    }

    // Block if selected desk is already booked
    const clickedDesk = deskList.find((desk) => desk.id === deskId);
    if (clickedDesk?.status === "booked") {
      alert("This desk is already booked by someone else.");
      return;
    }

    setSelectedDesk(deskId);
    
    // If in recurring mode and we have dates, check availability right away
    if (bookingMode === "recurring" && recurringDates.length > 0) {
      setAvailabilityChecked(false);
      setRecurringResults(null);
    }
  };

  const toggleDayOfWeek = (dayId) => {
    setSelectedDaysOfWeek(prev => {
      if (prev.includes(dayId)) {
        return prev.filter(id => id !== dayId);
      } else {
        return [...prev, dayId];
      }
    });
    
    // Reset availability checks when selection changes
    setAvailabilityChecked(false);
    setRecurringResults(null);
  };

  // Calculate all the recurring dates based on selected days of week and date range
  const calculateRecurringDates = () => {
    if (!recurrenceStartDate || !recurrenceEndDate || selectedDaysOfWeek.length === 0) {
      return [];
    }
    
    const startDate = new Date(recurrenceStartDate);
    const endDate = new Date(recurrenceEndDate);
    const dates = [];
    
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      // Get day of week (0=Sunday, 1=Monday, 2=Tuesday, etc. in JavaScript)
      const dayOfWeek = currentDate.getDay();
      
      // Adjust to match our day IDs (1=Monday, 2=Tuesday, etc.)
      const adjustedDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;
      
      // Check if current day of week is selected
      if (selectedDaysOfWeek.includes(adjustedDayOfWeek)) {
        const formattedDate = currentDate.toISOString().split('T')[0];
        
        // Skip holidays
        if (!holidays.includes(formattedDate)) {
          dates.push(formattedDate);
        }
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  };

  // Reset states when switching modes
  useEffect(() => {
    if (bookingMode === "single") {
      setShowFloorMap(false);
      setRecurringDates([]);
      setSelectedDaysOfWeek([]);
      setRecurrenceStartDate(null);
      setRecurrenceEndDate(null);
      setAvailabilityChecked(false);
      setRecurringResults(null);
    } else {
      // Switching to recurring mode
      setSelectedDate(null);
      setSelectedDesk(null);
      setFloorMapDate(null);
      setShowFloorMap(false);
    }
  }, [bookingMode]);

  // Handle floor map visibility for recurring bookings
  const handleShowFloorMap = () => {
    if (!recurrenceStartDate || !recurrenceEndDate || selectedDaysOfWeek.length === 0) {
      alert("Please select start date, end date, and at least one day of the week first.");
      return;
    }
    
    const dates = calculateRecurringDates();
    if (dates.length === 0) {
      alert("No valid dates found in the selected range. Please check your selection.");
      return;
    }
    
    setRecurringDates(dates);
    setFloorMapDate(dates[0]);
    fetchDeskBookings(dates[0]);
    setShowFloorMap(true);
  };

  const checkAvailability = async () => {
    if (!selectedDesk || !recurrenceStartDate || !recurrenceEndDate || selectedDaysOfWeek.length === 0) {
      alert("Please select a desk, date range, and at least one day of the week.");
      return;
    }
    
    setIsLoading(true);
    
    // For each date, check availability in real-time
    const results = {
      availableDates: [],
      unavailableDates: []
    };
    
    for (const dateStr of recurringDates) {
      // Always fetch fresh data for accurate availability
      const deskList = await fetchDeskBookings(dateStr);
      
      if (!deskList) {
        // Error fetching data, consider it unavailable
        results.unavailableDates.push(dateStr);
        continue;
      }
      
      const alreadyBookedByUser = deskList.some(
        (desk) => desk.user === currentUser?.username
      );
      const clickedDesk = deskList.find((desk) => desk.id === selectedDesk);
      
      if (alreadyBookedByUser || (clickedDesk && clickedDesk.status === "booked")) {
        results.unavailableDates.push(dateStr);
      } else {
        results.availableDates.push(dateStr);
      }
    }
    
    setRecurringResults(results);
    setAvailabilityChecked(true);
    setIsLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setIsLoading(true);
    
    if (bookingMode === "single") {
      if (!selectedDate || !selectedDesk) {
        alert("Please select a date and a desk.");
        setIsLoading(false);
        return;
      }

      // Fetch latest availability for the single date
      const deskList = await fetchDeskBookings(selectedDate);

      if (!deskList) {
        alert("Error checking desk availability. Please try again.");
        setIsLoading(false);
        return;
      }

      const alreadyBookedByUser = deskList.some(
        (desk) => desk.user === currentUser?.username
      );
      const clickedDesk = deskList.find((desk) => desk.id === selectedDesk);

      if (alreadyBookedByUser) {
        alert("You already booked a desk on this date.");
        setIsLoading(false);
        return;
      }
      if (clickedDesk?.status === "booked") {
        alert("This desk has already been booked.");
        setIsLoading(false);
        return;
      }

      // Book the desk for the single date
      const success = await bookDesk(selectedDate, selectedDesk);
      
      if (success) {
        setConfirmation({
          type: "single",
          date: selectedDate,
          desk: selectedDesk,
        });
      } else {
        alert("There was an issue with your booking. Please try again.");
      }
    } else {
      // Recurring booking
      if (!availabilityChecked || !recurringResults) {
        alert("Please check availability first.");
        setIsLoading(false);
        return;
      }
      
      if (recurringResults.availableDates.length === 0) {
        alert("There are no available dates to book.");
        setIsLoading(false);
        return;
      }
      
      // Book the desk for all available dates
      const bookingResults = {
        successful: [],
        failed: []
      };
      
      for (const dateStr of recurringResults.availableDates) {
        const success = await bookDesk(dateStr, selectedDesk);
        if (success) {
          bookingResults.successful.push(dateStr);
        } else {
          bookingResults.failed.push(dateStr);
        }
      }
      
      setConfirmation({
        type: "recurring",
        successDates: bookingResults.successful,
        failedDates: bookingResults.failed,
        unavailableDates: recurringResults.unavailableDates,
        desk: selectedDesk,
      });
    }

    setSelectedDesk(null);
    setIsLoading(false);
  };
  
  const bookDesk = async (dateStr, deskId) => {
    // Update local state
    setDesks((prev) => {
      const updated = { ...prev };
      if (updated[dateStr]) {
        updated[dateStr] = updated[dateStr].map((desk) =>
          desk.id === deskId
            ? { ...desk, status: "booked", user: currentUser?.username }
            : desk
        );
      }
      return updated;
    });

    // Send to API
    const payload = {
      DeskID: deskId,
      DeskName: `Desk ${deskId}`,
      Date: dateStr,
      UserEmail: currentUser?.username || "unknown@bluebird.com",
      Status: "Booked",
      User: currentUser?.name || "Unknown User",
    };

    try {
      const response = await fetch("https://prod-04.australiaeast.logic.azure.com:443/workflows/0c4ff7f332f946b3ba5e61ffc5a3d29c/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=LLp4HbyIjxBPNe8enXRuY4gbWH2z87ItyVLvqJ_Vct8", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.text();
      console.log("✅ Booking sent:", data);
      return true;
    } catch (err) {
      console.error("❌ Error:", err);
      return false;
    }
  };

  return (
    <section className="flex flex-col items-center bg-[#f9fafb] dark:bg-[#0f1420] p-6">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
        Desk Booking
      </h2>
      <p className="mb-4 text-gray-600 dark:text-gray-300">
        Welcome <strong>{currentUser?.name || "User"}</strong>. Select a date and book your desk.
      </p>

      <div className="w-full max-w-lg mb-6">
        <div className="bg-white dark:bg-[#1a1f2e] p-4 rounded-lg shadow mb-4">
          <div className="flex space-x-4 mb-2">
            <button
              type="button"
              onClick={() => setBookingMode("single")}
              className={`flex-1 py-2 px-4 rounded-md ${
                bookingMode === "single" 
                  ? "bg-blue-600 text-white" 
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              Single Booking
            </button>
            <button
              type="button"
              onClick={() => setBookingMode("recurring")}
              className={`flex-1 py-2 px-4 rounded-md ${
                bookingMode === "recurring" 
                  ? "bg-blue-600 text-white" 
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              Recurring Booking
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-[#1a1f2e] p-6 rounded-3xl shadow-lg">
          {bookingMode === "single" ? (
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 mb-2">Select Date:</label>
              <DatePicker
                value={selectedDate}
                onChange={handleDateChange}
                format="YYYY-MM-DD"
                minDate={today}
                maxDate={maxDate}
                inputClass="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="Choose a date..."
                mapDays={({ date }) => {
                  if (isDisabledDate(date)) {
                    return {
                      disabled: true,
                      style: { color: "#ccc", textDecoration: "line-through" }
                    };
                  }
                }}
              />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Note: Weekends (Saturday/Sunday) and holidays are not available for booking.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 mb-2">Start Date:</label>
                  <DatePicker
                    value={recurrenceStartDate}
                    onChange={(date) => setRecurrenceStartDate(date.format("YYYY-MM-DD"))}
                    format="YYYY-MM-DD"
                    minDate={today}
                    maxDate={maxDate}
                    inputClass="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Start date..."
                    mapDays={({ date }) => {
                      if (isDisabledDate(date)) {
                        return {
                          disabled: true,
                          style: { color: "#ccc", textDecoration: "line-through" }
                        };
                      }
                    }}
                  />
                </div>
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 mb-2">End Date:</label>
                  <DatePicker
                    value={recurrenceEndDate}
                    onChange={(date) => setRecurrenceEndDate(date.format("YYYY-MM-DD"))}
                    format="YYYY-MM-DD"
                    minDate={recurrenceStartDate || today}
                    maxDate={maxDate}
                    inputClass="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="End date..."
                    mapDays={({ date }) => {
                      if (isDisabledDate(date)) {
                        return {
                          disabled: true,
                          style: { color: "#ccc", textDecoration: "line-through" }
                        };
                      }
                    }}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-2">Select Days:</label>
                <div className="flex flex-wrap gap-2">
                  {daysOfWeek.map(day => (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => toggleDayOfWeek(day.id)}
                      className={`px-3 py-2 rounded-md text-sm ${
                        selectedDaysOfWeek.includes(day.id)
                          ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-700"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700"
                      }`}
                    >
                      {day.name}
                    </button>
                  ))}
                </div>
              </div>
              
              {recurringDates.length > 0 && (
                <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {recurringDates.length} dates in your selection
                  </p>
                </div>
              )}
              
              {!showFloorMap && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={handleShowFloorMap}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg"
                  >
                    View Floor Map
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Floor Map for Single Booking Mode */}
          {bookingMode === "single" && selectedDate && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Select a desk:
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedDate}
                </p>
              </div>
              
              <FloorMap 
                desks={desks[selectedDate] || []}
                leftSectionDesks={desks[selectedDate]?.filter(d => d.id <= 6) || []}
                rightSectionDesks={desks[selectedDate]?.filter(d => d.id > 6) || []}
                selectedDesk={selectedDesk}
                onDeskClick={handleDeskClick}
                currentUser={currentUser}
              />
            </div>
          )}
          
          {/* Floor Map for Recurring Mode */}
          {bookingMode === "recurring" && showFloorMap && (
            <div className="mt-4">
              {/* Completely reorganized header for better alignment */}
              <div className="mb-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Select a desk for all bookings:
                </h3>
                
                <div className="flex justify-end mb-1">
                  <div style={{ maxWidth: "150px" }} className="w-full">
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      View date:
                    </label>
                    <DatePicker
                      value={floorMapDate}
                      onChange={handleFloorMapDateChange}
                      format="YYYY-MM-DD"
                      inputClass="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs py-1 px-2 w-full"
                      placeholder="Change date..."
                      mapDays={({ date }) => {
                        const formattedDate = date.format("YYYY-MM-DD");
                        if (!recurringDates.includes(formattedDate)) {
                          return {
                            disabled: true,
                            style: { color: "#ccc" }
                          };
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
              
              <FloorMap 
                desks={desks[floorMapDate] || []}
                leftSectionDesks={desks[floorMapDate]?.filter(d => d.id <= 6) || []}
                rightSectionDesks={desks[floorMapDate]?.filter(d => d.id > 6) || []}
                selectedDesk={selectedDesk}
                onDeskClick={handleDeskClick}
                currentUser={currentUser}
              />
              
              {selectedDesk && !availabilityChecked && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={checkAvailability}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg"
                    disabled={isLoading}
                  >
                    {isLoading ? "Checking..." : "Check Availability"}
                  </button>
                </div>
              )}
              
              {recurringResults && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Availability Check Results:</h4>
                  <div className="space-y-2">
                    <p className="flex items-center text-sm text-green-700 dark:text-green-300">
                      <CheckCircle2 size={16} className="mr-1" />
                      Available on {recurringResults.availableDates.length} dates
                    </p>
                    {recurringResults.unavailableDates.length > 0 && (
                      <p className="flex items-center text-sm text-red-700 dark:text-red-300">
                        <XCircle size={16} className="mr-1" />
                        Unavailable on {recurringResults.unavailableDates.length} dates
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg"
            disabled={
              isLoading ||
              (bookingMode === "single" && (!selectedDesk || !selectedDate)) ||
              (bookingMode === "recurring" && (!availabilityChecked || !recurringResults || recurringResults.availableDates.length === 0))
            }
          >
            {isLoading ? "Processing..." : (bookingMode === "single" ? "Confirm Booking" : "Book Available Dates")}
          </button>
        </form>
      </div>

      {confirmation && (
        <div className="mt-2 p-4 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-lg w-full max-w-lg">
          <p className="font-bold">Booking Confirmed!</p>
          {confirmation.type === "single" ? (
            <>
              <p>Date: {confirmation.date}</p>
              <p>Desk: Desk {confirmation.desk}</p>
            </>
          ) : (
            <>
              <p>Recurring booking for Desk {confirmation.desk}</p>
              <p>Successfully booked on {confirmation.successDates.length} date(s)</p>
              {confirmation.failedDates.length > 0 && (
                <p className="text-yellow-800 dark:text-yellow-200 mt-2">
                  Note: Failed to book {confirmation.failedDates.length} date(s).
                </p>
              )}
              {confirmation.unavailableDates.length > 0 && (
                <p className="text-yellow-800 dark:text-yellow-200 mt-2">
                  Note: {confirmation.unavailableDates.length} date(s) were unavailable.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
};

export default Booking;