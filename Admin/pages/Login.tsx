import React, { useState } from 'react';
import { Input } from '../components/Input';

interface LoginProps {
  onLogin: () => void;
  onForgotPassword: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin, onForgotPassword }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock validation
    if (email === 'admin@hunarbazaar.com' && password === 'Admin123') {
      onLogin();
    } else if (!email || !password) {
      setError('Please fill in all fields.');
    } else {
      // Allow any login for demo purposes, but show specific error for clarity if needed
      // For this task, we'll just log them in to allow testing the dashboard
      onLogin(); 
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f6fa] p-4 relative overflow-hidden">
      {/* Decorative Background Animations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-[#0E4B5B] rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-pulse"></div>
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        {/* Stars and Circles */}
        <div className="absolute top-20 right-20 text-yellow-400 text-xl animate-bounce" style={{ animationDuration: '3s' }}>★</div>
        <div className="absolute bottom-1/4 left-10 w-4 h-4 bg-[#0E4B5B] rounded-full opacity-20 animate-ping"></div>
        <div className="absolute top-1/2 left-20 w-2 h-2 bg-blue-500 rounded-full opacity-40 animate-pulse"></div>
        <div className="absolute bottom-20 right-1/3 text-[#0E4B5B]/10 text-4xl animate-spin" style={{ animationDuration: '10s' }}>●</div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border-t-4 border-[#0E4B5B] relative z-10">
        <h2 className="text-2xl font-bold text-center text-[#0E4B5B] mb-2 mt-4">Admin Login</h2>
        <p className="text-center text-gray-500 mb-8">Enter your credentials to access the panel</p>
        
        <form onSubmit={handleSubmit}>
          <Input 
            label="Email Address" 
            type="email" 
            placeholder="admin@hunarbazaar.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input 
            label="Password" 
            type="password" 
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          
          {error && <div className="text-red-500 text-sm mb-4 text-center">{error}</div>}

          <div className="flex justify-end mb-6">
            <button 
              type="button" 
              onClick={onForgotPassword}
              className="text-sm text-[#0E4B5B] hover:underline font-medium"
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            className="w-full bg-[#0E4B5B] text-white py-3 rounded-lg font-semibold hover:bg-[#093540] transition-colors shadow-lg shadow-[#0E4B5B]/20"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};