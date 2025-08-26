import React, { useState, useEffect } from 'react';
// import { useAuth } from '../hooks/useAuth';
import { formatCredits } from '../config/creditPlans';

const PaymentSuccess = ({ onClose }) => {
  // const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [sessionDetails, setSessionDetails] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');

    if (sessionId) {
      verifyAndLoadSession(sessionId);
    } else {
      setError('No session ID found');
      setLoading(false);
    }
  }, []);

  const verifyAndLoadSession = async (sessionId) => {
    try {
      setLoading(true);
      
      // Verify session and add credits
              const verifyResponse = await fetch(`https://backend.usuals.ai/credits/verify-session?session_id=${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!verifyResponse.ok) {
        throw new Error('Failed to verify session');
      }

      const verifyResult = await verifyResponse.json();
      setVerified(verifyResult.verified);

      if (verifyResult.verified) {
        // Get detailed session info
                  const detailsResponse = await fetch(`https://backend.usuals.ai/credits/stripe-session-details?session_id=${sessionId}`, {
                  headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
        });

        if (detailsResponse.ok) {
          const detailsResult = await detailsResponse.json();
          setSessionDetails(detailsResult.session);
        }
      } else {
        setError('Payment verification failed');
      }
    } catch (err) {
      console.error('Failed to verify session:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amountInCents) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amountInCents / 100);
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 rounded-lg border border-gray-700 p-8 max-w-md w-full">
          <div className="flex items-center justify-center mb-4">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-white text-center">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg border border-gray-700 max-w-lg w-full">
        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700 p-6 flex justify-between items-center">
          <h2 className="text-white text-2xl font-bold">
            {verified ? 'Payment Successful!' : 'Payment Status'}
          </h2>
          <button 
            onClick={onClose}
            className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {error ? (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-900 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-white text-xl font-bold mb-2">Verification Failed</h3>
              <p className="text-gray-400 mb-4">{error}</p>
              <p className="text-gray-500 text-sm">Please contact support if this issue persists.</p>
            </div>
          ) : verified ? (
            <div>
              {/* Success Icon */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-900 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-white text-xl font-bold mb-2">Payment Successful!</h3>
                <p className="text-gray-400">Your credits have been added to your account.</p>
              </div>

              {/* Payment Details */}
              {sessionDetails && (
                <div className="bg-gray-800 rounded-lg p-4 space-y-3">
                  <h4 className="text-white font-medium mb-3">Payment Details</h4>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400">Credits Purchased:</span>
                    <span className="text-white font-medium">
                      {sessionDetails.metadata?.credits ? formatCredits(parseInt(sessionDetails.metadata.credits)) : 'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400">Amount Paid:</span>
                    <span className="text-white font-medium">
                      {formatCurrency(sessionDetails.amount_total)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400">Date:</span>
                    <span className="text-white font-medium">
                      {formatDate(sessionDetails.created)}
                    </span>
                  </div>
                  
                  {sessionDetails.customer_email && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Email:</span>
                      <span className="text-white font-medium">
                        {sessionDetails.customer_email}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400">Transaction ID:</span>
                    <span className="text-white font-medium text-sm">
                      {sessionDetails.id}
                    </span>
                  </div>
                </div>
              )}

              {/* Continue Button */}
              <div className="mt-6 text-center">
                <button
                  onClick={onClose}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Continue to App
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-yellow-900 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-white text-xl font-bold mb-2">Payment Not Verified</h3>
              <p className="text-gray-400 mb-4">We couldn't verify your payment at this time.</p>
              <p className="text-gray-500 text-sm">Please contact support for assistance.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
