// LOGIN COMPONENT
const LoginForm = ({ onLogin }) => {
  const [clockNumber, setClockNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
	e.preventDefault();
	setIsLoading(true);
	
	// MOCK LOGIN - YOU WILL REPLACE WITH REAL API CALL
	setTimeout(() => {
	  if (clockNumber && password) {
		const mockUser = {
		  id: '1',
		  name: clockNumber.startsWith('H') ? 'Host User' : 'Waiter User',
		  role: clockNumber.startsWith('H') ? 'host' : 'waiter',
		  clockNumber,
		  section: clockNumber.startsWith('W') ? 'A' : null
		};
		onLogin(mockUser);
	  }
	  setIsLoading(false);
	}, 1000);
  };

  return (
	<div className="min-h-screen bg-gray-50 flex items-center justify-center">
	  <div className="max-w-md w-full space-y-8">
		<div>
		  <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
			Restaurant Seating System
		  </h2>
		  <p className="mt-2 text-center text-sm text-gray-600">
			Sign in to manage tables and seating
		  </p>
		</div>
		<form className="mt-8 space-y-6" onSubmit={handleSubmit}>
		  <div className="rounded-md shadow-sm -space-y-px">
			<div>
			  <input
				type="text"
				required
				className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
				placeholder="Clock Number (H001 for host, W001 for waiter)"
				value={clockNumber}
				onChange={(e) => setClockNumber(e.target.value)}
			  />
			</div>
			<div>
			  <input
				type="password"
				required
				className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
				placeholder="Password"
				value={password}
				onChange={(e) => setPassword(e.target.value)}
			  />
			</div>
		  </div>
		  <div>
			<button
			  type="submit"
			  disabled={isLoading}
			  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
			>
			  {isLoading ? 'Signing in...' : 'Sign In'}
			</button>
		  </div>
		</form>
	  </div>
	</div>
  );
};
