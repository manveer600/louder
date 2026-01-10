/**
 * Main App Component
 * Root component for the Louder application
 */

import React from 'react';
import EventListing from './components/EventListing';
import './App.css';

function App() {
  return (
    <div className="App min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-primary-600">LOUDER</h1>
              <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full font-medium">
                Live Events & Ticketing
              </span>
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">Sydney, Australia</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <EventListing />
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Louder. All rights reserved.
            </p>
            <p className="text-gray-500 text-xs mt-2">
              Discover live events in Sydney, Australia
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;

