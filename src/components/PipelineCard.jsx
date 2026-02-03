import React, { useState } from 'react';
import { 
  Star, 
  Phone, 
  MessageCircle, 
  Trash2, 
  Edit3, 
  Save,
  X,
  MapPin,
  Globe,
  Mail,
  ChevronDown
} from 'lucide-react';
import { 
  getLeadBadgeStyle, 
  getWhatsAppUrl, 
  formatPhoneForDisplay,
  LEAD_STATUSES,
  getStatusColor,
  handleWhatsAppCommunication
} from '../utils/leadUtils';

/**
 * PipelineCard Component
 * Displays a saved lead with status management and notes
 */
const PipelineCard = ({ 
  lead, 
  onUpdateStatus, 
  onUpdateNotes, 
  onUpdateContact,
  onDelete 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState(lead.notes || '');
  const [email, setEmail] = useState(lead.email || '');
  const [webUrl, setWebUrl] = useState(lead.webUrl || '');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const badgeStyle = getLeadBadgeStyle(lead.leadScore);

  const handleSaveNotes = async () => {
    await onUpdateNotes(lead.id, notes);
    if (email !== lead.email) {
      await onUpdateContact(lead.id, 'email', email);
    }
    if (webUrl !== lead.webUrl) {
      await onUpdateContact(lead.id, 'webUrl', webUrl);
    }
    setIsEditing(false);
  };

  const handleStatusChange = async (newStatus) => {
    await onUpdateStatus(lead.id, newStatus);
    setShowStatusDropdown(false);
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to remove "${lead.businessName}" from your pipeline?`)) {
      setDeleting(true);
      await onDelete(lead.id);
    }
  };

  const handleWhatsAppClick = () => {
    const message = `Hi! I noticed ${lead.businessName} doesn't have a website yet. I run a web agency and would love to help you get online. Would you be interested in a quick chat?`;
    window.open(getWhatsAppUrl(lead.phone, message), '_blank');
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className={`bg-slate-800 rounded-xl border border-slate-700 overflow-hidden transition-all duration-200 ${deleting ? 'opacity-50' : 'hover:border-slate-600'}`}>
      {/* Header with image and badges */}
      <div className="relative">
        {/* Cover Image */}
        <div className="h-24 bg-gradient-to-r from-slate-700 to-slate-800">
          {lead.images && lead.images[0] && (
            <img
              src={lead.images[0]}
              alt={lead.businessName}
              className="w-full h-full object-cover opacity-60"
            />
          )}
        </div>

        {/* Badges overlay */}
        <div className="absolute top-2 left-2 flex gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badgeStyle.bgColor} ${badgeStyle.textColor}`}>
            {badgeStyle.text}
          </span>
        </div>

        {/* Status Dropdown */}
        <div className="absolute top-2 right-2 relative">
          <button
            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(lead.status)} hover:opacity-90 transition-opacity`}
          >
            {lead.status}
            <ChevronDown className="w-3 h-3" />
          </button>
          
          {showStatusDropdown && (
            <div className="absolute top-full right-0 mt-1 bg-slate-700 rounded-lg shadow-lg border border-slate-600 overflow-hidden z-10 min-w-32">
              {LEAD_STATUSES.map(status => (
                <button
                  key={status.value}
                  onClick={() => handleStatusChange(status.value)}
                  className={`w-full px-3 py-2 text-left text-sm text-white hover:bg-slate-600 transition-colors flex items-center gap-2 ${
                    lead.status === status.value ? 'bg-slate-600' : ''
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${status.color}`}></span>
                  {status.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Business Name & Category */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-white mb-1">
            {lead.businessName}
          </h3>
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <span className="px-2 py-0.5 bg-slate-700 rounded text-xs">
              {lead.category}
            </span>
            <span>•</span>
            <span>Added {formatDate(lead.createdAt)}</span>
          </div>
        </div>

        {/* Rating Info */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="text-white font-medium">{lead.rating?.toFixed(1) || 'N/A'}</span>
          </div>
          <div className="text-slate-400 text-sm">
            ({lead.ratingCount?.toLocaleString()} reviews)
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-slate-300">
            <Phone className="w-4 h-4 text-green-400" />
            <span className="text-sm">{formatPhoneForDisplay(lead.phone)}</span>
          </div>
          
          {lead.address && (
            <div className="flex items-start gap-2 text-slate-400">
              <MapPin className="w-4 h-4 mt-0.5" />
              <span className="text-sm line-clamp-1">{lead.address}</span>
            </div>
          )}
        </div>

        {/* Editable Fields */}
        {isEditing ? (
          <div className="space-y-3 mb-4">
            {/* Email */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">Email</label>
              <div className="flex items-center gap-2 bg-slate-700 rounded-lg px-3 py-2">
                <Mail className="w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email..."
                  className="flex-1 bg-transparent text-white text-sm outline-none placeholder-slate-500"
                />
              </div>
            </div>

            {/* Website URL */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">Website URL (if built later)</label>
              <div className="flex items-center gap-2 bg-slate-700 rounded-lg px-3 py-2">
                <Globe className="w-4 h-4 text-slate-400" />
                <input
                  type="url"
                  value={webUrl}
                  onChange={(e) => setWebUrl(e.target.value)}
                  placeholder="Enter website URL..."
                  className="flex-1 bg-transparent text-white text-sm outline-none placeholder-slate-500"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes... (e.g., 'Owner name is Silva')"
                rows={3}
                className="w-full bg-slate-700 rounded-lg px-3 py-2 text-white text-sm outline-none placeholder-slate-500 resize-none"
              />
            </div>
          </div>
        ) : (
          <>
            {/* Display Email & Website */}
            {(lead.email || lead.webUrl) && (
              <div className="space-y-1 mb-3">
                {lead.email && (
                  <div className="flex items-center gap-2 text-slate-400">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">{lead.email}</span>
                  </div>
                )}
                {lead.webUrl && (
                  <div className="flex items-center gap-2 text-blue-400">
                    <Globe className="w-4 h-4" />
                    <a href={lead.webUrl} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline">
                      {lead.webUrl}
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Display Notes */}
            {lead.notes && (
              <div className="bg-slate-700/50 rounded-lg p-3 mb-4">
                <p className="text-sm text-slate-300 whitespace-pre-wrap">{lead.notes}</p>
              </div>
            )}
          </>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => handleWhatsAppCommunication(lead.nationalPhoneNumber, lead.displayName, lead.category)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </button>
          
          {isEditing ? (
            <>
              <button
                onClick={handleSaveNotes}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                title="Save"
              >
                <Save className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setNotes(lead.notes || '');
                  setEmail(lead.email || '');
                  setWebUrl(lead.webUrl || '');
                }}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
                title="Edit"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PipelineCard;
