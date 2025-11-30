
import React, { useState } from 'react';
import { Page, Navigation } from '../App';
import { authApi } from '../utils/api';

const ForgotPasswordPage: React.FC<{ navigation: Navigation }> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    if (!email) {
      setError('Email is required.');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Email address is invalid.');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.forgotPassword({ email });
      
      if (response.success) {
        setIsSubmitted(true);
      } else {
        setError(response.message || 'Failed to send reset link. Please try again.');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-brand-light-blue min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
        {isSubmitted ? (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-brand-teal">Check Your Inbox</h2>
            <p className="mt-4 text-gray-600">
              If an account with <span className="font-medium">{email}</span> exists, we have sent a password reset link to it.
            </p>
            <button
              onClick={() => navigation.navigateTo(Page.Login)}
              className="mt-6 group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-teal hover:bg-brand-teal-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-teal"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <>
            <div>
              <h2 className="mt-6 text-center text-3xl font-bold text-brand-teal">
                Forgot Password
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                Enter your email and we'll send you a link to reset your password.
              </p>
            </div>
            <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
              <div>
                <label htmlFor="email-address" className="sr-only">Email address</label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-brand-teal focus:border-brand-teal sm:text-sm"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
              </div>
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-teal hover:bg-brand-teal-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-teal disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
            <p className="mt-2 text-center text-sm text-gray-600">
              Remember your password?{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); navigation.navigateTo(Page.Login); }} className="font-medium text-brand-teal hover:text-brand-teal-dark">
                Login here
              </a>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
