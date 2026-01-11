/**
 * Event Listing Component
 * Main component for displaying events with filters
 */

import React, { useState, useEffect, useCallback } from 'react';
import { eventAPI } from '../services/api';
import EventCard from './EventCard';
import FilterBar from './FilterBar';
import EmailModal from './EmailModal';
import SuccessModal from './SuccessModal';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

const EventListing = () => {
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    dateFrom: '',
    dateTo: '',
    upcomingOnly: true
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1
  });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [emailSubmitted, setEmailSubmitted] = useState(false);

  // Fetch events
  const fetchEvents = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page,
        limit: pagination.limit,
        upcomingOnly: filters.upcomingOnly,
        ...(filters.category && { category: filters.category }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo }),
        sortBy: 'date',
        sortOrder: 'asc'
      };

      const response = await eventAPI.getEvents(params);

      if (response && response.success) {
        setEvents(response.data?.events || []);
        setPagination(response.data?.pagination || pagination);
        setError(null); // Clear any previous errors
      } else {
        setError(response?.message || 'Failed to fetch events');
      }
    } catch (err) {
      console.error('Fetch events error:', err);
      const errorMessage = err.message || 'Failed to fetch events. Please ensure the backend server is running on port 5000.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      console.log('Fetching categories...');
      const response = await eventAPI.getCategories();
      console.log('Categories response:', response);
      
      if (response && response.success && response.data) {
        const cats = response.data.categories || [];
        console.log('Setting categories:', cats);
        setCategories(cats);
        
        // If still empty after API call, use fallback
        if (cats.length === 0) {
          console.log('No categories in response, using fallback');
          const defaultCategories = [
            'Music', 'Sports', 'Comedy', 'Theater', 'Arts', 
            'Technology', 'Food & Drink', 'Business', 'Education', 
            'Health & Wellness', 'Family', 'Other'
          ].map(name => ({ name, count: 0 }));
          setCategories(defaultCategories);
        }
      } else {
        console.log('Invalid response format, using fallback');
        // Fallback: use default categories if API fails
        const defaultCategories = [
          'Music', 'Sports', 'Comedy', 'Theater', 'Arts', 
          'Technology', 'Food & Drink', 'Business', 'Education', 
          'Health & Wellness', 'Family', 'Other'
        ].map(name => ({ name, count: 0 }));
        setCategories(defaultCategories);
      }
    } catch (err) {
      console.error('Fetch categories error:', err);
      // Fallback: use default categories on error
      const defaultCategories = [
        'Music', 'Sports', 'Comedy', 'Theater', 'Arts', 
        'Technology', 'Food & Drink', 'Business', 'Education', 
        'Health & Wellness', 'Family', 'Other'
      ].map(name => ({ name, count: 0 }));
      setCategories(defaultCategories);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchEvents(1);
    fetchCategories();
  }, []);

  // Refetch when filters change
  useEffect(() => {
    fetchEvents(1);
  }, [filters]);

  // Handle filter change
  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    fetchEvents(newPage);
    setPagination(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle "GET TICKETS" click
  const handleGetTickets = (event) => {
    // Validate event object has required fields
    if (!event || !event._id) {
      console.error('Invalid event object:', event);
      setError('Invalid event data. Please refresh the page and try again.');
      return;
    }
    console.log('Opening email modal for event:', event._id, event.title);
    setSelectedEvent(event);
    setShowEmailModal(true);
  };

  // Handle email modal close
  const handleEmailModalClose = () => {
    setShowEmailModal(false);
    setSelectedEvent(null);
  };

  // Handle email submission success
  const handleEmailSubmitted = () => {
    setEmailSubmitted(true);
    setShowEmailModal(false);
    setShowSuccessModal(true);
  };

  // Handle redirect to event page
  const handleRedirectToEvent = () => {
    if (selectedEvent && selectedEvent.originalEventUrl) {
      const eventUrl = selectedEvent.originalEventUrl;
      console.log('Redirecting to event URL:', eventUrl);
      
      // Try to open in new tab first (preferred)
      try {
        const newWindow = window.open(eventUrl, '_blank', 'noopener,noreferrer');
        
        // Check if popup was blocked
        setTimeout(() => {
          if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
            // Popup blocked or failed - redirect current window
            console.log('Popup blocked, redirecting current window instead');
            window.location.href = eventUrl;
          } else {
            // Successfully opened new window
            console.log('Opened event page in new tab');
          }
        }, 100);
      } catch (error) {
        // Fallback: redirect current window
        console.error('Error opening new window, redirecting current window:', error);
        window.location.href = eventUrl;
      }
    } else {
      console.error('No event URL found:', selectedEvent);
      alert('Error: Event URL not found. Please try again.');
    }
    
    // Close modal after redirect attempt
    setShowSuccessModal(false);
    setSelectedEvent(null);
    setEmailSubmitted(false);
  };

  // Handle success modal close
  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    setSelectedEvent(null);
    setEmailSubmitted(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Live Events in Sydney
        </h2>
        <p className="text-gray-600">
          Discover upcoming events, concerts, shows, and more happening in Sydney, Australia
        </p>
      </div>

      {/* Filter Bar */}
      <FilterBar
        categories={categories}
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      {/* Loading State */}
      {loading && events.length === 0 && (
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner />
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <ErrorMessage message={error} onRetry={() => fetchEvents(pagination.page)} />
      )}

      {/* Events Grid */}
      {!loading && !error && (
        <>
          {events.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-gray-400 text-6xl mb-4">📅</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No events found
              </h3>
              <p className="text-gray-500">
                Try adjusting your filters or check back later for new events.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {events.map((event) => (
                  <EventCard
                    key={event._id}
                    event={event}
                    onGetTickets={handleGetTickets}
                  />
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-8">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-gray-700">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}

              {/* Results Count */}
              <div className="text-center text-gray-500 text-sm mt-4">
                Showing {events.length} of {pagination.total} events
              </div>
            </>
          )}
        </>
      )}

      {/* Email Modal */}
      {showEmailModal && selectedEvent && (
        <EmailModal
          event={selectedEvent}
          onClose={handleEmailModalClose}
          onSuccess={handleEmailSubmitted}
        />
      )}

      {/* Success Modal */}
      {showSuccessModal && selectedEvent && (
        <SuccessModal
          isOpen={showSuccessModal}
          event={selectedEvent}
          onClose={handleSuccessModalClose}
          onRedirect={handleRedirectToEvent}
        />
      )}
    </div>
  );
};

export default EventListing;

