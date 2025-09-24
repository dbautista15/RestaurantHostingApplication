import { useDashboard } from '../hooks/useDashboard';

export const Dashboard = ({ user, onLogout }) => {
  // ✅ Single hook call instead of multiple
  const {
    waitlist,
    tables, 
    matrix,
    suggestions,
    recentlySeated,
    loading,
    error,
    seatParty,
    addParty,
    updateParty,
    removeParty
  } = useDashboard();

  if (loading) return <DashboardSkeleton />;
  if (error) return <ErrorBoundary error={error} />;

  return (
    <ThreePanelLayout user={user} onLogout={onLogout}>
      <WaitlistPanel 
        waitlist={waitlist}
        recentlySeated={recentlySeated}
        onSeatParty={seatParty}
        onAddParty={addParty}
        onUpdateParty={updateParty}
        onRemoveParty={removeParty}
      />
      <FloorPlanView tables={tables} />
      <SuggestionsPanel suggestions={suggestions} matrix={matrix} />
    </ThreePanelLayout>
  );
};