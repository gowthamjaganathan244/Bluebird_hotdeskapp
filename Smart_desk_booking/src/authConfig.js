// src/authConfig.js
export const msalConfig = {
    auth: {
      clientId: "0713112a-58a6-41d8-ab85-1b01f9fb2649",
      authority: "https://login.microsoftonline.com/72603783-c92a-42df-a47c-79cd3ca3cc35",
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