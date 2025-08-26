import { BrowserWindow } from "electron";

let paymentWindow: BrowserWindow | null = null;
let windowTimeout: NodeJS.Timeout | null = null;
let resultSent = false; // Flag to prevent multiple result sends

export const ipcPayment = {
  // Open Stripe payment window
  openStripePayment: async (event, paymentUrl: string) => {
    try {
      console.log("🚀 === STRIPE PAYMENT WINDOW OPENING ===");
      console.log("🔧 Opening Stripe payment window:", paymentUrl);
      console.log("🔧 Function called successfully");

      // Reset flags
      resultSent = false;

      // Close existing payment window if any
      if (paymentWindow && !paymentWindow.isDestroyed()) {
        console.log("🧹 Closing existing payment window");
        paymentWindow.close();
        paymentWindow = null;
      }

      // Clear any existing timeout
      if (windowTimeout) {
        clearTimeout(windowTimeout);
        windowTimeout = null;
      }

      // Create a new payment window
      paymentWindow = new BrowserWindow({
        width: 800,
        height: 700,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          webSecurity: true,
        },
        show: false,
        modal: true,
        resizable: true,
        minimizable: false,
        maximizable: false,
        title: "Complete Payment - Usuals.ai",
        parent: BrowserWindow.getFocusedWindow() || undefined,
      });

      // Helper to forward result URL to main window and close popup
      const forwardResult = (resultUrl: string) => {
        // Prevent multiple result sends
        if (resultSent) {
          console.log("🚫 Result already sent, ignoring:", resultUrl);
          return;
        }
        
        resultSent = true;
        console.log("📤 Sending payment result:", resultUrl);
        
        const mainWindow = BrowserWindow.getAllWindows().find(win => win !== paymentWindow);
        if (mainWindow) {
          mainWindow.webContents.send("stripe-payment-result", resultUrl);
        }
        
        // Clear timeout
        if (windowTimeout) {
          clearTimeout(windowTimeout);
          windowTimeout = null;
        }
        
        // Close window after a short delay to ensure message is sent
        setTimeout(() => {
          if (paymentWindow && !paymentWindow.isDestroyed()) {
            paymentWindow.close();
          }
        }, 100);
      };

      // Set up timeout to prevent hanging windows (5 minutes)
      windowTimeout = setTimeout(() => {
        console.log("⏰ Payment window timeout - closing");
        forwardResult("timeout://payment-timeout");
      }, 5 * 60 * 1000);

      // ──────────────────────────────────────────────────────────
      // PRIMARY: Use webRequest to intercept navigation before it happens
      // This is the most reliable method to catch all navigation attempts
      // ──────────────────────────────────────────────────────────
      console.log("🔧 Setting up webRequest interceptor");
      
      // Test if webRequest is working at all
      paymentWindow.webContents.session.webRequest.onBeforeRequest(
        { urls: ["*://*/*"] },
        (details, callback) => {
          if (resultSent) {
            console.log(`[STRIPE-INTERCEPT] Result already sent, canceling: ${details.url}`);
            callback({ cancel: true });
            return;
          }

          const { url } = details;
          console.log(`[STRIPE-INTERCEPT] 🔍 Checking URL: ${url}`);
          
          // Force block ALL localhost URLs immediately
          if (url.startsWith("http://localhost:")) {
            console.log(`[STRIPE-INTERCEPT] 🚫 BLOCKING LOCALHOST URL: ${url}`);
            callback({ cancel: true });
            forwardResult(url);
            return;
          }

          // Allow initial Stripe checkout page and Stripe resources
          if (url.startsWith("https://checkout.stripe.com/") && 
              !url.includes("session_id=") && 
              !url.includes("cancel") && 
              !url.includes("success")) {
            console.log(`[STRIPE-INTERCEPT] Allowing Stripe resource: ${url}`);
            callback({ cancel: false });
            return;
          }

          // Check for success indicators
          const isSuccess = url.includes("session_id=") || url.includes("payment=success");
          
          // Check for cancel indicators  
          const isCancel = url.includes("payment=canceled") || 
                          url.includes("canceled=true") || 
                          url.includes("/cancel") ||
                          url.startsWith("https://checkout.stripe.com/") && url.includes("cancel");
          
          // Check for custom protocol
          const isCustom = url.startsWith("usuals://payment-");
          
          // Check if leaving Stripe domain entirely or hitting localhost redirect
          const leavesStripe = !url.startsWith("https://checkout.stripe.com/") && 
                              !url.startsWith("https://js.stripe.com/") &&
                              !url.startsWith("https://m.stripe.com/") &&
                              !url.startsWith("https://q.stripe.com/");
          
          // Check for localhost redirects (Electron app URLs)
          const isLocalhost = url.startsWith("http://localhost:9825") || 
                             url.startsWith("http://localhost:3000");

          if (isSuccess || isCancel || isCustom || leavesStripe || isLocalhost) {
            console.log(`[STRIPE-INTERCEPT] Payment flow detected: ${url}`);
            callback({ cancel: true }); // Stop the navigation
            
            // Determine the result
            let resultUrl: string;
            if (isSuccess || isLocalhost && url.includes("session_id=")) {
              resultUrl = url;
              console.log("✅ Payment success detected");
            } else if (isCancel || isLocalhost && url.includes("canceled=true")) {
              resultUrl = url;
              console.log("❌ Payment cancellation detected");
            } else if (isCustom) {
              resultUrl = url;
              console.log("🔗 Custom protocol detected");
            } else {
              resultUrl = "manual://user-canceled";
              console.log("⬅️ User navigated away from Stripe");
            }
            
            forwardResult(resultUrl);
            return;
          }

          // Allow other Stripe resources
          callback({ cancel: false });
        },
      );

      // ──────────────────────────────────────────────────────────
      // ADDITIONAL: Set up window open handler for new windows
      // ──────────────────────────────────────────────────────────
      console.log("🔧 Setting up window open handler");
      paymentWindow.webContents.setWindowOpenHandler(({ url }) => {
        console.log(`[STRIPE-WINDOW-OPEN] New window requested for: ${url}`);
        
        if (url.startsWith("http://localhost:")) {
          console.log(`[STRIPE-WINDOW-OPEN] Intercepting localhost window open: ${url}`);
          forwardResult(url);
          return { action: 'deny' };
        }
        
        return { action: 'allow' };
      });

      // ──────────────────────────────────────────────────────────
      // FALLBACK: will-navigate as backup for any URLs that slip through
      // ──────────────────────────────────────────────────────────
      console.log("🔧 Setting up will-navigate fallback handler");
      paymentWindow.webContents.on("will-navigate", (event, navigationUrl) => {
        if (resultSent) {
          event.preventDefault();
          return;
        }

        console.log(`[STRIPE-FALLBACK] will-navigate to: ${navigationUrl}`);
        
        // Check for localhost URLs that should be intercepted
        if (navigationUrl.startsWith("http://localhost:9825") || 
            navigationUrl.startsWith("http://localhost:3000")) {
          console.log(`[STRIPE-FALLBACK] Intercepting localhost navigation: ${navigationUrl}`);
          event.preventDefault();
          forwardResult(navigationUrl);
          return;
        }

        // Check for other success/cancel patterns
        const isSuccess = navigationUrl.includes("session_id=") || navigationUrl.includes("payment=success");
        const isCancel = navigationUrl.includes("canceled=true") || navigationUrl.includes("payment=canceled");
        const isCustom = navigationUrl.startsWith("usuals://payment-");
        
        if (isSuccess || isCancel || isCustom) {
          console.log(`[STRIPE-FALLBACK] Intercepting payment result: ${navigationUrl}`);
          event.preventDefault();
          forwardResult(navigationUrl);
          return;
        }

        // Allow normal Stripe navigation
        if (navigationUrl.startsWith("https://checkout.stripe.com/")) {
          console.log(`[STRIPE-FALLBACK] Allowing Stripe navigation: ${navigationUrl}`);
          return;
        }

        // Block other external navigation and treat as cancel
        console.log(`[STRIPE-FALLBACK] Blocking external navigation: ${navigationUrl}`);
        event.preventDefault();
        forwardResult("manual://user-canceled");
      });

      // ──────────────────────────────────────────────────────────
      // FINAL FALLBACK: did-navigate for URLs that actually navigated
      // ──────────────────────────────────────────────────────────
      console.log("🔧 Setting up did-navigate final fallback");
      paymentWindow.webContents.on("did-navigate", (event, navigationUrl) => {
        if (resultSent) return;

        console.log(`[STRIPE-DID-NAVIGATE] Navigated to: ${navigationUrl}`);
        
        // If we somehow navigated to localhost (shouldn't happen but just in case)
        if (navigationUrl.startsWith("http://localhost:")) {
          console.log(`[STRIPE-DID-NAVIGATE] ⚠️ Already navigated to localhost: ${navigationUrl}`);
          forwardResult(navigationUrl);
        }
      });

      // Show window when ready
      paymentWindow.once("ready-to-show", () => {
        console.log("✅ Payment window ready to show");
        paymentWindow?.show();
        paymentWindow?.focus();
      });

      // Handle window close - only send result if not already sent
      paymentWindow.on("closed", () => {
        console.log("🔒 Payment window closed");
        if (windowTimeout) {
          clearTimeout(windowTimeout);
          windowTimeout = null;
        }
        
        // Only send cancellation if no result was sent yet
        if (!resultSent) {
          console.log("🔒 Window closed manually, sending cancellation");
          forwardResult("manual://window-closed");
        }
        
        paymentWindow = null;
      });

      // Handle navigation errors - especially for localhost redirect failures
      paymentWindow.webContents.on("did-fail-load", (event, errorCode, errorDescription, validatedURL) => {
        console.log("🚨 === DID-FAIL-LOAD EVENT FIRED ===");
        console.log("🚨 Error Code:", errorCode, "Description:", errorDescription);
        console.log("🚨 Validated URL:", validatedURL);
        console.log("🚨 Current URL:", paymentWindow?.webContents.getURL());
        
        if (resultSent) {
          console.log("🚨 Result already sent, ignoring fail-load");
          return;
        }

        // Get the failed URL (handle different Electron versions)
        const failedUrl = validatedURL && validatedURL.length > 0 ? validatedURL : paymentWindow?.webContents.getURL();
        console.log("🚨 Processing failed URL:", failedUrl);
        
        // Check specifically for localhost URLs (this should catch the ERR_CONNECTION_REFUSED)
        if (failedUrl && failedUrl.includes('localhost:')) {
          console.log("🎯 === LOCALHOST FAILURE DETECTED - PROCESSING PAYMENT RESULT ===");
          console.log("🎯 Failed localhost URL:", failedUrl);
          
          // Extract the result from the failed URL
          if (failedUrl.includes('session_id=')) {
            console.log("✅ Payment success detected from failed localhost URL");
          } else if (failedUrl.includes('canceled=true')) {
            console.log("❌ Payment cancellation detected from failed localhost URL");  
          } else {
            console.log("❓ Unknown localhost failure, treating as cancellation");
          }
          
          forwardResult(failedUrl);
          return;
        }
        
        // For other significant errors, send error result
        if (errorCode !== -3) { // -3 is ERR_ABORTED which we expect from our interception
          console.log("🚨 Non-aborted error, sending error result");
          forwardResult(`error://failed-to-load?error=${encodeURIComponent(errorDescription)}`);
        } else {
          console.log("🚨 Aborted request (expected from interception)");
        }
      });

      // Navigate to Stripe payment URL
      console.log("🌐 Loading payment URL:", paymentUrl);
      
      // Test the interceptors immediately
      console.log("🧪 Testing webRequest interceptor setup");
      console.log("🧪 Testing will-navigate handler setup");
      
      await paymentWindow.loadURL(paymentUrl);

      return { success: true, message: "Payment window opened successfully" };
    } catch (error) {
      console.error("❌ Failed to open payment window:", error);
      
      // Clean up on error
      if (paymentWindow && !paymentWindow.isDestroyed()) {
        paymentWindow.close();
        paymentWindow = null;
      }
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error opening payment window" 
      };
    }
  },

  // Close payment window
  closePaymentWindow: async (event) => {
    if (paymentWindow && !paymentWindow.isDestroyed()) {
      paymentWindow.close();
      paymentWindow = null;
    }
    return { success: true };
  }
};
