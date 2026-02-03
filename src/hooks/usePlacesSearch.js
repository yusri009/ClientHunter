import { useState, useCallback } from 'react';
import { filterSuitableLeads } from '../utils/leadUtils';

/**
 * Custom hook for Google Places API search
 * Uses the new Places API with TextSearch and Field Masking for cost optimization
 */
const usePlacesSearch = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rawResultsCount, setRawResultsCount] = useState(0);

  /**
   * Search for places using Google Places API (New)
   * @param {string} query - Search query (e.g., "Restaurants in Colombo")
   */
  const searchPlaces = useCallback(async (query) => {
    if (!query.trim()) {
      setError('Please enter a search query');
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      // Check if Google Maps API is loaded
      if (!window.google || !window.google.maps || !window.google.maps.places) {
        throw new Error('Google Maps API not loaded. Please check your API key.');
      }

      // Create a PlacesService instance
      const service = new window.google.maps.places.PlacesService(
        document.createElement('div')
      );

      // Define the request
      const request = {
        query: query,
        // Sri Lanka bounds for better results
        locationBias: {
          center: { lat: 7.8731, lng: 80.7718 }, // Sri Lanka center
          radius: 150000 // 150km radius
        }
      };

      // Fetch all pages of results
      const allResults = await fetchAllPages(service, request);

      // For each result, get detailed information with specific fields
      const detailedResults = await Promise.all(
        allResults.map(place => getPlaceDetails(service, place.place_id))
      );

      // Filter out null results (failed detail fetches)
      const validResults = detailedResults.filter(place => place !== null);
      
      setRawResultsCount(validResults.length);

      // Apply our filtering logic
      const filteredLeads = filterSuitableLeads(validResults);
      
      setResults(filteredLeads);

      if (filteredLeads.length === 0 && validResults.length > 0) {
        setError(`Found ${validResults.length} businesses, but none match our criteria (no website, mobile phone, 10+ reviews)`);
      }

    } catch (err) {
      console.error('Search error:', err);
      setError(err.message || 'An error occurred while searching');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch all pages of search results
   * Google Places API returns up to 20 results per page, with max 3 pages (60 results total)
   */
  const fetchAllPages = (service, request) => {
    return new Promise((resolve, reject) => {
      const allResults = [];

      const handleResults = (results, status, pagination) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          allResults.push(...results);

          // Check if there are more pages
          if (pagination && pagination.hasNextPage) {
            // Wait 2 seconds before fetching next page (API requirement)
            setTimeout(() => {
              pagination.nextPage();
            }, 2000);
          } else {
            // No more pages, resolve with all results
            resolve(allResults);
          }
        } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          resolve(allResults);
        } else {
          reject(new Error(`Places API Error: ${status}`));
        }
      };

      service.textSearch(request, handleResults);
    });
  };

  /**
   * Get detailed place information
   * Uses field masking to only request necessary fields
   */
  const getPlaceDetails = async (service, placeId) => {
    const fields = [
      'place_id',
      'name',
      'rating',
      'user_ratings_total',
      'formatted_phone_number',
      'international_phone_number',
      'website',
      'business_status',
      'photos',
      'types',
      'formatted_address',
      'geometry'
    ];

    return new Promise((resolve) => {
      service.getDetails(
        { placeId, fields },
        (place, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
            // Map to our expected format
            resolve({
              id: place.place_id,
              placeId: place.place_id,
              displayName: place.name,
              rating: place.rating,
              userRatingCount: place.user_ratings_total,
              nationalPhoneNumber: place.formatted_phone_number,
              internationalPhoneNumber: place.international_phone_number,
              websiteUri: place.website,
              businessStatus: place.business_status,
              photos: place.photos,
              types: place.types,
              formattedAddress: place.formatted_address,
              location: place.geometry?.location
            });
          } else {
            resolve(null);
          }
        }
      );
    });
  };

  /**
   * Clear search results
   */
  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
    setRawResultsCount(0);
  }, []);

  return {
    results,
    loading,
    error,
    rawResultsCount,
    searchPlaces,
    clearResults
  };
};

export default usePlacesSearch;
