import React from 'react';
import { Page, Navigation } from '../App';
import { CheckIcon, UsersIcon, StarIcon, CircleIcon } from '../components/icons/MiscIcons';

const LandingPage: React.FC<{ navigation: Navigation }> = ({ navigation }) => {
    return (
        <div className="bg-brand-light-blue overflow-hidden text-gray-800">
            {/* Hero Section */}
            <section className="relative text-white bg-gradient-to-r from-brand-teal via-brand-teal-dark to-brand-teal bg-[length:200%_200%] animate-bg-wave">
                <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-28 md:pt-24 md:pb-32">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="md:w-1/2 text-center md:text-left">
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                                Seekho aur Seekhao!
                            </h1>
                            <p className="mt-6 text-lg text-gray-200 max-w-lg mx-auto md:mx-0">
                                The flexible way to learn and teach.<br />Connect with Learners and teachers of your choice through Hunar Bazaar.
                            </p>
                            <button
                                onClick={() => navigation.navigateTo(Page.Signup1)}
                                className="mt-8 bg-white text-brand-teal font-semibold px-8 py-3 rounded-lg shadow-lg hover:bg-gray-200 transition-all transform hover:scale-105"
                            >
                                Join Us
                            </button>
                        </div>
                        <div className="md:w-1/2">
                            <img src="/asset/0.gif" alt="Hero Illustration" className="rounded-lg shadow-2xl w-full" />
                        </div>
                    </div>
                </div>
               
            </section>

            {/* Wave Section - moved: place it here (after Hero, before Our Success) */}
            <div className="relative w-full overflow-hidden bg-gradient-to-b from-brand-teal to-brand-light-blue py-12 md:py-16">
                {/* Animated gradient background */}
                <div className="absolute inset-0 bg-gradient-to-r from-brand-teal via-brand-teal-dark to-brand-teal opacity-10 animate-pulse"></div>
                
                {/* Floating shapes animation */}
                <div className="absolute top-0 left-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl animate-blob"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
                
                {/* SVG Wave Animation */}
                <svg
                    className="absolute bottom-0 left-0 w-full h-auto"
                    viewBox="0 0 1440 100"
                    preserveAspectRatio="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        className="animate-wave"
                        d="M0,50 Q360,0 720,50 T1440,50 L1440,100 L0,100 Z"
                        fill="url(#waveGradient)"
                        fillOpacity="0.8"
                    />
                    <path
                        className="animate-wave animation-delay-1000"
                        d="M0,60 Q360,10 720,60 T1440,60 L1440,100 L0,100 Z"
                        fill="url(#waveGradient2)"
                        fillOpacity="0.5"
                    />
                    <defs>
                        <linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#0f7b8a" />
                            <stop offset="100%" stopColor="#e0f2fe" />
                        </linearGradient>
                        <linearGradient id="waveGradient2" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#065f73" />
                            <stop offset="100%" stopColor="#f0f9ff" />
                        </linearGradient>
                    </defs>
                </svg>

                {/* Content */}
                <div className="relative z-10 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 text-center">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white animate-fadeInUp">
                        Your Journey Starts Here
                    </h2>
                    <p className="mt-4 text-white/90 text-sm sm:text-base md:text-lg animate-fadeInUp animation-delay-300">
                     Share your skills, gain new ones, and be part of a thriving community.
                    </p>
                </div>
            </div>

            {/* Stats Section */}
            <section className="py-16 sm:py-20 bg-brand-light-blue relative overflow-hidden">
                 <StarIcon className="absolute top-12 left-1/4 w-5 h-5 text-brand-accent-yellow opacity-40 animate-pulse" />
                 <CircleIcon className="absolute bottom-16 right-1/4 w-8 h-8 text-brand-accent-peach opacity-40 animate-pulse delay-500" />
                 <CircleIcon className="absolute top-24 right-1/3 w-4 h-4 text-brand-accent-sky opacity-30 animate-pulse delay-200" />
                 <StarIcon className="absolute bottom-10 left-1/3 w-8 h-8 text-brand-accent-green opacity-30 animate-pulse delay-800" />
                 <CircleIcon className="absolute top-1/2 left-10 w-6 h-6 text-brand-accent-coral opacity-40 animate-pulse delay-1200" />
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <h2 className="text-3xl font-bold text-brand-teal mb-2">Our Success</h2>
                    <div className="w-24 h-1 bg-brand-teal mx-auto mb-12"></div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div>
                            <h3 className="text-3xl sm:text-4xl font-bold text-brand-teal">15K+</h3>
                            <p className="text-gray-500 mt-2">Students</p>
                        </div>
                        <div>
                            <h3 className="text-3xl sm:text-4xl font-bold text-brand-teal">75%</h3>
                            <p className="text-gray-500 mt-2">Total Success</p>
                        </div>
                        <div>
                            <h3 className="text-3xl sm:text-4xl font-bold text-brand-teal">26</h3>
                            <p className="text-gray-500 mt-2">Participants</p>
                        </div>
                         <div>
                            <h3 className="text-3xl sm:text-4xl font-bold text-brand-teal">16</h3>
                            <p className="text-gray-500 mt-2">Years of experience</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* What is Hunar Bazaar Section */}
            <section className="py-16 sm:py-20 bg-brand-teal">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl font-bold text-white">What is Hunar Bazaar?</h2>
                    <p className="text-gray-200 mt-4 max-w-3xl mx-auto">Hunar Bazaar is an online learning platform that allows you to exchange your skills with others. Teach what you know, and learn what you don't. All for free.</p>
                    <div className="grid md:grid-cols-2 gap-8 mt-12">
                        <div className="bg-white p-6 sm:p-8 rounded-lg text-left transform hover:-translate-y-2 transition-transform flex flex-col h-full">
                            <img src="/asset/teacher.gif" alt="For Instructors" className="rounded-md mb-6 w-full h-52 object-cover"/>
                            <div className="flex-grow">
                                <h3 className="text-sm font-bold uppercase text-brand-teal mb-2">For Instructors</h3>
                                <p className="text-gray-700 mt-2">Showcase your skills, connect with learners, and earn credits to learn new things for yourself.</p>
                            </div>
                        </div>
                        <div className="bg-white p-6 sm:p-8 rounded-lg text-left transform hover:-translate-y-2 transition-transform flex flex-col h-full">
                            <img src="/asset/student.gif" alt="For Students" className="rounded-md mb-6 w-full h-52 object-cover"/>
                            <div className="flex-grow">
                                <h3 className="text-sm font-bold uppercase text-brand-teal mb-2">For Students</h3>
                                <p className="text-gray-700 mt-2">Find experienced instructors for any skill you want to learn. Use your own skills to earn learning credits.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            
            {/* How It Works Section */}
            <section className="py-16 sm:py-20 bg-brand-light-blue relative overflow-hidden">
                <CircleIcon className="absolute top-20 left-10 w-10 h-10 text-brand-accent-sky opacity-30 animate-pulse delay-300" />
                <StarIcon className="absolute bottom-20 right-10 w-6 h-6 text-brand-accent-coral opacity-50 animate-pulse delay-700" />
                <StarIcon className="absolute top-1/4 right-1/4 w-4 h-4 text-brand-accent-yellow opacity-40 animate-pulse delay-100" />
                <CircleIcon className="absolute bottom-1/3 left-1/4 w-12 h-12 text-brand-accent-peach opacity-20 animate-pulse delay-1100" />
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <h2 className="text-3xl font-bold text-brand-teal">How It Works</h2>
                    <p className="text-gray-600 mt-4 max-w-2xl mx-auto">Start your skill exchange journey in just a few simple steps.</p>
                    <div className="grid md:grid-cols-3 gap-12 mt-12 text-left">
                        <div className="text-center">
                            <div className="bg-brand-teal text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl font-bold">1</span>
                            </div>
                            <h3 className="text-xl font-semibold text-brand-teal mb-2">Create Profile</h3>
                            <p className="text-gray-600">Sign up and tell us about the skills you want to share and learn.</p>
                        </div>
                        <div className="text-center">
                            <div className="bg-brand-teal text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                               <span className="text-2xl font-bold">2</span>
                            </div>
                            <h3 className="text-xl font-semibold text-brand-teal mb-2">Find a Match</h3>
                            <p className="text-gray-600">Browse our community to find people who have the skills you want.</p>
                        </div>
                        <div className="text-center">
                            <div className="bg-brand-teal text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl font-bold">3</span>
                            </div>
                            <h3 className="text-xl font-semibold text-brand-teal mb-2">Exchange Skills</h3>
                            <p className="text-gray-600">Connect, schedule, and start exchanging knowledge for credits.</p>
                        </div>
                    </div>
                </div>
            </section>
            
            {/* Testimonials Section */}
            <section className="py-16 sm:py-20 bg-white">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl font-bold text-brand-teal">What Our Users Say</h2>
                     <div className="w-24 h-1 bg-brand-teal mx-auto mt-2 mb-12"></div>
                    <div className="grid md:grid-cols-2 gap-8 text-left">
                        <div className="bg-brand-light-blue p-6 sm:p-8 rounded-lg">
                            <p className="text-gray-600 italic mb-4">"Hunar Bazaar is amazing! I learned how to code in Python by teaching someone how to Design UI/Ux. It's a fantastic concept."</p>
                            <div className="flex flex-wrap items-center">
                                <img src="/asset/user1.jpg" alt="User" className="w-12 h-12 rounded-full mr-4"/>
                                <div>
                                    <h4 className="font-semibold text-brand-teal">Ali Khan</h4>
                                    <p className="text-sm text-gray-500">Coding Student</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-brand-light-blue p-6 sm:p-8 rounded-lg">
                            <p className="text-gray-600 italic mb-4">"As a graphic designer, I was able to share my skills and in return, I'm learning Js for my new website. Highly recommend this platform!"</p>
                            <div className="flex flex-wrap items-center">
                                <img src="/asset/user2.png" alt="User" className="w-12 h-12 rounded-full mr-4"/>
                                <div>
                                    <h4 className="font-semibold text-brand-teal">Ayesha Rana</h4>
                                    <p className="text-sm text-gray-500">Designer</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;