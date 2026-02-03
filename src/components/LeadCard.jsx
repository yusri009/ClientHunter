import React, { useState } from 'react';
import { 
  Star, 
  Phone, 
  MapPin, 
  MessageCircle, 
  Plus, 
  ExternalLink,
  Check,
  X
} from 'lucide-react';
import { 
  getLeadBadgeStyle, 
  getWhatsAppUrl, 
  formatPhoneForDisplay,
  getPrimaryCategory,
  handleWhatsAppCommunication
} from '../utils/leadUtils';

/**
 * LeadCard Component
 * Displays a potential lead with badges, actions, and WhatsApp integration
 */
const LeadCard = ({ place, onAddToPipeline, isInPipeline = false }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addResult, setAddResult] = useState(null);

  const badgeStyle = getLeadBadgeStyle(place.leadScore);
  const category = getPrimaryCategory(place.types);
  
  // Get photo URL
  const getPhotoUrl = () => {
    if (place.photos && place.photos.length > 0) {
      try {
        return place.photos[0].getUrl({ maxWidth: 400 });
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  const photoUrl = getPhotoUrl();

  // Handle add to pipeline
  const handleAddToPipeline = async () => {
    setAdding(true);
    const result = await onAddToPipeline({ ...place, category });
    setAddResult(result);
    setAdding(false);
    
    // Clear result after 3 seconds
    setTimeout(() => setAddResult(null), 3000);
  };


  // Test WhatsApp (without message)
  const handleTestWhatsApp = () => {
    window.open(getWhatsAppUrl(place.nationalPhoneNumber), '_blank');
  };

  return (
    <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-slate-600 transition-all duration-200 hover:shadow-lg hover:shadow-slate-900/50">
      {/* Image Section */}
      <div className="relative h-48 bg-slate-700">
        {photoUrl && !imageError ? (
          <img
            src={photoUrl}
            alt={place.displayName}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-800">
            <span className="text-4xl">🏢</span>
          </div>
        )}
        
        {/* Lead Score Badge */}
        <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-sm font-semibold ${badgeStyle.bgColor} ${badgeStyle.textColor} ${badgeStyle.glow ? 'hot-lead-badge' : ''}`}>
          {badgeStyle.text}
        </div>

        {/* Category Badge */}
        <div className="absolute top-3 right-3 px-2 py-1 rounded-md text-xs font-medium bg-slate-900/80 text-slate-300 backdrop-blur-sm">
          {category}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4">
        {/* Business Name */}
        <h3 className="text-lg font-semibold text-white mb-2 line-clamp-1">
          {place.displayName}
        </h3>

        {/* Rating Info */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="text-white font-medium">{place.rating?.toFixed(1) || 'N/A'}</span>
          </div>
          <div className="text-slate-400 text-sm">
            ({place.userRatingCount?.toLocaleString()} reviews)
          </div>
        </div>

        {/* Phone Number */}
        <div className="flex items-center gap-2 mb-2 text-slate-300">
          <Phone className="w-4 h-4 text-green-400" />
          <span className="text-sm">{formatPhoneForDisplay(place.nationalPhoneNumber)}</span>
        </div>

        {/* Address */}
        <div className="flex items-start gap-2 mb-4 text-slate-400">
          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span className="text-sm line-clamp-2">{place.formattedAddress}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          {/* WhatsApp Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => handleWhatsAppCommunication(place.nationalPhoneNumber, place.displayName, place.category)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Send Message
            </button>
            <button
              onClick={handleTestWhatsApp}
              className="px-3 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
              title="Test WhatsApp"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>

          {/* Add to Pipeline Button */}
          <button
            onClick={handleAddToPipeline}
            disabled={adding || addResult?.success || isInPipeline}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
              addResult?.success || isInPipeline
                ? 'bg-green-600/20 text-green-400 border border-green-600/50'
                : addResult?.success === false
                ? 'bg-red-600/20 text-red-400 border border-red-600/50'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            {adding ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : addResult?.success || isInPipeline ? (
              <>
                <Check className="w-4 h-4" />
                In Pipeline
              </>
            ) : addResult?.success === false ? (
              <>
                <X className="w-4 h-4" />
                {addResult.message}
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Add to Pipeline
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeadCard;
