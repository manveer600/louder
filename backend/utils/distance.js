/**
 * Distance Calculation Utility
 * Calculates distance between two geographic coordinates using Haversine formula
 */

/**
 * Calculate distance between two points on Earth using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

/**
 * Convert degrees to radians
 * @param {number} degrees
 * @returns {number} radians
 */
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Filter events by distance from a given location
 * @param {Array} events - Array of events
 * @param {number} userLat - User's latitude
 * @param {number} userLon - User's longitude
 * @param {number} maxDistanceKm - Maximum distance in kilometers (default: 50km)
 * @returns {Array} Filtered events with distance property
 */
function filterEventsByDistance(events, userLat, userLon, maxDistanceKm = 50) {
  // For now, since we don't have venue coordinates, we'll return all Sydney events
  // In production, you would geocode venues and calculate actual distances
  // This is a placeholder that can be enhanced later
  
  return events.map(event => ({
    ...event,
    distance: null, // Will be calculated when venue geocoding is implemented
    distanceKm: null
  })).filter(event => {
    // For now, just filter by city (Sydney)
    // In production, calculate actual distance from venue coordinates
    return event.city === 'Sydney';
  });
}

/**
 * Get Sydney's approximate center coordinates
 * @returns {{latitude: number, longitude: number}}
 */
function getSydneyCenter() {
  return {
    latitude: -33.8688,
    longitude: 151.2093
  };
}

module.exports = {
  calculateDistance,
  filterEventsByDistance,
  getSydneyCenter,
  toRadians
};
