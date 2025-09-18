export const sortWaitlistByPriority = (waitlist) => {
  return [...waitlist].sort((a, b) => {
    const priorityOrder = { coworker: 3, large_party: 2, normal: 1 };
    const aPriority = priorityOrder[a.priority] || 1;
    const bPriority = priorityOrder[b.priority] || 1;
    
    if (aPriority !== bPriority) {
      return bPriority - aPriority;
    }
    
    return new Date(a.createdAt) - new Date(b.createdAt);
  });
};

export const getPriorityColor = (priority) => {
  switch (priority) {
    case 'coworker': return 'bg-purple-100 text-purple-800';
    case 'large_party': return 'bg-orange-100 text-orange-800';
    default: return 'bg-blue-100 text-blue-800';
  }
};

export const getPriorityLabel = (priority) => {
  switch (priority) {
    case 'large_party': return 'Large';
    case 'coworker': return 'Staff';
    default: return 'Normal';
  }
};

export const getWaitTime = (createdAt) => {
  const now = new Date();
  const created = new Date(createdAt);
  return Math.floor((now - created) / (1000 * 60));
};