/**
 * Event Card Component
 * Displays individual event information
 */

import React from 'react';

const EventCard = ({ event, onGetTickets }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString('en-AU', options);
  };

  const formatShortDate = (dateString) => {
    const date = new Date(dateString);
    const options = { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString('en-AU', options);
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Music': 'bg-pink-100 text-pink-700',
      'Sports': 'bg-green-100 text-green-700',
      'Comedy': 'bg-yellow-100 text-yellow-700',
      'Theater': 'bg-purple-100 text-purple-700',
      'Arts': 'bg-indigo-100 text-indigo-700',
      'Technology': 'bg-blue-100 text-blue-700',
      'Food & Drink': 'bg-orange-100 text-orange-700',
      'Business': 'bg-gray-100 text-gray-700',
      'Education': 'bg-teal-100 text-teal-700',
      'Health & Wellness': 'bg-emerald-100 text-emerald-700',
      'Family': 'bg-cyan-100 text-cyan-700',
      'Other': 'bg-slate-100 text-slate-700'
    };
    return colors[category] || colors['Other'];
  };

  return (
    <div className="card hover:scale-105 transition-transform duration-200">
      {/* Event Image */}
      <div className="relative h-48 bg-gradient-to-br from-primary-400 to-primary-600 overflow-hidden">
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div className={`absolute inset-0 flex items-center justify-center ${event.imageUrl ? 'hidden' : 'flex'}`}>
          <div className="text-white text-6xl opacity-50">
            {event.category === 'Music' ? '🎵' :
             event.category === 'Sports' ? '⚽' :
             event.category === 'Comedy' ? '😄' :
             event.category === 'Theater' ? '🎭' :
             event.category === 'Arts' ? '🎨' :
             event.category === 'Technology' ? '💻' :
             event.category === 'Food & Drink' ? '🍕' :
             '🎉'}
          </div>
        </div>
        
        {/* Category Badge */}
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(event.category)}`}>
            {event.category}
          </span>
        </div>

        {/* Date Badge */}
        <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg">
          <div className="text-xs font-semibold text-gray-800">
            {formatShortDate(event.date)}
          </div>
        </div>
      </div>

      {/* Event Content */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
          {event.title}
        </h3>

        {event.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-3">
            {event.description}
          </p>
        )}

        {/* Event Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{formatDate(event.date)}</span>
          </div>

          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{event.venue || 'Sydney, Australia'}</span>
          </div>

          {event.sourceWebsite && (
            <div className="flex items-center text-xs text-gray-500">
              <span>Source: {event.sourceWebsite}</span>
            </div>
          )}
        </div>

        {/* CTA Button */}
        <button
          onClick={() => onGetTickets(event)}
          className="w-full btn btn-primary py-3 font-semibold text-base"
        >
          GET TICKETS
        </button>
      </div>
    </div>
  );
};

export default EventCard;

