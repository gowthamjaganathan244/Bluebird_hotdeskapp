# Smart Hot Desk Booking System (Local Setup Guide)

## Project Overview
This project is a React-based hot desk booking system that integrates with Microsoft 365 services such as Azure Active Directory for login authentication, SharePoint Lists for data storage, and Outlook Calendar via Power Automate for meeting invites.


## Key Features
- Secure Microsoft Azure AD login (Single Sign-On)
- Desk booking with an interactive real-time floor map
- Recurring and editable booking functionality
- Location-based check-in (Office/Remote/Client Visit)
- Reports and analytics dashboard powered by Chart.js
- Built using React.js and Tailwind CSS


## Technologies Used
- React.js (Frontend framework)
- Tailwind CSS (Styling)
- Vite (Build tool and dev server)
- MSAL.js (Microsoft Authentication Library)
- SharePoint (via Power Automate for backend lists)
- Chart.js (Reporting)
- React Router DOM (Routing)


## Prerequisites
- Node.js (version 18+ recommended)
- npm (comes with Node.js)
- Microsoft 365 tenant with Azure AD and SharePoint access


## Installation Steps

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/smart-hot-desk-booking-system.git
cd smart-hot-desk-booking-system
```


### 2. Install Dependencies
```bash
npm install
```


### 3. Configure Azure AD Authentication
Open `authConfig.js` and update the configuration with your Azure app registration details:
```javascript
export const msalConfig = {
  auth: {
    clientId: 'YOUR_CLIENT_ID',
    authority: 'https://login.microsoftonline.com/YOUR_TENANT_ID',
    redirectUri: 'http://localhost:5173',
  },
};
```
- Make sure to add `http://localhost:5173` to the **Redirect URIs** in the Azure Portal for your app registration.


### 4. Run the Application Locally
```bash
npm run dev
```
- Open your browser and visit: `http://localhost:5173`


## Project Folder Structure
```
src/
├── components/         # Reusable layout components like Header, Footer
├── pages/              # Main application pages (Home, Booking, Reports)
├── authConfig.js       # Azure AD MSAL configuration
├── App.jsx             # Main app layout and routing
└── main.jsx            # App entry point and MSAL provider setup
```


## Important Notes for Local Usage
- Login is handled by Azure AD authentication using MSAL.
- Desk booking data is connected to SharePoint Lists via Power Automate workflows.
- This local development setup does **NOT** use SharePoint Framework (SPFx).
- Ensure backend flows (Power Automate) and SharePoint lists are properly configured for full functionality.


## Troubleshooting
| Issue | Solution |
|:------|:---------|
| Login redirect error | Check that your Azure AD app's Redirect URI matches `http://localhost:5173` |
| SharePoint data not showing | Verify Power Automate flows and SharePoint list permissions |
| Application blank or crashes | Check browser console for missing config errors |





---

This document provides clear, non-technical instructions for running and testing the Smart Hot Desk Booking System locally.

