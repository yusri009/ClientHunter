/**
 * Lead Utilities
 * Utility functions for phone formatting, lead scoring, and WhatsApp detection
 */

/**
 * Validates if a Sri Lankan phone number is a mobile number
 * Mobile numbers start with 07 or +94 7 (we want mobile for WhatsApp)
 * @param {string} phone - The phone number to validate
 * @returns {boolean} - True if it's a valid Sri Lankan mobile number
 */
export const isValidSriLankanMobile = (phone) => {
  if (!phone) return false;
  
  // Remove all spaces, dashes, and parentheses
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // Check for Sri Lankan mobile patterns
  // Format: 07XXXXXXXX or +947XXXXXXXX or 947XXXXXXXX
  const mobilePatterns = [
    /^07\d{8}$/,        // Local format: 0771234567
    /^\+947\d{8}$/,     // International with +: +94771234567
    /^947\d{8}$/,       // International without +: 94771234567
    /^07\d{1}\s?\d{3}\s?\d{4}$/, // With spaces: 077 123 4567
  ];
  
  return mobilePatterns.some(pattern => pattern.test(cleanPhone));
};

/**
 * Formats a Sri Lankan phone number for WhatsApp
 * Removes spaces, replaces leading 0 with 94
 * @param {string} phone - The phone number to format
 * @returns {string} - Formatted phone number for WhatsApp (e.g., 94771234567)
 */
export const formatPhoneForWhatsApp = (phone) => {
  if (!phone) return '';
  
  // Remove all non-digit characters except +
  let cleanPhone = phone.replace(/[^\d+]/g, '');
  
  // Remove leading + if present
  cleanPhone = cleanPhone.replace(/^\+/, '');
  
  // If starts with 0, replace with 94
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '94' + cleanPhone.substring(1);
  }
  
  // If doesn't start with 94, add it
  if (!cleanPhone.startsWith('94')) {
    cleanPhone = '94' + cleanPhone;
  }
  
  return cleanPhone;
};

/**
 * Generates WhatsApp URL
 * @param {string} phone - The phone number
 * @param {string} message - Optional pre-filled message
 * @returns {string} - WhatsApp URL
 */
export const getWhatsAppUrl = (phone, message = '') => {
  const formattedPhone = formatPhoneForWhatsApp(phone);
  const baseUrl = `https://wa.me/${formattedPhone}`;
  
  if (message) {
    return `${baseUrl}?text=${encodeURIComponent(message)}`;
  }
  
  return baseUrl;
};

/**
 * Calculates lead score based on rating count and rating
 * @param {number} ratingCount - Number of reviews
 * @param {number} rating - Average rating
 * @returns {'Hot' | 'Warm' | 'Cold'} - Lead score category
 */
export const calculateLeadScore = (ratingCount, rating) => {
  if (ratingCount > 100 && rating > 4.0) {
    return 'Hot';
  }
  if (ratingCount > 50) {
    return 'Warm';
  }
  return 'Cold';
};

/**
 * Gets badge styling based on lead score
 * @param {'Hot' | 'Warm' | 'Cold'} score - Lead score
 * @returns {object} - Badge styling object with text, bg color, and icon
 */
export const getLeadBadgeStyle = (score) => {
  switch (score) {
    case 'Hot':
      return {
        text: '🔥 HOT LEAD',
        bgColor: 'bg-gradient-to-r from-amber-500 to-orange-500',
        textColor: 'text-white',
        borderColor: 'border-amber-400',
        glow: true
      };
    case 'Warm':
      return {
        text: '⭐ Potential',
        bgColor: 'bg-blue-600',
        textColor: 'text-white',
        borderColor: 'border-blue-400',
        glow: false
      };
    case 'Cold':
      return {
        text: 'New Lead',
        bgColor: 'bg-slate-600',
        textColor: 'text-slate-200',
        borderColor: 'border-slate-500',
        glow: false
      };
    default:
      return {
        text: 'Unknown',
        bgColor: 'bg-gray-600',
        textColor: 'text-gray-200',
        borderColor: 'border-gray-500',
        glow: false
      };
  }
};

/**
 * Filters places based on Client Hunter criteria
 * @param {Array} places - Array of places from Google Places API
 * @returns {Array} - Filtered and sorted array of suitable leads
 */
export const filterSuitableLeads = (places) => {
  if (!places || !Array.isArray(places)) return [];
  
  return places
    .filter(place => {
      // Must have at least 10 reviews
      const ratingCount = place.userRatingCount || 0;
      if (ratingCount < 10) return false;
      
      // Must NOT have a website (our target clients)
      if (place.websiteUri) return false;
      
      // Must be operational
      if (place.businessStatus && place.businessStatus !== 'OPERATIONAL') return false;
      
      // Must have a valid Sri Lankan mobile number
      const phone = place.nationalPhoneNumber || place.internationalPhoneNumber || '';
      if (!isValidSriLankanMobile(phone)) return false;
      
      return true;
    })
    .map(place => ({
      ...place,
      leadScore: calculateLeadScore(place.userRatingCount, place.rating),
      formattedWhatsapp: formatPhoneForWhatsApp(place.nationalPhoneNumber || place.internationalPhoneNumber)
    }))
    .sort((a, b) => b.userRatingCount - a.userRatingCount); // Sort by rating count (highest first)
};

/**
 * Formats a phone number for display
 * @param {string} phone - The phone number
 * @returns {string} - Formatted phone number
 */
export const formatPhoneForDisplay = (phone) => {
  if (!phone) return 'No phone';
  
  // Clean the phone number
  const cleanPhone = phone.replace(/[^\d]/g, '');
  
  // Format as 077 123 4567
  if (cleanPhone.length === 10 && cleanPhone.startsWith('0')) {
    return `${cleanPhone.slice(0, 3)} ${cleanPhone.slice(3, 6)} ${cleanPhone.slice(6)}`;
  }
  
  return phone;
};

/**
 * Extracts primary category from place types
 * @param {Array} types - Array of place types
 * @returns {string} - Primary category name
 */
export const getPrimaryCategory = (types) => {
  if (!types || !Array.isArray(types) || types.length === 0) {
    return 'Business';
  }
  
  // Priority categories for display
  const priorityTypes = [
    'restaurant', 'cafe', 'bar', 'bakery', 'hotel', 'lodging',
    'beauty_salon', 'spa', 'gym', 'dentist', 'doctor', 'hospital',
    'car_repair', 'car_dealer', 'clothing_store', 'jewelry_store',
    'electronics_store', 'furniture_store', 'florist', 'pet_store'
  ];
  
  // Find first matching priority type
  const primaryType = types.find(type => priorityTypes.includes(type));
  
  if (primaryType) {
    // Convert snake_case to Title Case
    return primaryType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  // Fallback to first type
  return types[0]
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Status options for leads
 */
export const LEAD_STATUSES = [
  { value: 'New', label: 'New', color: 'bg-slate-500' },
  { value: 'Qualified', label: 'Qualified', color: 'bg-blue-500' },
  { value: 'Contacted', label: 'Contacted', color: 'bg-purple-500' },
  { value: 'Interested', label: 'Interested', color: 'bg-amber-500' },
  { value: 'Closed', label: 'Closed', color: 'bg-green-500' }
];

/**
 * Gets status color class
 * @param {string} status - Lead status
 * @returns {string} - Tailwind color class
 */
export const getStatusColor = (status) => {
  const statusObj = LEAD_STATUSES.find(s => s.value === status);
  return statusObj ? statusObj.color : 'bg-slate-500';
};


export const handleWhatsAppCommunication = async (phone, businessName, category) => {
  // 1. Prepare message and URL
  const message = `Hi! I noticed ${businessName} doesn't have a website yet. I run a web agency and would love to help you get online. Would you be interested in a quick chat?`;
  
  // Assuming getWhatsAppUrl is available in this scope
  const whatsappUrl = getWhatsAppUrl(phone, message);

  try {
    // 2. Try to fetch and copy image
    // Ensure this path logic matches your public folder structure
    const path = `/sample-images/${category}.png`; 
    
    const response = await fetch(path);
    const blob = await response.blob();

    await navigator.clipboard.write([
      new ClipboardItem({ "image/png": blob })
    ]);
    console.log('Image copied to clipboard!');
  } catch (err) {
    // If copying fails (e.g. wrong format or mobile restriction), log it but don't stop.
    console.error('Copy failed, proceeding to WhatsApp without image:', err);
  } finally {
    // 3. Open WhatsApp
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  }
};