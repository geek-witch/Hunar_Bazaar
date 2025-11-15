import React, { useState } from 'react';
import { Page, Navigation } from '../App';
import { EyeOpenIcon, EyeClosedIcon } from '../components/icons/AccountIcons';
import { authApi } from '../utils/api';

const SignupStep1Page: React.FC<{ navigation: Navigation }> = ({ navigation }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const validate = () => {
    const newErrors = { firstName: '', lastName: '', dob: '', email: '', password: '', confirmPassword: '' };
    let isValid = true;

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required.';
      isValid = false;
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required.';
      isValid = false;
    }
     if (!formData.dob) {
      newErrors.dob = 'Date of birth is required.';
      isValid = false;
    } else {
      const today = new Date();
      const birthDate = new Date(formData.dob);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDifference = today.getMonth() - birthDate.getMonth();
      if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 10) {
        newErrors.dob = 'You must be at least 10 years old to sign up.';
        isValid = false;
      }
    }
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
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters.';
      isValid = false;
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(formData.password)) {
        newErrors.password = 'Password must include uppercase, lowercase, and a number.';
        isValid = false;
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password.';
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
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
      const response = await authApi.signup({
        firstName: formData.firstName,
        lastName: formData.lastName,
        dob: formData.dob,
        email: formData.email,
        password: formData.password,
      });

      if (response.success && response.data && response.data.userId) {
        // Store userId for step 2
        localStorage.setItem('signupUserId', response.data.userId);
        localStorage.setItem('signupEmail', formData.email);
        localStorage.setItem('signupData', JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          dob: formData.dob,
        }));
        navigation.navigateTo(Page.Signup2);
      } else {
        setGeneralError(response.message || 'Signup failed. Please try again.');
      }
    } catch (error) {
      setGeneralError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-brand-light-blue min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-brand-teal">
            Create an account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join our community and start your skill exchange journey.
          </p>
        </div>
        {generalError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm text-center">{generalError}</p>
          </div>
        )}
        <form className="mt-8 space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="first-name" className="sr-only">First Name</label>
              <input id="first-name" name="firstName" type="text" required className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-brand-teal focus:border-brand-teal sm:text-sm" placeholder="First Name" value={formData.firstName} onChange={handleChange} />
              {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
            </div>
            <div>
              <label htmlFor="last-name" className="sr-only">Last Name</label>
              <input id="last-name" name="lastName" type="text" required className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-brand-teal focus:border-brand-teal sm:text-sm" placeholder="Last Name" value={formData.lastName} onChange={handleChange} />
              {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
            </div>
          </div>
          <div>
            <label htmlFor="dob" className="sr-only">Date of Birth</label>
            <input id="dob" name="dob" type="date" required max={new Date().toISOString().split("T")[0]} className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-brand-teal focus:border-brand-teal sm:text-sm" value={formData.dob} onChange={handleChange} />
            {errors.dob && <p className="text-red-500 text-xs mt-1">{errors.dob}</p>}
          </div>
          <div>
            <label htmlFor="email-address" className="sr-only">Email address</label>
            <input id="email-address" name="email" type="email" autoComplete="email" required className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-brand-teal focus:border-brand-teal sm:text-sm" placeholder="Email address" value={formData.email} onChange={handleChange} />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>
          <div className="relative">
            <label htmlFor="password"  className="sr-only">Password</label>
            <input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-brand-teal focus:border-brand-teal sm:text-sm" placeholder="Password" value={formData.password} onChange={handleChange} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5">
                {showPassword ? <EyeClosedIcon className="h-5 w-5 text-gray-500" /> : <EyeOpenIcon className="h-5 w-5 text-gray-500" />}
            </button>
          </div>
          <p className="text-xs text-gray-500 !mt-2">Must be 8+ characters and include an uppercase, lowercase, and number.</p>
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          
          <div className="relative">
            <label htmlFor="confirm-password"  className="sr-only">Confirm Password</label>
            <input id="confirm-password" name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} required className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-brand-teal focus:border-brand-teal sm:text-sm" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} />
             <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5">
                {showConfirmPassword ? <EyeClosedIcon className="h-5 w-5 text-gray-500" /> : <EyeOpenIcon className="h-5 w-5 text-gray-500" />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-red-500 text-xs mt-1 !mt-1">{errors.confirmPassword}</p>}

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-teal hover:bg-brand-teal-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-teal disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating Account...' : 'Continue'}
            </button>
          </div>
        </form>
        <p className="mt-2 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <a href="#" onClick={(e) => { e.preventDefault(); navigation.navigateTo(Page.Login); }} className="font-medium text-brand-teal hover:text-brand-teal-dark">
            Login
          </a>
        </p>
      </div>
    </div>
  );
};

export default SignupStep1Page;