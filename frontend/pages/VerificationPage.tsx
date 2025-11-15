import React, { useState, useRef } from 'react';
import { Page, Navigation } from '../App';
import { authApi } from '../utils/api';

const VerificationPage: React.FC<{ navigation: Navigation }> = ({ navigation }) => {
  const [pin, setPin] = useState<string[]>(Array(6).fill(''));
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const { value } = e.target;
    if (/^[0-9]$/.test(value) || value === '') {
      const newPin = [...pin];
      newPin[index] = value;
      setPin(newPin);

      // Move to next input
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredPin = pin.join('');
    if (enteredPin.length < 6) {
      setError('Please enter the complete 6-digit PIN.');
      return;
    }

    const email = localStorage.getItem('signupEmail');
    if (!email) {
      setError('Session expired. Please start over.');
      navigation.navigateTo(Page.Signup1);
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      const response = await authApi.verifyOTP({
        email,
        code: enteredPin,
      });

      if (response.success && response.data) {
        // Store token and clear signup data
        localStorage.setItem('token', response.data.token);
        localStorage.removeItem('signupUserId');
        localStorage.removeItem('signupEmail');
        localStorage.removeItem('signupData');
        navigation.login();
      } else {
        setError(response.message || 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    const email = localStorage.getItem('signupEmail');
    if (!email) {
      setError('Session expired. Please start over.');
      return;
    }

    setIsResending(true);
    setError('');
    try {
      const response = await authApi.resendOTP({ email });
      if (response.success) {
        setError('');
        // Show success message (you could add a success state for this)
        alert('OTP resent successfully. Please check your email.');
      } else {
        setError(response.message || 'Failed to resend OTP. Please try again.');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="bg-brand-light-blue min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg text-center">
        <div>
          <h2 className="mt-6 text-3xl font-bold text-brand-teal">
            Verify Your Account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            We've sent a 6-digit PIN to your email. (Hint: any 6 digits will work)
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="flex justify-center space-x-2">
            {pin.map((digit, i) => (
              <input
                key={i}
                // FIX: The ref callback function must have a void return type. The implicit return of the assignment was causing a type error. Wrapped the assignment in curly braces to fix this.
                ref={el => { inputRefs.current[i] = el; }}
                type="text"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(e, i)}
                onKeyDown={e => handleKeyDown(e, i)}
                placeholder="0" // Added placeholder for clarity
                className="w-12 h-14 text-center text-2xl font-semibold border border-gray-300 rounded-md focus:ring-brand-teal focus:border-brand-teal"
              />
            ))}
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="pt-4">
            <button 
              type="submit" 
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-teal hover:bg-brand-teal-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-teal disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </form>
        <p className="mt-4 text-sm text-gray-600">
          Didn't receive the code?{' '}
          <button
            onClick={handleResend}
            disabled={isResending}
            className="font-medium text-brand-teal hover:text-brand-teal-dark disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isResending ? 'Resending...' : 'Resend'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default VerificationPage;
