/**
 * Google Maps API Loader Utility
 *
 * Provides a singleton loader for Google Maps JavaScript API
 * Uses @googlemaps/js-api-loader for efficient loading
 */

import { importLibrary, setOptions } from '@googlemaps/js-api-loader'

let mapsLoadedPromise = null
let isInitialized = false

/**
 * Initialize and load Google Maps API
 * Returns a promise that resolves when the API is loaded
 * Uses singleton pattern to avoid multiple loads
 *
 * @returns {Promise<void>} Promise that resolves when Google Maps is loaded
 */
export async function loadGoogleMaps() {
  // Return existing promise if already loading or loaded
  if (mapsLoadedPromise) {
    return mapsLoadedPromise
  }

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

  if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
    throw new Error(
      'Google Maps API key not configured. Please add VITE_GOOGLE_MAPS_API_KEY to .env file'
    )
  }

  mapsLoadedPromise = (async () => {
    // Set options only once
    if (!isInitialized) {
      setOptions({
        apiKey,
        version: 'weekly',
      })
      isInitialized = true
    }

    // Import required libraries
    await Promise.all([
      importLibrary('maps'),
      importLibrary('marker'),
      importLibrary('places'),
      importLibrary('geometry'),
    ])
  })()

  return mapsLoadedPromise
}

/**
 * Check if Google Maps API is loaded
 *
 * @returns {boolean} True if Google Maps is loaded
 */
export function isGoogleMapsLoaded() {
  return typeof google !== 'undefined' && typeof google.maps !== 'undefined'
}

/**
 * Get Google Maps instance
 * Throws error if not loaded
 *
 * @returns {typeof google.maps} Google Maps API
 */
export function getGoogleMaps() {
  if (!isGoogleMapsLoaded()) {
    throw new Error('Google Maps API not loaded. Call loadGoogleMaps() first')
  }
  return google.maps
}
