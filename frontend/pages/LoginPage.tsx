import React, { useState, useEffect } from 'react';
import { Page, Navigation } from '../App';
import { StarIcon, CircleIcon } from '../components/icons/MiscIcons';
import { EyeOpenIcon, EyeClosedIcon } from '../components/icons/AccountIcons';
import { authApi } from '../utils/api';
import { ensureFirebaseSignedIn } from '../utils/firebaseAuth';

interface Props {
  navigation: Navigation;
  initialMode?: 'login' | 'signup';
}

// Inline Icons for Toggle
const LoginIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
  </svg>
);

const UserPlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
  </svg>
);

const AuthPage: React.FC<Props> = ({ navigation, initialMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);

  // --- LOGIN STATE ---
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [loginErrors, setLoginErrors] = useState({ email: '', password: '' });
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  // --- SIGNUP STATE ---
  const [signupData, setSignupData] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [signupErrors, setSignupErrors] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const handleModeSwitch = (newMode: 'login' | 'signup') => {
    setMode(newMode);
    setGeneralError('');
  };

  // --- LOGIN LOGIC ---
  const validateLogin = () => {
    const newErrors = { email: '', password: '' };
    let isValid = true;

    if (!loginData.email) {
      newErrors.email = 'Email is required.';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(loginData.email)) {
      newErrors.email = 'Email address is invalid.';
      isValid = false;
    }
    if (!loginData.password) {
      newErrors.password = 'Password is required.';
      isValid = false;
    }

    setLoginErrors(newErrors);
    return isValid;
  };

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData(prev => ({ ...prev, [name]: value }));
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    if (!validateLogin()) return;

    setIsLoginLoading(true);
    try {
      const response = await authApi.login({
        email: loginData.email,
        password: loginData.password,
      });

      if (response.success && response.data) {
        const data = response.data as { token: string; user?: any };
        if (data.token) {
          localStorage.setItem('token', data.token);
          if (data.user?.id) {
            localStorage.setItem('userId', data.user.id);
          }
          try {
            await ensureFirebaseSignedIn();
          } catch (e) {
            console.warn('Firebase sign-in failed:', e);
          }
          navigation.login();
        } else {
          setGeneralError('Token not received. Please try again.');
        }
      } else {
        setGeneralError(response.message || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      setGeneralError('An error occurred. Please try again.');
    } finally {
      setIsLoginLoading(false);
    }
  };

  // --- SIGNUP LOGIC ---
  const validateSignupField = (name: string, value: string) => {
    let error = '';
    switch (name) {
      case 'firstName':
        if (!value.trim()) error = 'First name is required.';
        break;
      case 'lastName':
        if (!value.trim()) error = 'Last name is required.';
        break;
      case 'dob':
        if (!value) {
          error = 'Date of birth is required.';
        } else {
          const today = new Date();
          const birthDate = new Date(value);
          let age = today.getFullYear() - birthDate.getFullYear();
          if (age < 10) error = 'You must be at least 10 years old.';
        }
        break;
      case 'email':
        if (!/\S+@\S+\.\S+/.test(value)) error = 'Email address is invalid.';
        break;
      case 'password':
        if (value.length < 8) {
          error = 'Password must be at least 8 characters.';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(value)) {
          error = 'Include uppercase, lowercase, and a number.';
        }
        break;
      case 'confirmPassword':
        if (value !== signupData.password) error = 'Passwords do not match.';
        break;
    }
    return error;
  };

  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSignupData(prev => ({ ...prev, [name]: value }));
    const error = validateSignupField(name, value);
    setSignupErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hasErrors = Object.values(signupErrors).some(err => err !== '');
    const isComplete = Object.values(signupData).every(val => val !== '');

    if (hasErrors || !isComplete) {
      setGeneralError('Please fix errors and fill all fields before continuing.');
      return;
    }

    localStorage.setItem('signupData', JSON.stringify(signupData));
    navigation.navigateTo(Page.Signup2);
  };

  return (
    <div className="relative bg-brand-light-blue min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Floating shapes */}
      <StarIcon className="absolute top-10 left-5 sm:top-20 sm:left-10 w-8 h-8 md:top-1/4 md:left-1/4 text-brand-accent-yellow opacity-50 animate-pulse" />
      <CircleIcon className="absolute bottom-10 right-5 sm:bottom-20 sm:right-10 w-12 h-12 md:top-1/2 md:right-1/4 text-brand-accent-coral opacity-50 animate-pulse delay-500" />
      <StarIcon className="absolute bottom-1/3 left-1/4 w-6 h-6 text-brand-accent-sky opacity-50 animate-pulse delay-1000 hidden sm:block" />

      <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-3xl shadow-2xl z-10 transition-all duration-300 border border-white/50 backdrop-blur-sm">

        {/* Premium Toggle Button */}
        <div className="relative flex w-full bg-slate-100 rounded-2xl p-1.5 mb-8 shadow-inner border border-slate-200">
          <div
            className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-gradient-to-r from-brand-teal to-teal-400 rounded-xl shadow-lg shadow-teal-500/30 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) transform ${mode === 'signup' ? 'translate-x-full left-1.5' : 'left-1.5'}`}
          ></div>

          <button
            type="button"
            onClick={() => handleModeSwitch('login')}
            className={`flex-1 relative z-10 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${mode === 'login' ? 'text-white' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <LoginIcon className={`w-5 h-5 transition-transform duration-300 ${mode === 'login' ? 'scale-110' : ''}`} />
            <span className="tracking-wide">Login</span>
          </button>
          <button
            type="button"
            onClick={() => handleModeSwitch('signup')}
            className={`flex-1 relative z-10 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${mode === 'signup' ? 'text-white' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <UserPlusIcon className={`w-5 h-5 transition-transform duration-300 ${mode === 'signup' ? 'scale-110' : ''}`} />
            <span className="tracking-wide">Sign Up</span>
          </button>
        </div>

        <div>
          <h2 className="text-center text-3xl font-bold text-brand-teal">
            {mode === 'login' ? 'Welcome Back!' : 'Create Account'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {mode === 'login' ? 'Login to continue your journey.' : 'Join our community and start your journey.'}
          </p>
        </div>

        {generalError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md animate-fade-in">
            <p className="text-red-600 text-sm text-center">{generalError}</p>
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form className="mt-8 space-y-6 animate-fade-in" onSubmit={handleLoginSubmit} noValidate>
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input id="email-address" name="email" type="email" autoComplete="email" required className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-brand-teal focus:border-brand-teal sm:text-sm" placeholder="Email address" value={loginData.email} onChange={handleLoginChange} />
              {loginErrors.email && <p className="text-red-500 text-xs mt-1">{loginErrors.email}</p>}
            </div>
            <div className="relative">
              <label htmlFor="password" className="sr-only">Password</label>
              <input id="password" name="password" type={showLoginPassword ? 'text' : 'password'} autoComplete="current-password" required className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-brand-teal focus:border-brand-teal sm:text-sm" placeholder="Password" value={loginData.password} onChange={handleLoginChange} />
              <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5">
                {showLoginPassword ? <EyeClosedIcon className="h-5 w-5 text-gray-500" /> : <EyeOpenIcon className="h-5 w-5 text-gray-500" />}
              </button>
            </div>
            {loginErrors.password && <p className="text-red-500 text-xs mt-1 -mt-4">{loginErrors.password}</p>}

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-brand-teal focus:ring-brand-teal border-gray-300 rounded" />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" onClick={(e) => { e.preventDefault(); navigation.navigateTo(Page.ForgotPassword); }} className="font-medium text-brand-teal hover:text-brand-teal-dark">
                  Forgot your password?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoginLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-teal hover:bg-brand-teal-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-teal disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoginLoading ? 'Logging in...' : 'Login'}
              </button>
            </div>
          </form>
        )}

        {/* SIGNUP FORM */}
        {mode === 'signup' && (
          <form className="mt-8 space-y-4 animate-fade-in" onSubmit={handleSignupSubmit} noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <input name="firstName" type="text" className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-brand-teal focus:border-brand-teal sm:text-sm" placeholder="First Name" value={signupData.firstName} onChange={handleSignupChange} />
                {signupErrors.firstName && <p className="text-red-500 text-xs mt-1">{signupErrors.firstName}</p>}
              </div>
              <div>
                <input name="lastName" type="text" disabled={!signupData.firstName || !!signupErrors.firstName} className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-brand-teal focus:border-brand-teal sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed" placeholder="Last Name" value={signupData.lastName} onChange={handleSignupChange} />
                {signupErrors.lastName && <p className="text-red-500 text-xs mt-1">{signupErrors.lastName}</p>}
              </div>
            </div>

            <div>
              <input name="dob" type="date" disabled={!signupData.lastName || !!signupErrors.lastName} className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 text-gray-900 focus:outline-none focus:ring-brand-teal focus:border-brand-teal sm:text-sm disabled:bg-gray-100" value={signupData.dob} onChange={handleSignupChange} />
              {signupErrors.dob && <p className="text-red-500 text-xs mt-1">{signupErrors.dob}</p>}
            </div>

            <div>
              <input name="email" type="email" placeholder="Email address" disabled={!signupData.dob || !!signupErrors.dob} className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-brand-teal focus:border-brand-teal sm:text-sm disabled:bg-gray-100" value={signupData.email} onChange={handleSignupChange} />
              {signupErrors.email && <p className="text-red-500 text-xs mt-1">{signupErrors.email}</p>}
            </div>

            <div className="relative">
              <input name="password" type={showSignupPassword ? 'text' : 'password'} placeholder="Password" disabled={!signupData.email || !!signupErrors.email} className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-brand-teal focus:border-brand-teal sm:text-sm disabled:bg-gray-100" value={signupData.password} onChange={handleSignupChange} />
              <button type="button" onClick={() => setShowSignupPassword(!showSignupPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                {showSignupPassword ? <EyeClosedIcon className="h-5 w-5 text-gray-500" /> : <EyeOpenIcon className="h-5 w-5 text-gray-500" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 !mt-2">Must be 8+ characters and include an uppercase, lowercase, and number.</p>
            {signupErrors.password && <p className="text-red-500 text-xs mt-1">{signupErrors.password}</p>}

            <div className="relative">
              <input name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirm Password" disabled={!signupData.password || !!signupErrors.password} className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-brand-teal focus:border-brand-teal sm:text-sm disabled:bg-gray-100" value={signupData.confirmPassword} onChange={handleSignupChange} />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                {showConfirmPassword ? <EyeClosedIcon className="h-5 w-5 text-gray-500" /> : <EyeOpenIcon className="h-5 w-5 text-gray-500" />}
              </button>
            </div>
            {signupErrors.confirmPassword && <p className="text-red-500 text-xs mt-1">{signupErrors.confirmPassword}</p>}

            <div className="pt-2">
              <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-teal hover:bg-brand-teal-dark focus:outline-none disabled:opacity-50">
                Continue
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthPage;