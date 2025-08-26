// WAITLIST COMPONENT
const WaitlistPanel = ({ waitlist, onWaitlistAction, userRole }) => {
  const [newParty, setNewParty] = useState({ name: '', size: '', phone: '' });

  const handleAddParty = (e) => {
	e.preventDefault();
	if (newParty.name && newParty.size) {
	  onWaitlistAction('add', {
		partyName: newParty.name,
		partySize: parseInt(newParty.size),
		phoneNumber: newParty.phone
	  });
	  setNewParty({ name: '', size: '', phone: '' });
	}
  };

  const formatWaitTime = (addedAt) => {
	const minutes = Math.floor((new Date() - new Date(addedAt)) / 60000);
	return `${minutes} min`;
  };

  return (
	<div className="bg-white rounded-lg shadow p-6">
	  <h3 className="text-xl font-semibold mb-4">Waitlist ({waitlist.length})</h3>
	  
	  {userRole === 'host' && (
		<form onSubmit={handleAddParty} className="mb-6 p-4 bg-gray-50 rounded-lg">
		  <h4 className="font-medium mb-3">Add New Party</h4>
		  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
			<input
			  type="text"
			  placeholder="Party Name"
			  value={newParty.name}
			  onChange={(e) => setNewParty({...newParty, name: e.target.value})}
			  className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
			  required
			/>
			<input
			  type="number"
			  placeholder="Party Size"
			  min="1"
			  max="10"
			  value={newParty.size}
			  onChange={(e) => setNewParty({...newParty, size: e.target.value})}
			  className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
			  required
			/>
			<input
			  type="tel"
			  placeholder="Phone (optional)"
			  value={newParty.phone}
			  onChange={(e) => setNewParty({...newParty, phone: e.target.value})}
			  className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
			/>
		  </div>
		  <button
			type="submit"
			className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
		  >
			Add to Waitlist
		  </button>
		</form>
	  )}

	  <div className="space-y-3 max-h-96 overflow-y-auto">
		{waitlist.length === 0 ? (
		  <p className="text-gray-500 italic text-center py-8">No parties waiting</p>
		) : (
		  waitlist.map((party, index) => (
			<div key={party.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
			  <div className="flex items-center space-x-4">
				<div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
				  {index + 1}
				</div>
				<div>
				  <div className="font-medium">{party.partyName}</div>
				  <div className="text-sm text-gray-500">
					Party of {party.partySize} • Waiting {formatWaitTime(party.addedAt)}
				  </div>
				  {party.phoneNumber && (
					<div className="text-xs text-gray-400">{party.phoneNumber}</div>
				  )}
				</div>
			  </div>
			  
			  {userRole === 'host' && (
				<div className="flex space-x-2">
				  <button
					onClick={() => onWaitlistAction('seat', party)}
					className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
				  >
					Seat Now
				  </button>
				  <button
					onClick={() => onWaitlistAction('remove', party)}
					className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
				  >
					Remove
				  </button>
				</div>
			  )}
			</div>
		  ))
		)}
	  </div>
	</div>
  );
};
