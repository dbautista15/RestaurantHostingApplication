import React, { useState } from 'react';

export const AddPartyModal = ({ isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    partyName: '',
    partySize: '',
    phoneNumber: '',
    priority: 'normal',
    specialRequests: '' // ✅ NEW: Add special requests field
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.partyName || !formData.partySize) return;
    
    setLoading(true);
    try {
      await onAdd({
        ...formData,
        partySize: parseInt(formData.partySize),
        estimatedWait: 15,
        partyStatus: 'waiting'
      });
      setFormData({ 
        partyName: '', 
        partySize: '', 
        phoneNumber: '', 
        priority: 'normal',
        specialRequests: '' // ✅ NEW: Reset special requests
      });
      onClose();
    } catch (error) {
      console.error('Failed to add party:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Add Party to Waitlist</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Party Name *
            </label>
            <input
              type="text"
              value={formData.partyName}
              onChange={(e) => setFormData({...formData, partyName: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              placeholder="Enter party name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Party Size *
            </label>
            <input
              type="number"
              value={formData.partySize}
              onChange={(e) => setFormData({...formData, partySize: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              placeholder="Number of guests"
              min="1"
              max="20"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              placeholder="Phone number (optional)"
            />
          </div>

          {/* ✅ NEW: Special Requests Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Special Requests
            </label>
            <textarea
              value={formData.specialRequests}
              onChange={(e) => setFormData({...formData, specialRequests: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Booth preferred, high chair needed, anniversary..."
              rows="3"
              maxLength="200"
            />
            <div className="text-xs text-gray-500 mt-1">
              {formData.specialRequests.length}/200 characters
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({...formData, priority: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="normal">Normal Priority</option>
              <option value="large_party">Large Party (8+)</option>
              <option value="coworker">Staff/Coworker</option>
            </select>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.partyName || !formData.partySize}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Adding...' : 'Add Party'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};