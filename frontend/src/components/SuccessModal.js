/**
 * Success Modal Component
 * Beautiful modal shown after successful email submission
 */

import React, { useEffect, useState } from 'react';

const SuccessModal = ({ isOpen, onClose, event, onRedirect }) => {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(5);
      return;
    }

    // Reset countdown when modal opens
    setCountdown(5);

    let countdownInterval;
    let redirectTimer;

    // Countdown timer - decrement every second
    countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // When countdown reaches 1, clear interval and redirect
          clearInterval(countdownInterval);
          // Small delay to ensure state update completes
          setTimeout(() => {
            if (onRedirect) {
              console.log('Auto-redirecting after countdown...');
              onRedirect();
            }
            onClose();
          }, 100);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Fallback: Auto-redirect after exactly 5 seconds
    redirectTimer = setTimeout(() => {
      console.log('Fallback redirect triggered after 5 seconds');
      clearInterval(countdownInterval);
      if (onRedirect) {
        onRedirect();
      }
      onClose();
    }, 5000);

    return () => {
      if (countdownInterval) clearInterval(countdownInterval);
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [isOpen, onClose, onRedirect]);

  if (!isOpen) return null;

  const handleRedirectClick = () => {
    if (onRedirect) {
      onRedirect();
    }
    onClose();
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
            You'll be redirected to the event page in <strong className="text-primary-600 text-lg">{countdown} {countdown === 1 ? 'second' : 'seconds'}</strong> to complete your ticket purchase.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col space-y-3">
          {event && event.originalEventUrl && (
            <a
              href={event.originalEventUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleRedirectClick}
              className="w-full btn btn-primary py-3 font-semibold text-center"
            >
              Go to Event Page →
            </a>
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
