"use client"
import React from 'react';
import { Page, Navigation } from '../App';
import AuthPage from './LoginPage';

// This is now just a wrapper around the unified AuthPage, initializing it in 'signup' mode
const SignupStep1Page: React.FC<{ navigation: Navigation }> = ({ navigation }) => {
  return <AuthPage navigation={navigation} initialMode="signup" />;
};

export default SignupStep1Page;