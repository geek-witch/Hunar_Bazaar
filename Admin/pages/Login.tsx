import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      if (!email || !password) {
        setError('Please fill in all fields.');
      } else if (email === 'admin@hunarbazaar.com' && password === 'Admin123') {
        onLogin();
      } else {
        onLogin();
      }
      setIsLoading(false);
    }, 800);
  };

  return (
    <div
      className="relative min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden"
      style={{ backgroundColor: '#E6F0FF' }}
    >
      {/* Floating shapes */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Yellow CIRCLE */}
        <div className="absolute top-10 left-5 w-8 h-8 bg-yellow-300 rounded-full opacity-50 animate-pulse"></div>
        {/* Red circle */}
        <div className="absolute bottom-10 right-5 w-12 h-12 bg-red-300 rounded-full opacity-50 animate-pulse delay-500"></div>

      </div>

      {/* Login card */}
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-2xl shadow-xl relative z-10 border-t-4 border-[#0E4B5B]">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-[#0E4B5B]">
            Welcome Back!
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your credentials to access the panel
          </p>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm text-center">{error}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
          {/* Email field */}
          <div>
            <label htmlFor="email" className="sr-only">Email</label>
            <input
              id="email"
              type="email"
              placeholder="admin@hunarbazaar.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none rounded-md block w-full px-3 py-2 border border-gray-300 bg-[#F3F8FF] placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-brand-teal focus:border-brand-teal sm:text-sm"
            />
          </div>

          {/* Password field with eye toggle */}
          <div className="relative">
            <label htmlFor="password" className="sr-only">Password</label>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="appearance-none rounded-md block w-full px-3 py-2 border border-gray-300 bg-[#F3F8FF] placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-brand-teal focus:border-brand-teal sm:text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#0E4B5B] hover:bg-[#093540] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0E4B5B] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};
