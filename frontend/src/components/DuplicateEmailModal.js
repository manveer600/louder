/**
 * Duplicate Email Modal Component
 * Shown when user has already provided email for this event
 */

import React from 'react';

const DuplicateEmailModal = ({ isOpen, onClose, event, onRedirect }) => {
  if (!isOpen) return null;

  const handleRedirectClick = (e) => {
    // Prevent default link behavior if it's a link click
    if (e) {
      e.preventDefault();
    }
    
    if (onRedirect && event) {
      console.log('🖱️ Manual redirect button clicked for event:', event.title);
      onRedirect(event); // Pass event to ensure correct redirect
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

        {/* Info Icon */}
        <div className="text-center mb-6">
          <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Already Registered
          </h2>
          <p className="text-gray-600">
            You have already provided your email for this event
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

        {/* Message */}
        <div className="mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              You're all set! You can now proceed directly to purchase your tickets.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col space-y-3">
          {event && event.originalEventUrl && (
            <button
              onClick={handleRedirectClick}
              className="w-full btn btn-primary py-3 font-semibold text-center"
            >
              Continue to Booking →
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full btn btn-secondary py-3"
          >
            Cancel
          </button>
        </div>

        {/* Footer Note */}
        <p className="text-xs text-gray-500 text-center mt-4">
          You'll be redirected to {event?.sourceWebsite || 'the event website'} to complete your ticket purchase
        </p>
      </div>
    </div>
  );
};

export default DuplicateEmailModal;
