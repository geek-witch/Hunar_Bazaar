import React, { useState } from 'react';
import { Input } from '../components/Input';
import { CheckCircle2, XCircle } from 'lucide-react';

interface ResetPasswordProps {
  onComplete: () => void;
}

export const ResetPassword: React.FC<ResetPasswordProps> = ({ onComplete }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  // Password constraints
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  
  const isValid = hasMinLength && hasUpper && hasLower && hasNumber;
  const doPasswordsMatch = password === confirmPassword && password !== '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      setError('Password does not meet requirements.');
      return;
    }
    if (!doPasswordsMatch) {
      setError('Passwords do not match.');
      return;
    }
    onComplete();
  };

  const RequirementItem = ({ met, text }: { met: boolean; text: string }) => (
    <div className={`flex items-center gap-2 text-xs ${met ? 'text-green-600' : 'text-gray-400'}`}>
      {met ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
      <span>{text}</span>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f6fa] p-4 relative overflow-hidden">
      {/* Decorative Background Animations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#0E4B5B] rounded-full mix-blend-multiply filter blur-[80px] opacity-5 animate-pulse"></div>
        <div className="absolute bottom-[-100px] left-[-100px] w-80 h-80 bg-green-100 rounded-full mix-blend-multiply filter blur-[50px] opacity-20 animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        
        {/* Stars and Circles */}
        <div className="absolute top-20 left-1/3 w-2 h-2 bg-yellow-500 rounded-full animate-ping"></div>
        <div className="absolute bottom-20 right-20 text-[#0E4B5B]/20 text-3xl font-bold animate-bounce" style={{ animationDuration: '5s' }}>⋆</div>
        <div className="absolute top-10 right-10 w-3 h-3 bg-[#0E4B5B]/30 rounded-full animate-pulse"></div>
        <div className="absolute bottom-1/2 left-10 text-yellow-300 text-lg animate-spin">★</div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border-t-4 border-[#0E4B5B] relative z-10">
        <h2 className="text-2xl font-bold text-center text-[#0E4B5B] mb-2 mt-4">Set New Password</h2>
        <p className="text-center text-gray-500 mb-6">Create a strong password for your account</p>
        
        <form onSubmit={handleSubmit}>
          <Input 
            label="New Password" 
            type="password" 
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          
          <div className="mb-4 grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
            <RequirementItem met={hasMinLength} text="8+ Characters" />
            <RequirementItem met={hasNumber} text="One Number" />
            <RequirementItem met={hasUpper} text="Uppercase Letter" />
            <RequirementItem met={hasLower} text="Lowercase Letter" />
          </div>

          <Input 
            label="Retype Password" 
            type="password" 
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={(!doPasswordsMatch && confirmPassword) ? "Passwords don't match" : undefined}
          />

          {error && <div className="text-red-500 text-sm mb-4 text-center">{error}</div>}

          <button
            type="submit"
            disabled={!isValid || !doPasswordsMatch}
            className={`w-full py-3 rounded-lg font-semibold transition-colors shadow-lg ${
              isValid && doPasswordsMatch
                ? 'bg-[#0E4B5B] text-white hover:bg-[#093540] shadow-[#0E4B5B]/20'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
            }`}
          >
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
};