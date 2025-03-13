import React, { useState } from "react";
import { Laptop, User } from "lucide-react";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { MdFilterList } from "react-icons/md";
import DatePicker from "react-multi-date-picker"; // New: multi-date picker import

const Booking = () => {
  // Initial desk data structure - organized as a floor map
  const initialDesksData = {
    // Left section (2×3 grid for desks 1-6)
    leftSection: [
      { id: 1, name: "Desk 1" },
      { id: 2, name: "Desk 2" },
      { id: 3, name: "Desk 3" },
      { id: 4, name: "Desk 4" },
      { id: 5, name: "Desk 5" },
      { id: 6, name: "Desk 6" },
    ],
    // Right section (single column for desks 7-10)
    rightSection: [
      { id: 7, name: "Desk 7" },
      { id: 8, name: "Desk 8" },
      { id: 9, name: "Desk 9" },
      { id: 10, name: "Desk 10" },
    ]
  };

  const [desks, setDesks] = useState({});
  const [selectedDates, setSelectedDates] = useState([]); // Updated for multiple dates
  const [selectedDesk, setSelectedDesk] = useState(null);
  const [recurrence, setRecurrence] = useState("none");
  const [filter, setFilter] = useState("all");
  const [confirmation, setConfirmation] = useState(null);

  // Handle Dates Change and Initialize Desk Availability for each selected date
  const handleDatesChange = (dates) => {
    // Convert dates to formatted strings ("YYYY-MM-DD")
    const formattedDates = dates.map(date => date.format("YYYY-MM-DD"));
    setSelectedDates(formattedDates);

    // Initialize desks as available for any new date
    setDesks(prev => {
      const newDesks = { ...prev };
      formattedDates.forEach(date => {
        if (!newDesks[date]) {
          newDesks[date] = [
            ...initialDesksData.leftSection.map(desk => ({ ...desk, status: "available" })),
            ...initialDesksData.rightSection.map(desk => ({ ...desk, status: "available" }))
          ];
        }
      });
      return newDesks;
    });
  };

  // Handle Desk Selection
  const handleDeskClick = (deskId) => {
    if (selectedDates.length === 0) {
      alert("Please select at least one date before choosing a desk.");
      return;
    }
    setSelectedDesk(deskId);
  };

  // Handle Booking Submission for multiple dates
  const handleSubmit = (e) => {
    e.preventDefault();

    if (selectedDates.length === 0 || !selectedDesk) {
      alert("Please select at least one date and a desk before booking.");
      return;
    }

    setDesks(prevDesks => {
      const updatedDesks = { ...prevDesks };
      selectedDates.forEach(date => {
        // If desks for the date are not initialized, initialize them
        if (!updatedDesks[date]) {
          updatedDesks[date] = [
            ...initialDesksData.leftSection.map(desk => ({ ...desk, status: "available" })),
            ...initialDesksData.rightSection.map(desk => ({ ...desk, status: "available" }))
          ];
        }
        // Update the booking status for the selected desk for each date
        updatedDesks[date] = updatedDesks[date].map(desk =>
          desk.id === selectedDesk ? { ...desk, status: "booked" } : desk
        );
      });
      return updatedDesks;
    });

    setConfirmation({
      dates: selectedDates,
      desk: selectedDesk,
      recurrence: recurrence === "none" ? "No recurrence" : recurrence,
    });
    
    // Reset selected desk after booking
    setSelectedDesk(null);
  };

  // For display purposes, we use the first selected date's floor map.
  const currentDate = selectedDates.length ? selectedDates[0] : "";
  const currentDesks = currentDate ? desks[currentDate] || [] : [];

  // Filter desks based on availability
  const filteredDesks = currentDesks.filter((desk) => {
    if (filter === "all") return true;
    return desk.status === filter;
  });

  // Split filtered desks into left and right sections for the floor map
  const leftSectionDesks = filteredDesks.filter(desk => desk.id <= 6);
  const rightSectionDesks = filteredDesks.filter(desk => desk.id > 6);

  // Count available and booked desks
  const availableCount = currentDesks.filter(desk => desk.status === "available").length;
  const bookedCount = currentDesks.filter(desk => desk.status === "booked").length;

  return (
    <section className="flex flex-col items-center bg-[#f9fafb] dark:bg-[#0f1420] p-6">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
        Desk Booking
      </h2>
      <p className="mb-4 text-gray-600 dark:text-gray-300">
        Select one or more dates, choose a desk, and confirm your booking.
      </p>

      {/* Booking Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-lg bg-white dark:bg-[#1a1f2e] p-6 rounded-3xl shadow-lg mb-6">
        {/* Select Dates */}
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300 mb-2">
            Select Dates:
          </label>
          <DatePicker
            multiple
            value={selectedDates}
            onChange={handleDatesChange}
            format="YYYY-MM-DD"
            className="w-full"
            inputClassName="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            placeholder="Select dates..."
            placeholderClassName="text-gray-500 dark:text-gray-400"
          />
        </div>

        {/* Recurrence Options */}
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300 mb-2">
            Recurrence:
          </label>
          <select
            value={recurrence}
            onChange={(e) => setRecurrence(e.target.value)}
            className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="none">No recurrence</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg transition-all"
          disabled={!selectedDesk || selectedDates.length === 0}
        >
          Confirm Booking
        </button>
      </form>

      {/* Desk Selection - Floor Map */}
      {currentDate && (
        <>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-xl mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Office Floor Map for {currentDate}
            </h3>
            
            <div className="flex gap-8 justify-center">
              {/* Left section (2×3 grid) */}
              <div className="grid grid-cols-2 gap-4">
                {leftSectionDesks.map((desk) => (
                  <div
                    key={desk.id}
                    onClick={() => handleDeskClick(desk.id)}
                    className={`
                      w-24 h-16 rounded-md cursor-pointer transition-all duration-200
                      flex items-center justify-start p-2
                      ${desk.status === "booked" 
                        ? 'bg-red-50 border border-red-200 shadow-sm' 
                        : 'bg-white border border-slate-200 shadow-sm'} 
                      ${selectedDesk === desk.id ? 'border-2 border-blue-500' : ''}
                      hover:border-blue-400 hover:shadow
                    `}
                    title={desk.status === "booked" ? "Already booked" : "Click to select"}
                  >
                    <div 
                      className={`
                        flex justify-center items-center rounded-full w-6 h-6 mr-2
                        ${desk.status === "booked" 
                          ? 'bg-red-100 text-red-500' 
                          : 'bg-emerald-100 text-emerald-500'}
                      `}
                    >
                      {desk.status === "booked" ? (
                        <User size={14} />
                      ) : (
                        <Laptop size={14} />
                      )}
                    </div>
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {desk.name}
                    </span>
                  </div>
                ))}
              </div>

              {/* Center divider */}
              <div className="h-full border-l border-slate-200 dark:border-slate-700"></div>

              {/* Right section with desks and window */}
              <div className="relative">
                {/* Window - vertical line */}
                <div className="absolute right-0 top-0 bottom-0 w-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <div className="absolute top-1/4 w-full h-px bg-blue-300 dark:bg-blue-700"></div>
                  <div className="absolute top-2/4 w-full h-px bg-blue-300 dark:bg-blue-700"></div>
                  <div className="absolute top-3/4 w-full h-px bg-blue-300 dark:bg-blue-700"></div>
                </div>
                
                {/* Desks */}
                <div className="grid grid-cols-1 gap-4 pr-4">
                  {rightSectionDesks.map((desk) => (
                    <div
                      key={desk.id}
                      onClick={() => handleDeskClick(desk.id)}
                      className={`
                        w-24 h-16 rounded-md cursor-pointer transition-all duration-200
                        flex items-center justify-start p-2
                        ${desk.status === "booked" 
                          ? 'bg-red-50 border border-red-200 shadow-sm' 
                          : 'bg-white border border-slate-200 shadow-sm'} 
                        ${selectedDesk === desk.id ? 'border-2 border-blue-500' : ''}
                        hover:border-blue-400 hover:shadow
                      `}
                      title={desk.status === "booked" ? "Already booked" : "Click to select"}
                    >
                      <div 
                        className={`
                          flex justify-center items-center rounded-full w-6 h-6 mr-2
                          ${desk.status === "booked" 
                            ? 'bg-red-100 text-red-500' 
                            : 'bg-emerald-100 text-emerald-500'}
                        `}
                      >
                        {desk.status === "booked" ? (
                          <User size={14} />
                        ) : (
                          <Laptop size={14} />
                        )}
                      </div>
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        {desk.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Status bar */}
            <div className="mt-6 bg-gray-50 dark:bg-gray-700 p-3 rounded-md shadow-sm">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-emerald-100 border border-emerald-200 rounded-full mr-1"></div>
                  <span className="text-xs text-slate-600 dark:text-slate-300">
                    Available: {availableCount}
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-100 border border-red-200 rounded-full mr-1"></div>
                  <span className="text-xs text-slate-600 dark:text-slate-300">
                    Booked: {bookedCount}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Booking Confirmation Message */}
      {confirmation && (
        <div className="mt-2 p-4 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-lg">
          <p className="font-bold">Booking Confirmed!</p>
          <p>Dates: {confirmation.dates.join(", ")}</p>
          <p>Desk: {confirmation.desk}</p>
          <p>Recurrence: {confirmation.recurrence}</p>
        </div>
      )}
    </section>
  );
};

export default Booking;
