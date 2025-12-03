import React, { useState } from 'react';
import { Input } from '../components/Input';
import { ArrowLeft } from 'lucide-react';

interface ForgotPasswordProps {
  onBack: () => void;
  onReset: () => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBack, onReset }) => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      onReset();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f6fa] p-4 relative overflow-hidden">
      {/* Decorative Background Animations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-50px] right-[-50px] w-80 h-80 bg-[#0E4B5B] rounded-full mix-blend-multiply filter blur-[60px] opacity-5 animate-pulse"></div>
        <div className="absolute bottom-10 left-[-30px] w-40 h-40 bg-purple-200 rounded-full mix-blend-multiply filter blur-2xl opacity-10 animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        {/* Stars and Circles */}
        <div className="absolute top-10 left-20 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
        <div className="absolute bottom-10 right-20 text-[#0E4B5B]/20 text-lg animate-bounce" style={{ animationDuration: '4s' }}>★</div>
        <div className="absolute top-1/2 right-10 w-3 h-3 bg-[#0E4B5B]/10 rounded-full animate-pulse"></div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border-t-4 border-[#0E4B5B] relative z-10">
        <button onClick={onBack} className="text-gray-500 hover:text-[#0E4B5B] mb-6 flex items-center gap-2 text-sm font-medium">
          <ArrowLeft size={16} /> Back to Login
        </button>
        
        <h2 className="text-2xl font-bold text-center text-[#0E4B5B] mb-2 mt-4">Reset Password</h2>
        <p className="text-center text-gray-500 mb-8">Enter your admin email to receive reset instructions</p>
        
        <form onSubmit={handleSubmit}>
          <Input 
            label="Admin Email" 
            type="email" 
            placeholder="admin@hunarbazaar.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button
            type="submit"
            className="w-full bg-[#0E4B5B] text-white py-3 rounded-lg font-semibold hover:bg-[#093540] transition-colors shadow-lg shadow-[#0E4B5B]/20 mt-4"
          >
            Send Reset Link
          </button>
        </form>
      </div>
    </div>
  );
};