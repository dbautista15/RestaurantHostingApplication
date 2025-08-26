// ACTIVITY FEED COMPONENT
const ActivityFeed = ({ activities }) => {
  const getActivityIcon = (eventType) => {
    switch (eventType) {
      case 'STATE_TRANSITION': return '🔄';
      case 'ASSIGNMENT': return '👤';
      case 'WAITLIST': return '📝';
      default: return '📊';
    }
  };

  const getActivityDescription = (activity) => {
    switch (activity.eventType) {
      case 'STATE_TRANSITION':
        return `Table ${activity.tableNumber} changed from ${activity.fromState} to ${activity.toState}`;
      case 'ASSIGNMENT':
        return `Table ${activity.tableNumber} assigned to ${activity.waiter} (party of ${activity.partySize})`;
      default:
        return 'Activity occurred';
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {activities.length === 0 ? (
          <p className="text-gray-500 italic text-center py-8">No recent activity</p>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 text-lg">
                {getActivityIcon(activity.eventType)}
              </div>
              <div className="flex-1">
                <div className="text-sm">
                  {getActivityDescription(activity)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  by {activity.user.name} at {formatTimestamp(activity.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
