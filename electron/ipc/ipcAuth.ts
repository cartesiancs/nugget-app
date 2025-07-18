import { BrowserWindow, shell } from "electron";
import Store from "electron-store";
import http from "http";
import url from "url";

const store = new Store();

// Local server to handle OAuth callback
let authServer: http.Server | null = null;
let authWindow: BrowserWindow | null = null;

export const ipcAuth = {
  // Initiate Google OAuth login flow
  initiateLogin: async (event) => {
    try {
      console.log("Initiating Google OAuth login...");
      
      // Start local server to handle callback
      await startAuthServer();
      
      // Create a new window for OAuth flow
      authWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        },
        show: false,
      });

      // Show window when ready
      authWindow.once("ready-to-show", () => {
        authWindow?.show();
      });

      // Handle window close
      authWindow.on("closed", () => {
        console.log("Auth window closed");
        authWindow = null;
        stopAuthServer();
      });

      // Navigate to Google OAuth URL
      const authUrl = "https://backend.usuals.ai/auth/google";
      await authWindow.loadURL(authUrl);

      return { status: 1, message: "Auth window opened" };
    } catch (error) {
      console.error("Failed to initiate login:", error);
      return { status: 0, error: error instanceof Error ? error.message : "Unknown error" };
    }
  },

  // Check authentication status
  checkAuthStatus: async (event) => {
    try {
      const token = store.get("authToken");
      
      if (!token) {
        return { status: 0, message: "No token found" };
      }

      // Call backend to validate token
      const response = await fetch("https://backend.usuals.ai/auth/status", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return { 
          status: 1, 
          user: data.user,
          message: "User is authenticated" 
        };
      } else {
        // Token is invalid, remove it
        store.delete("authToken");
        return { status: 0, message: "Token is invalid" };
      }
    } catch (error) {
      console.error("Auth status check failed:", error);
      return { status: 0, error: error instanceof Error ? error.message : "Unknown error" };
    }
  },

  // Logout user
  logout: async (event) => {
    try {
      store.delete("authToken");
      return { status: 1, message: "Logged out successfully" };
    } catch (error) {
      console.error("Logout failed:", error);
      return { status: 0, error: error instanceof Error ? error.message : "Unknown error" };
    }
  },

  // Get stored token
  getToken: async (event) => {
    try {
      const token = store.get("authToken");
      return { status: 1, token: token || null };
    } catch (error) {
      console.error("Failed to get token:", error);
      return { status: 0, error: error instanceof Error ? error.message : "Unknown error" };
    }
  },
};

// Start local server to handle OAuth callback
async function startAuthServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (authServer) {
      resolve();
      return;
    }

    authServer = http.createServer(async (req, res) => {
      const parsedUrl = url.parse(req.url || "", true);
      
      if (parsedUrl.pathname === "/auth/google-redirect") {
        const code = parsedUrl.query.code as string;
        
        if (code) {
          try {
            console.log("Received OAuth code:", code);
            
            // The backend's /auth/google-redirect endpoint already handles the OAuth callback
            // and returns the token directly. We just need to make a GET request to it.
            const tokenResponse = await fetch(`https://backend.usuals.ai/auth/google-redirect?code=${encodeURIComponent(code)}`, {
              method: "GET",
            });
            
            if (tokenResponse.ok) {
              const tokenData = await tokenResponse.json();
              console.log("Token response:", tokenData);
              
              if (tokenData.success && tokenData.access_token) {
                const token = tokenData.access_token;
                
                // Store the token
                store.set("authToken", token);
                
                // Send success event to main window with user data from the response
                const mainWindow = BrowserWindow.getAllWindows().find(
                  (win) => win !== authWindow
                );
                
                if (mainWindow) {
                  mainWindow.webContents.send("LOGIN_SUCCESS", {
                    access_token: token,
                    user: tokenData.user, // Use user data from the redirect response
                  });
                }
                
                // Close auth window
                if (authWindow) {
                  authWindow.close();
                }
                
                // Send success response to browser
                res.writeHead(200, { "Content-Type": "text/html" });
                res.end(`
                  <html>
                    <body>
                      <h1>Authentication Successful!</h1>
                      <p>You can close this window now.</p>
                      <script>
                        setTimeout(() => window.close(), 2000);
                      </script>
                    </body>
                  </html>
                `);
              } else {
                throw new Error("Invalid response from backend");
              }
            } else {
              const errorText = await tokenResponse.text();
              console.error("Backend error response:", errorText);
              throw new Error(`Backend returned ${tokenResponse.status}`);
            }
          } catch (error) {
            console.error("Auth callback error:", error);
            res.writeHead(500, { "Content-Type": "text/html" });
            res.end(`
              <html>
                <body>
                  <h1>Authentication Failed</h1>
                  <p>Please try again.</p>
                </body>
              </html>
            `);
          }
        } else {
          res.writeHead(400, { "Content-Type": "text/html" });
          res.end(`
            <html>
              <body>
                <h1>Authentication Failed</h1>
                <p>No code received.</p>
              </body>
            </html>
          `);
        }
      } else {
        res.writeHead(404, { "Content-Type": "text/html" });
        res.end("<h1>Not Found</h1>");
      }
    });

    authServer.listen(8080, () => {
      console.log("Auth server listening on port 8080");
      resolve();
    });

    authServer.on("error", (error: any) => {
      console.error("Auth server error:", error);
      if (error.code === 'EADDRINUSE') {
        console.log("Port 8080 is in use, trying port 8081...");
        authServer?.listen(8081, () => {
          console.log("Auth server listening on port 8081");
          resolve();
        });
      } else {
        reject(error);
      }
    });
  });
}

// Stop local server
function stopAuthServer(): void {
  if (authServer) {
    authServer.close();
    authServer = null;
    console.log("Auth server stopped");
  }
} 