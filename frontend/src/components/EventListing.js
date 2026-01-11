/**
 * Event Listing Component
 * Main component for displaying events with filters
 */

import React, { useState, useEffect, useCallback } from 'react';
import { eventAPI, userAPI } from '../services/api';
import EventCard from './EventCard';
import FilterBar from './FilterBar';
import EmailModal from './EmailModal';
import SuccessModal from './SuccessModal';
import DuplicateEmailModal from './DuplicateEmailModal';
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
    upcomingOnly: true,
    latitude: null,
    longitude: null,
    radius: null
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
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
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
        ...(filters.latitude && filters.longitude && {
          latitude: filters.latitude,
          longitude: filters.longitude,
          ...(filters.radius && { radius: filters.radius })
        }),
        sortBy: 'date',
        sortOrder: 'asc'
      };

      const response = await eventAPI.getEvents(params);

      if (response && response.success) {
        setEvents(response.data?.events || []);
        // Update pagination with response data, ensuring page is set correctly
        const newPagination = response.data?.pagination || {
          page: page,
          limit: pagination.limit,
          total: 0,
          totalPages: 1
        };
        setPagination(newPagination);
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
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchEvents(1);
  }, [filters]);

  // Handle filter change
  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    // Validate page number
    if (newPage < 1 || (pagination.totalPages > 0 && newPage > pagination.totalPages)) {
      console.warn('Invalid page number:', newPage);
      return;
    }
    
    console.log('Changing page from', pagination.page, 'to', newPage);
    
    // Update pagination state first, then fetch
    setPagination(prev => ({ ...prev, page: newPage }));
    
    // Fetch events with new page
    fetchEvents(newPage);
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle "GET TICKETS" click
  const handleGetTickets = async (event) => {
    // Validate event object has required fields
    if (!event || !event._id) {
      console.error('Invalid event object:', event);
      setError('Invalid event data. Please refresh the page and try again.');
      return;
    }

    console.log('Selected event for tickets:', {
      id: event._id,
      title: event.title,
      originalEventUrl: event.originalEventUrl,
      fullEvent: event
    });

    setSelectedEvent(event);
    setShowEmailModal(true);
  };

  // Handle email modal close
  const handleEmailModalClose = () => {
    setShowEmailModal(false);
    setSelectedEvent(null);
  };

  // Handle email submission success
  const handleEmailSubmitted = (alreadyExists = false) => {
    setShowEmailModal(false);
    
    if (alreadyExists) {
      // Email already exists - show duplicate modal
      setShowDuplicateModal(true);
    } else {
      // New email - show success modal
      setEmailSubmitted(true);
      setShowSuccessModal(true);
    }
  };

  // Handle redirect to event page
  const handleRedirectToEvent = (eventToRedirect = selectedEvent) => {
    console.log('🔄 handleRedirectToEvent called');
    console.log('Event to redirect:', eventToRedirect);
    
    if (!eventToRedirect) {
      console.error('❌ No event found for redirect');
      alert('Error: Event information not found. Please try again.');
      return;
    }

    // Use originalEventUrl from the event - this should be the correct source URL
    let eventUrl = eventToRedirect.originalEventUrl;
    
    // Validate URL exists and is from the correct source
    if (!eventUrl || eventUrl.trim() === '') {
      console.error('❌ No event URL found in event:', eventToRedirect);
      alert('Error: Event URL not found. Please contact support.');
      setShowSuccessModal(false);
      setShowDuplicateModal(false);
      setSelectedEvent(null);
      setEmailSubmitted(false);
      return;
    }

    // Ensure URL is valid
    if (!eventUrl.startsWith('http://') && !eventUrl.startsWith('https://')) {
      console.error('❌ Invalid URL format:', eventUrl);
      alert('Error: Invalid event URL format.');
      return;
    }

    // Verify URL matches the event source (for debugging)
    const sourceWebsite = eventToRedirect.sourceWebsite;
    if (sourceWebsite === 'Eventbrite' && !eventUrl.includes('eventbrite')) {
      console.warn('⚠️ Warning: Eventbrite event has non-Eventbrite URL:', eventUrl);
    } else if (sourceWebsite === 'Meetup' && !eventUrl.includes('meetup')) {
      console.warn('⚠️ Warning: Meetup event has non-Meetup URL:', eventUrl);
    }

    console.log(`🚀 Opening ${sourceWebsite} event URL in new tab:`, eventUrl);
    
    // Try multiple methods to ensure redirect works
    let redirectSuccess = false;
    
    try {
      // Method 1: window.open (preferred - opens in new tab)
      const newWindow = window.open(eventUrl, '_blank', 'noopener,noreferrer');
      
      // Check if popup was blocked
      if (newWindow && !newWindow.closed && typeof newWindow.closed !== 'undefined') {
        console.log('✅ Opened event page in new tab using window.open');
        redirectSuccess = true;
      } else {
        console.log('⚠️ Popup blocked, trying alternative method...');
      }
    } catch (error) {
      console.error('❌ Error with window.open:', error);
    }
    
    // Method 2: If window.open failed, use link element
    if (!redirectSuccess) {
      try {
        const link = document.createElement('a');
        link.href = eventUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        
        // Clean up after a short delay
        setTimeout(() => {
          if (document.body.contains(link)) {
            document.body.removeChild(link);
          }
        }, 100);
        
        console.log('✅ Used link element method to open event page');
        redirectSuccess = true;
      } catch (error) {
        console.error('❌ Error with link element method:', error);
      }
    }
    
    // Method 3: Final fallback - redirect current window
    if (!redirectSuccess) {
      console.log('⚠️ Using final fallback: redirecting current window');
      window.location.href = eventUrl;
    }
    
    // Close modals after redirect attempt (with small delay to ensure redirect happens)
    setTimeout(() => {
      setShowSuccessModal(false);
      setShowDuplicateModal(false);
      setSelectedEvent(null);
      setEmailSubmitted(false);
    }, 300);
  };

  // Handle success modal close
  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    setSelectedEvent(null);
    setEmailSubmitted(false);
  };

  // Handle duplicate modal close
  const handleDuplicateModalClose = () => {
    setShowDuplicateModal(false);
    setSelectedEvent(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Live Events in Sydney
          </h2>
          <p className="text-gray-600">
            Discover upcoming events, concerts, shows, and more happening in Sydney, Australia
          </p>
        </div>
        {/* Admin Export Button */}
        <a
          href={`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/v1'}/export/analytics?format=csv`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary px-4 py-2 text-sm"
          download
        >
          📊 Export Analytics
        </a>
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
                    onClick={() => {
                      const prevPage = pagination.page - 1;
                      console.log('Previous button clicked, going to page:', prevPage);
                      handlePageChange(prevPage);
                    }}
                    disabled={pagination.page <= 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors font-medium"
                  >
                    ← Previous
                  </button>
                  <span className="px-4 py-2 text-gray-700 font-medium">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => {
                      const nextPage = pagination.page + 1;
                      console.log('Next button clicked, going to page:', nextPage);
                      handlePageChange(nextPage);
                    }}
                    disabled={pagination.page >= pagination.totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors font-medium"
                  >
                    Next →
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

      {/* Duplicate Email Modal */}
      {showDuplicateModal && selectedEvent && (
        <DuplicateEmailModal
          isOpen={showDuplicateModal}
          event={selectedEvent}
          onClose={handleDuplicateModalClose}
          onRedirect={handleRedirectToEvent}
        />
      )}
    </div>
  );
};

export default EventListing;

