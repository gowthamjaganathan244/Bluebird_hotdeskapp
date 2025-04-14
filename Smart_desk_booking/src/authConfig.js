// src/authConfig.js
export const msalConfig = {
    auth: {
      clientId: "6c23c171-584e-4c26-8b42-8497bacd96f0",
      authority: "https://login.microsoftonline.com/c48063c5-bcac-464d-bd27-8cb01ea49641",
      redirectUri: window.location.origin, // Dynamic redirect based on deployment environment
    },
    cache: {
      cacheLocation: "localStorage",
      storeAuthStateInCookie: false,
    },
  };
  
  export const loginRequest = {
    scopes: ["openid", "profile", "email", "User.Read"],
  };
  
  // Helper function to handle token acquisition
  export const getTokenSilently = async (instance, account, scopes = loginRequest.scopes) => {
    try {
      const response = await instance.acquireTokenSilent({
        scopes,
        account,
      });
      return response.accessToken;
    } catch (error) {
      console.error("Silent token acquisition failed", error);
      
      if (error.name === "InteractionRequiredAuthError") {
        try {
          const response = await instance.acquireTokenPopup({
            scopes,
            account,
          });
          return response.accessToken;
        } catch (err) {
          console.error("Popup token acquisition failed", err);
          throw err;
        }
      } else {
        throw error;
      }
    }
  };