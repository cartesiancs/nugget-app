import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { creditPlans, formatPrice, formatCredits } from '../config/creditPlans';
import { API_BASE_URL } from '../config/baseurl.js';

// Check if we're in Electron environment
const isElectron = typeof window !== 'undefined' && window.electronAPI && window.electronAPI.req;

const CreditPurchase = ({ onClose, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [notification, setNotification] = useState(null);

  // Memoize verifyStripeSession to prevent infinite re-renders
  const verifyStripeSession = useCallback(async (sessionId) => {
    try {
      console.log('🔍 Verifying Stripe session:', sessionId);
      
      // Use consistent token name - check both possible locations
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/credits/verify-session?session_id=${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to verify session');
      }

      const result = await response.json();
      
      if (result.verified) {
        const credits = result.session.metadata?.credits;
        setNotification({
          type: 'success',
          message: `Payment successful! ${credits ? `${formatCredits(parseInt(credits))} credits` : 'Credits'} added to your account.`
        });
        
        // Call onSuccess callback if provided
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 2000);
        }
      } else {
        setNotification({
          type: 'error',
          message: 'Payment verification failed. Please contact support.'
        });
      }
    } catch (error) {
      console.error('❌ Failed to verify session:', error);
      setNotification({
        type: 'error',
        message: 'Failed to verify payment. Please contact support.'
      });
    }
  }, [onSuccess]);

  // Clear notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Set up Electron payment result listener
  useEffect(() => {
    if (isElectron && window.electronAPI?.payment) {
      const handlePaymentResult = (event, resultUrl) => {
        console.log('Payment result received:', resultUrl);
        
        // Reset loading state
        setLoading(false);
        setSelectedPlan(null);
        
        try {
          // Handle special protocol results from Electron
          if (resultUrl.startsWith('timeout://')) {
            setNotification({
              type: 'error',
              message: 'Payment window timed out. Please try again.'
            });
            return;
          }
          
          if (resultUrl.startsWith('error://')) {
            const errorMatch = resultUrl.match(/error=([^&]+)/);
            const errorMsg = errorMatch ? decodeURIComponent(errorMatch[1]) : 'Unknown error';
            setNotification({
              type: 'error',
              message: `Payment error: ${errorMsg}. Please try again.`
            });
            return;
          }
          
          if (resultUrl.startsWith('manual://')) {
            let message = 'Payment was canceled. You can try again anytime.';
            if (resultUrl.includes('window-closed')) {
              message = 'Payment window was closed. You can try again anytime.';
            } else if (resultUrl.includes('user-canceled')) {
              message = 'You left the payment page. You can try again anytime.';
            }
            setNotification({
              type: 'info',
              message: message
            });
            return;
          }

          let urlParams, sessionId, canceled;
          try {
            // Try to parse as regular URL first
            urlParams = new URLSearchParams(new URL(resultUrl).search);
            sessionId = urlParams.get('session_id');
            canceled = urlParams.get('canceled');
          } catch (urlError) {
            // If URL parsing fails (e.g., custom protocol), extract params manually
            console.log('URL parsing failed, extracting params manually:', urlError);
            const sessionMatch = resultUrl.match(/session_id=([^&]+)/);
            const cancelMatch = resultUrl.match(/canceled=([^&]+)/);
            sessionId = sessionMatch ? sessionMatch[1] : null;
            canceled = cancelMatch ? cancelMatch[1] : null;
          }

          // Check for specific Electron redirect patterns
          const isPaymentSuccess = resultUrl.startsWith('usuals://payment-success') || resultUrl.includes('localhost:9825/success') || resultUrl.includes('success');
          const isPaymentCancel = resultUrl.startsWith('usuals://payment-cancel') || (resultUrl.includes('localhost:9825') && (canceled === 'true' || resultUrl.includes('canceled=true'))) || resultUrl.includes('canceled=true');

          if (sessionId && isPaymentSuccess) {
            // Success: Verify the session
            console.log('🎉 Payment session found, verifying:', sessionId);
            verifyStripeSession(sessionId);
          } else if (isPaymentCancel) {
            console.log('🚫 Payment was canceled');
            setNotification({
              type: 'info',
              message: 'Payment was canceled. You can try again anytime.'
            });
          } else if (sessionId) {
            // Session ID found but not clearly success/cancel - verify anyway
            console.log('🤔 Payment session found but status unclear, verifying:', sessionId);
            verifyStripeSession(sessionId);
          } else {
            // Handle unknown result
            console.log('❓ Unknown payment result:', resultUrl);
            setNotification({
              type: 'error',
              message: 'Payment result unclear. Please check your account or contact support.'
            });
          }
        } catch (error) {
          console.error('❌ Error processing payment result:', error);
          setNotification({
            type: 'error',
            message: 'Error processing payment result. Please contact support.'
          });
        }
      };

      console.log('🔧 Setting up Electron payment result listener');
      window.electronAPI.payment.onResult(handlePaymentResult);
      
      return () => {
        console.log('🧹 Cleaning up Electron payment result listener');
        if (window.electronAPI?.payment?.removeResultListener) {
          window.electronAPI.payment.removeResultListener();
        }
      };
    }
  }, [verifyStripeSession]);

  // Check for success/cancel parameters in URL (for web redirects only)
  useEffect(() => {
    // Only handle URL parameters for web (not Electron)
    if (!isElectron) {
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session_id');
      const canceled = urlParams.get('canceled');

      if (sessionId) {
        console.log('🌐 Web redirect - verifying session:', sessionId);
        // Success: Verify the session
        verifyStripeSession(sessionId);
        
        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname);
      } else if (canceled === 'true') {
        console.log('🌐 Web redirect - payment canceled');
        setNotification({
          type: 'info',
          message: 'Payment was canceled. You can try again anytime.'
        });
        
        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [verifyStripeSession]);

  const handlePurchase = async (plan) => {
    if (!user?.id) {
      setNotification({
        type: 'error',
        message: 'Please log in to purchase credits'
      });
      return;
    }

    setLoading(true);
    setSelectedPlan(plan.id);

    try {
      console.log('🛒 Starting purchase for plan:', plan);
      
      // Use consistent token name - check both possible locations
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }
      
      // Create checkout session via backend
      const response = await fetch(`${API_BASE_URL}/credits/create_checkout_session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          planType: plan.name,
          email: user.email,
          userId: user.id,
          credits: plan.credits,
          amount: plan.price, // in dollars
          clientType: isElectron ? 'electron' : undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.message || errorData.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      
      if (!url) {
        throw new Error('No checkout URL received from server');
      }
      
      if (isElectron && window.electronAPI?.payment) {
        // Electron: Open payment window via IPC
        console.log('🔗 Opening Stripe checkout in payment window:', url);
        
        try {
          const result = await window.electronAPI.payment.openStripe(url);
          if (!result || !result.success) {
            throw new Error(result?.error || 'Failed to open payment window');
          }
          
          console.log('✅ Payment window opened successfully');
          // Don't set loading to false here - wait for payment result
          return;
        } catch (ipcError) {
          console.error('❌ IPC Error:', ipcError);
          throw new Error(`Failed to open payment window: ${ipcError.message}`);
        }
      } else {
        // Web: Direct redirect to Stripe Checkout
        console.log('🔗 Redirecting to Stripe checkout:', url);
        window.location.href = url;
        return; // Don't reset loading state since we're redirecting
      }

    } catch (error) {
      console.error('❌ Purchase failed:', error);
      setNotification({
        type: 'error',
        message: `Purchase failed: ${error.message}`
      });
      setLoading(false);
      setSelectedPlan(null);
    }
  };



  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg border border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-white text-2xl font-bold">Purchase Credits</h2>
            <p className="text-gray-400 mt-1">Choose a plan that works best for you</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`mx-6 mt-6 p-4 rounded-lg flex items-center gap-3 ${
            notification.type === 'success' ? 'bg-green-900 border border-green-700 text-green-100' :
            notification.type === 'error' ? 'bg-red-900 border border-red-700 text-red-100' :
            'bg-blue-900 border border-blue-700 text-blue-100'
          }`}>
            <div className={`w-5 h-5 ${
              notification.type === 'success' ? 'text-green-400' :
              notification.type === 'error' ? 'text-red-400' :
              'text-blue-400'
            }`}>
              {notification.type === 'success' && (
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {notification.type === 'error' && (
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              )}
              {notification.type === 'info' && (
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <span>{notification.message}</span>
          </div>
        )}

        {/* Credit Plans */}
        <div className="p-6">
          <div className="grid md:grid-cols-3 gap-6">
            {creditPlans.map((plan) => (
              <div 
                key={plan.id}
                className={`relative bg-gray-800 rounded-lg border-2 transition-all duration-200 hover:border-blue-500 ${
                  plan.popular ? 'border-blue-500 shadow-lg shadow-blue-500/20' : 'border-gray-700'
                } ${
                  selectedPlan === plan.id ? 'opacity-75' : ''
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                 
                  </div>
                )}

                <div className="p-6">
                  {/* Plan Header */}
                  <div className="text-center mb-6">
                    <h3 className="text-white text-xl font-bold mb-2">{plan.name}</h3>
                    <div className="text-3xl font-bold text-blue-400 mb-1">
                      {formatPrice(plan.price)}
                    </div>
                    <p className="text-gray-400 text-sm">
                      {formatCredits(plan.credits)} credits
                    </p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-gray-300 text-sm">
                        <svg className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {/* Purchase Button */}
                  <button
                    onClick={() => handlePurchase(plan)}
                    disabled={loading}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                      plan.popular
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-700 hover:bg-gray-600 text-white'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {loading && selectedPlan === plan.id ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                      </div>
                    ) : (
                      `Purchase ${formatCredits(plan.credits)} Credits`
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Security Notice */}
          <div className="mt-8 p-4 bg-gray-800 rounded-lg border border-gray-700">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div>
                <h4 className="text-white font-medium">Secure Payment</h4>
                <p className="text-gray-400 text-sm">Your payment is processed securely through Stripe. We never store your payment information.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditPurchase;
