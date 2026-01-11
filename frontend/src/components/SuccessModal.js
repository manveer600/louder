/**
 * Success Modal Component
 * Beautiful modal shown after successful email submission
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';

const SuccessModal = ({ isOpen, onClose, event, onRedirect }) => {
  const [countdown, setCountdown] = useState(5);
  const redirectUrlRef = useRef(null);
  const redirectTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const performRedirectRef = useRef(null);

  // Redirect function (reusable by both auto-redirect and button)
  // Store in ref to ensure it's always accessible in setTimeout closure
  const performRedirect = useCallback((url) => {
    if (!url || !url.trim()) {
      console.error('❌ Invalid redirect URL:', url);
      alert('Error: Invalid event URL. Please contact support.');
      return false;
    }

    // Validate URL format
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      console.error('❌ Invalid URL format:', url);
      alert('Error: Invalid URL format. Please contact support.');
      return false;
    }

    console.log('🚀 Performing redirect to:', url);
    
    // Method 1: Try window.open (preferred - opens in new tab)
    let popupBlocked = false;
    try {
      const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
      
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        // Popup was likely blocked
        popupBlocked = true;
        console.log('⚠️ Popup appears to be blocked');
      } else {
        // Check if we can access the window (indicates it opened)
        try {
          // Try to access window properties (will throw if blocked)
          const test = newWindow.location;
          console.log('✅ Opened event page in new tab using window.open');
          return true; // Success - new tab opened
        } catch (e) {
          // Cross-origin - can't check, but window exists so assume success
          console.log('✅ Opened event page in new tab (cross-origin check)');
          return true; // Success - new tab likely opened
        }
      }
    } catch (error) {
      console.error('❌ Error with window.open:', error);
      popupBlocked = true;
    }
    
    // Method 2: If popup was blocked, try link element (sometimes works when window.open doesn't)
    if (popupBlocked) {
      try {
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        
        setTimeout(() => {
          if (document.body.contains(link)) {
            document.body.removeChild(link);
          }
        }, 100);
        
        console.log('✅ Used link element method to open event page');
        // Assume success - can't reliably check
        return true;
      } catch (error) {
        console.error('❌ Error with link element method:', error);
      }
    }
    
    // Method 3: Final fallback - redirect current window
    // This ensures redirect ALWAYS happens
    console.log('⚠️ Using final fallback: redirecting current window');
    try {
      window.location.href = url;
      console.log('✅ Redirected current window to:', url);
      return true;
    } catch (error) {
      console.error('❌ Error redirecting current window:', error);
      alert('Unable to redirect automatically. Please click the "Go to Event Page" button or copy this URL: ' + url);
      return false;
    }
  }, []); // Empty deps - function doesn't depend on any props or state

  // Store redirect function in ref for setTimeout access
  useEffect(() => {
    performRedirectRef.current = performRedirect;
  }, [performRedirect]);

  useEffect(() => {
    if (!isOpen || !event || !event.originalEventUrl) {
      setCountdown(5);
      // Clear any existing timers
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
        redirectTimerRef.current = null;
      }
      return;
    }

    // Capture redirect URL immediately and persist it
    const redirectUrl = event.originalEventUrl;
    redirectUrlRef.current = redirectUrl;
    localStorage.setItem('pendingRedirectUrl', redirectUrl);
    console.log('✅ Redirect URL captured and persisted:', redirectUrl);

    // Reset countdown when modal opens
    setCountdown(5);

    // UI-only countdown timer (separate from redirect logic)
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        const newCount = prev - 1;
        return newCount >= 0 ? newCount : 0;
      });
    }, 1000);

    // Auto-redirect timer (independent of countdown state, depends ONLY on redirect URL)
    // Capture URL directly in closure to ensure it's available
    redirectTimerRef.current = setTimeout(() => {
      console.log('⏰ Auto-redirect timer triggered after 5 seconds');
      
      // Get URL from multiple sources (most reliable)
      const finalRedirectUrl = redirectUrlRef.current || 
                               localStorage.getItem('pendingRedirectUrl') || 
                               redirectUrl;
      
      console.log('🔗 Final redirect URL:', finalRedirectUrl);
      console.log('🔗 redirectUrlRef.current:', redirectUrlRef.current);
      console.log('🔗 localStorage:', localStorage.getItem('pendingRedirectUrl'));
      console.log('🔗 redirectUrl (closure):', redirectUrl);
      
      if (!finalRedirectUrl) {
        console.error('❌ No redirect URL available in timer callback');
        alert('Error: Event URL not found. Please click "Go to Event Page" button.');
        return;
      }
      
      // Clear countdown interval
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      
      // Perform redirect using the stored URL
      console.log('🚀 Executing redirect to:', finalRedirectUrl);
      const redirectFn = performRedirectRef.current || performRedirect;
      const redirectResult = redirectFn(finalRedirectUrl);
      
      if (redirectResult) {
        console.log('✅ Redirect executed successfully');
      } else {
        console.warn('⚠️ Redirect may have been blocked. User should click button manually.');
      }
      
      // Clear stored URL
      localStorage.removeItem('pendingRedirectUrl');
      
      // Close modal after redirect (with small delay to ensure redirect happens)
      setTimeout(() => {
        if (onClose) {
          onClose();
        }
      }, 300);
    }, 5000); // 5 seconds

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up timers');
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
        redirectTimerRef.current = null;
      }
    };
  }, [isOpen, event, onClose]); // Removed performRedirect from deps - it's stable

  if (!isOpen) return null;

  const handleRedirectClick = (e) => {
    if (e) {
      e.preventDefault();
    }
    
    // Clear auto-redirect timer since user is manually redirecting
    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current);
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    
    // Get redirect URL from ref, localStorage, or event (in that order)
    const redirectUrl = redirectUrlRef.current || 
                       localStorage.getItem('pendingRedirectUrl') || 
                       (event && event.originalEventUrl);
    
    if (redirectUrl) {
      console.log('🖱️ Manual redirect button clicked. Redirecting to:', redirectUrl);
      performRedirect(redirectUrl);
      
      // Clear stored URL
      localStorage.removeItem('pendingRedirectUrl');
    } else {
      console.error('❌ No redirect URL available for manual redirect');
    }
    
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content relative max-w-lg" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Success Icon */}
        <div className="text-center mb-6">
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Thank You!
          </h2>
          <p className="text-gray-600">
            Your email has been registered successfully
          </p>
        </div>

        {/* Event Info */}
        {event && (
          <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-6 mb-6 border border-primary-200">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-2xl">
                    {event.category === 'Music' ? '🎵' :
                     event.category === 'Sports' ? '⚽' :
                     event.category === 'Comedy' ? '😄' :
                     event.category === 'Theater' ? '🎭' :
                     event.category === 'Arts' ? '🎨' :
                     event.category === 'Technology' ? '💻' :
                     event.category === 'Food & Drink' ? '🍕' :
                     '🎉'}
                  </span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-lg mb-1">{event.title}</h3>
                <p className="text-sm text-gray-600 mb-2">
                  {new Date(event.date).toLocaleDateString('en-AU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                <p className="text-sm text-gray-600">{event.venue || 'Sydney, Australia'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        <div className="mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-green-800 mb-1">
                  Email registered successfully!
                </p>
                <p className="text-sm text-green-700">
                  Your email has been saved. You'll be redirected to the event page to purchase tickets.
                </p>
              </div>
            </div>
          </div>

          <p className="text-gray-700 text-center">
            {countdown > 0 ? (
              <>You'll be redirected to the event page in <strong className="text-primary-600 text-lg">{countdown} {countdown === 1 ? 'second' : 'seconds'}</strong> to complete your ticket purchase.</>
            ) : (
              <>Redirecting to event page...</>
            )}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col space-y-3">
          {event && event.originalEventUrl && (
            <button
              onClick={handleRedirectClick}
              className="w-full btn btn-primary py-3 font-semibold text-center"
            >
              Go to Event Page →
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full btn btn-secondary py-3"
          >
            Stay Here
          </button>
        </div>

        {/* Footer Note */}
        <p className="text-xs text-gray-500 text-center mt-4">
          Click "Go to Event Page" to visit {event?.sourceWebsite || 'the event website'} and purchase tickets
        </p>
      </div>
    </div>
  );
};

export default SuccessModal;
