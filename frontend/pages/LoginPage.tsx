import React, { useState } from 'react';
import { Page, Navigation } from '../App';
import { StarIcon, CircleIcon } from '../components/icons/MiscIcons';
import { EyeOpenIcon, EyeClosedIcon } from '../components/icons/AccountIcons';
import { authApi } from '../utils/api';

const LoginPage: React.FC<{ navigation: Navigation }> = ({ navigation }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const validate = () => {
    const newErrors = { email: '', password: '' };
    let isValid = true;

    if (!formData.email) {
      newErrors.email = 'Email is required.';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email address is invalid.';
      isValid = false;
    }
    if (!formData.password) {
      newErrors.password = 'Password is required.';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    if (!validate()) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.login({
        email: formData.email,
        password: formData.password,
      });

      if (response.success && response.data) {
        // Store token
        localStorage.setItem('token', response.data.token);
        navigation.login();
      } else {
        setGeneralError(response.message || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      setGeneralError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative bg-brand-light-blue min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Floating shapes */}
        <StarIcon className="absolute top-10 left-5 sm:top-20 sm:left-10 w-8 h-8 md:top-1/4 md:left-1/4 text-brand-accent-yellow opacity-50 animate-pulse" />
        <CircleIcon className="absolute bottom-10 right-5 sm:bottom-20 sm:right-10 w-12 h-12 md:top-1/2 md:right-1/4 text-brand-accent-coral opacity-50 animate-pulse delay-500" />
        <StarIcon className="absolute bottom-1/3 left-1/4 w-6 h-6 text-brand-accent-sky opacity-50 animate-pulse delay-1000 hidden sm:block" />
        
        <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-xl shadow-lg z-10">
            <div>
            <h2 className="mt-6 text-center text-3xl font-bold text-brand-teal">
                Welcome Back!
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
                Login to continue your journey.
            </p>
            </div>
            {generalError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm text-center">{generalError}</p>
              </div>
            )}
            <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
                <div>
                    <label htmlFor="email-address" className="sr-only">Email address</label>
                    <input id="email-address" name="email" type="email" autoComplete="email" required className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-brand-teal focus:border-brand-teal sm:text-sm" placeholder="Email address" value={formData.email} onChange={handleChange} />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
                <div className="relative">
                    <label htmlFor="password"  className="sr-only">Password</label>
                    <input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-brand-teal focus:border-brand-teal sm:text-sm" placeholder="Password" value={formData.password} onChange={handleChange} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5">
                       {showPassword ? <EyeClosedIcon className="h-5 w-5 text-gray-500" /> : <EyeOpenIcon className="h-5 w-5 text-gray-500" />}
                    </button>
                </div>
                 {errors.password && <p className="text-red-500 text-xs mt-1 -mt-4">{errors.password}</p>}

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
                      disabled={isLoading}
                      className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-teal hover:bg-brand-teal-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-teal disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Logging in...' : 'Login'}
                    </button>
                </div>
            </form>
             <p className="mt-2 text-center text-sm text-gray-600">
                Don't have an account?{' '}
                <a href="#" onClick={(e) => { e.preventDefault(); navigation.navigateTo(Page.Signup1); }} className="font-medium text-brand-teal hover:text-brand-teal-dark">
                    Sign up
                </a>
            </p>
        </div>
    </div>
  );
};

export default LoginPage;