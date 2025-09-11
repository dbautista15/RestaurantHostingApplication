const AuthForm = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  // Login form state
  const [loginData, setLoginData] = useState({
    clockInNumber: '',
    password: ''
  });

  // Registration form state
  const [registerData, setRegisterData] = useState({
    clockInNumber: '',
    name: '',
    role: '',
    password: '',
    confirmPassword: ''
  });

  const showMessage = (text, type = 'error') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (response.ok) {
        showMessage('Login successful! Welcome back.', 'success');
        // Convert response to expected format for existing app
        const userData = {
          id: data.user.id,
          name: data.user.name || `User ${loginData.clockInNumber}`,
          role: data.user.role,
          clockNumber: loginData.clockInNumber,
          section: data.user.section,
          token: data.token
        };
        
        setTimeout(() => {
          onLogin(userData);
        }, 1000);
      } else {
        showMessage(data.error || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Login error:', error);
      showMessage('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    // Client-side validation
    if (registerData.password !== registerData.confirmPassword) {
      showMessage('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    if (registerData.password.length < 6) {
      showMessage('Password must be at least 6 characters long.');
      setIsLoading(false);
      return;
    }

    if (!registerData.clockInNumber || !registerData.name || !registerData.role) {
      showMessage('Please fill in all required fields.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clockInNumber: parseInt(registerData.clockInNumber),
          name: registerData.name,
          role: registerData.role,
          password: registerData.password,
          // Note: Section is not included as it will be assigned during shift start
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showMessage('Account created successfully! Logging you in...', 'success');
        
        // TODO: SECURITY CONSIDERATION - Auto-login after registration
        // In production, consider requiring admin approval or invitation codes
        // to prevent unauthorized account creation
        
        // Auto-login the newly registered user
        setTimeout(async () => {
          try {
            const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                clockInNumber: parseInt(registerData.clockInNumber),
                password: registerData.password,
              }),
            });

            const loginData = await loginResponse.json();

            if (loginResponse.ok) {
              const userData = {
                id: loginData.user.id,
                name: registerData.name,
                role: registerData.role,
                clockNumber: registerData.clockInNumber,
                section: loginData.user.section,
                token: loginData.token
              };
              
              onLogin(userData);
            } else {
              showMessage('Account created but auto-login failed. Please login manually.');
              setIsLogin(true);
            }
          } catch (autoLoginError) {
            showMessage('Account created but auto-login failed. Please login manually.');
            setIsLogin(true);
          }
        }, 1500);
      } else {
        showMessage(data.error || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      showMessage('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setMessage('');
    setLoginData({ clockInNumber: '', password: '' });
    setRegisterData({ clockInNumber: '', name: '', role: '', password: '', confirmPassword: '' });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Restaurant Seating System
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isLogin ? 'Sign in to manage tables and seating' : 'Create your staff account'}
          </p>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`p-4 rounded-md ${messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message}
          </div>
        )}

        {/* Login Form */}
        {isLogin ? (
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <input
                  type="number"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Clock Number (e.g., 001, 002, 003)"
                  value={loginData.clockInNumber}
                  onChange={(e) => setLoginData({...loginData, clockInNumber: e.target.value})}
                />
              </div>
              <div>
                <input
                  type="password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                />
              </div>
            </div>
            <div className="text-xs text-gray-500 text-center">
              Use the same clock number you use to login to the POS at work
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
        ) : (
          /* Registration Form */
          <form className="mt-8 space-y-6" onSubmit={handleRegister}>
            <div className="rounded-md shadow-sm space-y-4">
              <div>
                <input
                  type="number"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Clock Number (e.g., 001, 002, 003)"
                  value={registerData.clockInNumber}
                  onChange={(e) => setRegisterData({...registerData, clockInNumber: e.target.value})}
                />
              </div>
              <div>
                <input
                  type="text"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Full Name"
                  value={registerData.name}
                  onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                />
              </div>
              <div>
                <select
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  value={registerData.role}
                  onChange={(e) => setRegisterData({...registerData, role: e.target.value})}
                >
                  <option value="">Select Role</option>
                  <option value="host">Host</option>
                  <option value="waiter">Waiter</option>
                </select>
              </div>
              {/* Show disabled section field for waiters */}
              {registerData.role === 'waiter' && (
                <div>
                  <input
                    type="text"
                    disabled
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-400 bg-gray-100 rounded-md sm:text-sm"
                    placeholder="Section will be assigned when you start your shift"
                  />
                </div>
              )}
              <div>
                <input
                  type="password"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Password (minimum 6 characters)"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                />
              </div>
              <div>
                <input
                  type="password"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Confirm Password"
                  value={registerData.confirmPassword}
                  onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                />
              </div>
            </div>
            <div className="text-xs text-gray-500 text-center">
              Use the same clock number you use to login to the POS at work
            </div>
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
          </form>
        )}

        {/* Toggle Button */}
        <div className="text-center">
          <button
            onClick={toggleMode}
            disabled={isLoading}
            className="text-indigo-600 hover:text-indigo-500 text-sm font-medium disabled:opacity-50"
          >
            {isLogin ? "Don't have an account? Create one" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
};
