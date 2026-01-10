/**
 * Filter Bar Component
 * Filters for events by category, date, etc.
 */

import React, { useState } from 'react';

const FilterBar = ({ categories, filters, onFilterChange }) => {
  const [showFilters, setShowFilters] = useState(false);

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
      upcomingOnly: true
    });
  };

  const hasActiveFilters = filters.category || filters.dateFrom || filters.dateTo || !filters.upcomingOnly;

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
                    filters.category === (cat.name || cat)
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

