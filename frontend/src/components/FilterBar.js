/**
 * Filter Bar Component
 * Filters for events by category, date, etc.
 */

import React, { useState } from 'react';
import { getCurrentLocation, isGeolocationSupported } from '../utils/geolocation';

const FilterBar = ({ categories, filters, onFilterChange }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [usingLocation, setUsingLocation] = useState(false);

  const handleCategoryChange = (category) => {
    onFilterChange({ category: category === filters.category ? '' : category });
  };

  const handleDateFromChange = (dateFrom) => {
    onFilterChange({ dateFrom });
  };

  const handleDateToChange = (dateTo) => {
    onFilterChange({ dateTo });
  };

  const handleUpcomingOnlyChange = (upcomingOnly) => {
    onFilterChange({ upcomingOnly });
  };

  const clearFilters = () => {
    onFilterChange({
      category: '',
      dateFrom: '',
      dateTo: '',
      upcomingOnly: true,
      latitude: null,
      longitude: null,
      radius: null
    });
    setUsingLocation(false);
    setLocationError(null);
  };

  const handleEventsNearMe = async () => {
    if (!isGeolocationSupported()) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setLocationLoading(true);
    setLocationError(null);

    try {
      const location = await getCurrentLocation();
      setUsingLocation(true);
      
      onFilterChange({
        ...filters,
        latitude: location.latitude,
        longitude: location.longitude,
        radius: 50 // 50km radius
      });
    } catch (error) {
      setLocationError(error.message);
      setUsingLocation(false);
    } finally {
      setLocationLoading(false);
    }
  };

  const handleClearLocation = () => {
    setUsingLocation(false);
    setLocationError(null);
    onFilterChange({
      ...filters,
      latitude: null,
      longitude: null,
      radius: null
    });
  };

  const hasActiveFilters = filters.category || filters.dateFrom || filters.dateTo || !filters.upcomingOnly || usingLocation;

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
      {/* Filter Toggle (Mobile) */}
      <div className="md:hidden mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full btn btn-outline flex items-center justify-between"
        >
          <span>Filters</span>
          <svg
            className={`w-5 h-5 transition-transform ${showFilters ? 'transform rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Filter Content */}
      <div className={`${showFilters ? 'block' : 'hidden'} md:block space-y-4`}>
        {/* Events Near Me Button */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
          {!usingLocation ? (
            <button
              onClick={handleEventsNearMe}
              disabled={locationLoading}
              className="btn btn-outline w-full md:w-auto flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {locationLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Getting location...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Events Near Me</span>
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-green-800">Showing events near you</span>
                </div>
              </div>
              <button
                onClick={handleClearLocation}
                className="btn btn-secondary text-sm"
                title="Clear location filter"
              >
                Clear
              </button>
            </div>
          )}
          {locationError && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{locationError}</p>
            </div>
          )}
        </div>

        {/* Upcoming Only Toggle */}
        <div className="flex items-center">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={filters.upcomingOnly}
              onChange={(e) => handleUpcomingOnlyChange(e.target.checked)}
              className="mr-2 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-gray-700">Show upcoming events only</span>
          </label>
        </div>

        {/* Category Filters */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <div className="flex flex-wrap gap-2">
            {categories && categories.length > 0 ? (
              categories.map((cat) => (
                <button
                  key={cat.name || cat}
                  onClick={() => handleCategoryChange(cat.name || cat)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filters.category && (filters.category.trim().toLowerCase() === (cat.name || cat).toString().trim().toLowerCase())
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat.name || cat} {cat.count !== undefined && `(${cat.count})`}
                </button>
              ))
            ) : (
              <div className="text-sm text-gray-500">Loading categories...</div>
            )}
          </div>
        </div>

        {/* Date Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 mb-2">
              From Date
            </label>
            <input
              type="date"
              id="dateFrom"
              value={filters.dateFrom}
              onChange={(e) => handleDateFromChange(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 mb-2">
              To Date
            </label>
            <input
              type="date"
              id="dateTo"
              value={filters.dateTo}
              onChange={(e) => handleDateToChange(e.target.value)}
              className="input"
            />
          </div>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <div className="pt-2 border-t border-gray-200">
            <button
              onClick={clearFilters}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterBar;

