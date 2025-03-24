import React, { useState } from "react";
import { Laptop, User } from "lucide-react";
import DatePicker from "react-multi-date-picker";
import { useMsal } from "@azure/msal-react";

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

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDesk, setSelectedDesk] = useState(null);
  const [desks, setDesks] = useState({});
  const [confirmation, setConfirmation] = useState(null);

  const today = new Date();
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + 90);

  const handleDateChange = (date) => {
    const formatted = date.format("YYYY-MM-DD");
    setSelectedDate(formatted);

    // Initialize desk availability
    setDesks((prev) => {
      if (!prev[formatted]) {
        return {
          ...prev,
          [formatted]: [
            ...initialDesksData.leftSection.map(d => ({ ...d, status: "available", user: null })),
            ...initialDesksData.rightSection.map(d => ({ ...d, status: "available", user: null }))
          ]
        };
      }
      return prev;
    });

    setSelectedDesk(null);
  };

  const handleDeskClick = (deskId) => {
    if (!selectedDate) {
      alert("Please select a date first.");
      return;
    }

    const alreadyBooked = desks[selectedDate]?.some(
      (desk) => desk.user === currentUser?.username
    );

    if (alreadyBooked) {
      alert("You already booked a desk on this date.");
      return;
    }

    setSelectedDesk(deskId);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedDate || !selectedDesk) {
      alert("Please select a date and a desk.");
      return;
    }

    setDesks((prev) => {
      const updated = { ...prev };
      updated[selectedDate] = updated[selectedDate].map((desk) =>
        desk.id === selectedDesk
          ? { ...desk, status: "booked", user: currentUser?.username }
          : desk
      );
      return updated;
    });

    const payload = {
      DeskID: selectedDesk,
      DeskName: `Desk ${selectedDesk}`,
      Date: selectedDate,
      UserEmail: currentUser?.username || "unknown@bluebird.com",
      Status: "Booked",
      User: currentUser?.name || "Unknown User",
    };

    fetch("https://prod-04.australiaeast.logic.azure.com:443/workflows/0c4ff7f332f946b3ba5e61ffc5a3d29c/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=LLp4HbyIjxBPNe8enXRuY4gbWH2z87ItyVLvqJ_Vct8", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(res => res.text())
      .then(data => console.log("✅ Booking sent:", data))
      .catch(err => console.error("❌ Error:", err));

    setConfirmation({
      date: selectedDate,
      desk: selectedDesk,
    });

    setSelectedDesk(null);
  };

  const currentDate = selectedDate;
  const currentDesks = currentDate ? desks[currentDate] || [] : [];
  const leftSectionDesks = currentDesks.filter(d => d.id <= 6);
  const rightSectionDesks = currentDesks.filter(d => d.id > 6);
  const availableCount = currentDesks.filter(d => d.status === "available").length;
  const bookedCount = currentDesks.filter(d => d.status === "booked").length;

  return (
    <section className="flex flex-col items-center bg-[#f9fafb] dark:bg-[#0f1420] p-6">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
        Desk Booking
      </h2>
      <p className="mb-4 text-gray-600 dark:text-gray-300">
        Welcome <strong>{currentUser?.name || "User"}</strong>. Select a date and book your desk.
      </p>

      <form onSubmit={handleSubmit} className="w-full max-w-lg bg-white dark:bg-[#1a1f2e] p-6 rounded-3xl shadow-lg mb-6">
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
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg"
          disabled={!selectedDesk || !selectedDate}
        >
          Confirm Booking
        </button>
      </form>

      {currentDate && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-xl mb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Floor Map for {currentDate}
          </h3>

          <div className="flex gap-8 justify-center">
            {/* Left section (2x3 grid) */}
            <div className="grid grid-cols-2 gap-4">
              {leftSectionDesks.map((desk) => (
                <div
                  key={desk.id}
                  onClick={() => handleDeskClick(desk.id)}
                  className={`
                    w-24 h-16 rounded-md cursor-pointer transition-all duration-200
                    flex items-center justify-start p-2
                    ${desk.status === "booked" ? 'bg-red-50 border border-red-200' : 'bg-white border border-slate-200'}
                    ${selectedDesk === desk.id ? 'border-2 border-blue-500' : ''}
                    hover:border-blue-400 hover:shadow
                  `}
                >
                  <div className={`
                    flex justify-center items-center rounded-full w-6 h-6 mr-2
                    ${desk.status === "booked" ? 'bg-red-100 text-red-500' : 'bg-emerald-100 text-emerald-500'}
                  `}>
                    {desk.status === "booked" ? <User size={14} /> : <Laptop size={14} />}
                  </div>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {desk.name}
                  </span>
                </div>
              ))}
            </div>

            {/* Center divider */}
            <div className="h-full border-l border-slate-200 dark:border-slate-700"></div>

            {/* Right section (window) */}
            <div className="relative">
            <div className="absolute -right-14 top-1/2 transform -translate-y-1/2 rotate-90 text-blue-400 dark:text-blue-300 font-semibold tracking-widest text-sm mr-2">
  WINDOW
</div>
              <div className="absolute right-0 top-0 bottom-0 w-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <div className="absolute top-1/4 w-full h-px bg-blue-300 dark:bg-blue-700"></div>
                <div className="absolute top-2/4 w-full h-px bg-blue-300 dark:bg-blue-700"></div>
                <div className="absolute top-3/4 w-full h-px bg-blue-300 dark:bg-blue-700"></div>
              </div>
              <div className="grid grid-cols-1 gap-4 pr-4">
                {rightSectionDesks.map((desk) => (
                  <div
                    key={desk.id}
                    onClick={() => handleDeskClick(desk.id)}
                    className={`
                      w-24 h-16 rounded-md cursor-pointer transition-all duration-200
                      flex items-center justify-start p-2
                      ${desk.status === "booked" ? 'bg-red-50 border border-red-200' : 'bg-white border border-slate-200'}
                      ${selectedDesk === desk.id ? 'border-2 border-blue-500' : ''}
                      hover:border-blue-400 hover:shadow
                    `}
                  >
                    <div className={`
                      flex justify-center items-center rounded-full w-6 h-6 mr-2
                      ${desk.status === "booked" ? 'bg-red-100 text-red-500' : 'bg-emerald-100 text-emerald-500'}
                    `}>
                      {desk.status === "booked" ? <User size={14} /> : <Laptop size={14} />}
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
            <div className="flex justify-between items-center text-sm">
              <span className="text-green-700 dark:text-green-300">Available: {availableCount}</span>
              <span className="text-red-700 dark:text-red-300">Booked: {bookedCount}</span>
            </div>
          </div>
        </div>
      )}

      {/* Booking Confirmation */}
      {confirmation && (
        <div className="mt-2 p-4 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-lg">
          <p className="font-bold">Booking Confirmed!</p>
          <p>Date: {confirmation.date}</p>
          <p>Desk: Desk {confirmation.desk}</p>
        </div>
      )}
    </section>
  );
};

export default Booking;
