export const WaitlistPanel = ({ 
  waitlist, 
  onAddParty, 
  onStatusChange, 
  onRemove,
  onUpdate,
  // ✅ NEW: Recently seated props
  recentlySeated = [],
  onRestoreParty,
  onClearRecentlySeated
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  // Backend already sorts by priority, so just use waitlist directly
  const { demo } = useActions();

  // ✅ NEW: Helper to format time since seated
  const getTimeSinceSeated = (seatedAt) => {
    const minutes = Math.floor((Date.now() - new Date(seatedAt)) / (1000 * 60));
    if (minutes < 1) return 'just now';
    if (minutes === 1) return '1 min ago';
    return `${minutes} min ago`;
  };

  // ✅ NEW: Handle restore with user feedback
  const handleRestore = async (partyId) => {
    try {
      const result = await onRestoreParty(partyId);
      if (result && !result.success) {
        // Could add toast notification here in the future
        console.warn('Restore warning:', result.message);
      }
    } catch (error) {
      console.error('Failed to restore party:', error);
    }
  };

  // ✅ SIMPLIFIED: Just call backend
  const populateDemoData = async () => {
    try {
      await demo.populateWaitlist();
      // Dashboard will auto-refresh with new data
    } catch (error) {
      console.error('Failed to populate demo data:', error);
    }
  };
};