'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Page, Navigation } from '../App';
import ScheduleSessionPage from "./ScheduleSessionPage"
import WatchActivityPage from "./WatchActivityPage"
import ManageRequestsPage from "./ManageRequestsPage"
import SeeProgressPage from "./SeeProgressPage"
import CertificatesPage from "./CertificatesPage"
import SettingsPage from "./SettingsPage"
import RemindersPage from "./RemindersPage"
import HelpCenterPage from "./HelpCenterPage"
import MessengerPage from "./MessengerPage"
import NotificationsPage from "./NotificationsPage"

import {
    PersonalDetailsIcon,
    HeadsetIcon,
    CreditIcon,
    BadgeIcon,
    AvailabilityIcon,
    CertificateIcon,
    SettingsIcon,
    RoadmapIcon,
    ReminderIcon,
    HelpIcon,
    InboxIcon,
    NotificationIcon,
    MessengerIcon,
    CrownBadgeIcon,
    ShieldBadgeIcon,
} from '../components/icons/AccountIcons';
import { GithubIcon, LinkedInIcon, InstagramIcon, FacebookIcon, TwitterIcon, WhatsAppIcon } from '../components/icons/SocialIcons';
import { EditIcon, PlusCircleIcon, SearchIcon, XCircleIcon } from '../components/icons/MiscIcons';
import { HamburgerIcon, CloseIcon } from '../components/icons/MenuIcons';
import { authApi } from '../utils/api';
import { useNotifications } from '../contexts/NotificationContext';

// MultiSelectDropdown Component for Skills
const MultiSelectDropdown: React.FC<{
    options: string[];
    selectedOptions: string[];
    setSelectedOptions: React.Dispatch<React.SetStateAction<string[]>>;
    placeholder: string;
}> = ({ options, selectedOptions, setSelectedOptions, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleOption = (option: string) => {
        if (selectedOptions.includes(option)) {
            setSelectedOptions(selectedOptions.filter(o => o !== option));
        } else {
            setSelectedOptions([...selectedOptions, option]);
        }
    };

    const filteredOptions = options
        .filter(option => option != null && typeof option === 'string' && option.trim() !== '')
        .filter(option => !selectedOptions.includes(option))
        .filter(option => {
            const matches = option.toLowerCase().includes(searchTerm.toLowerCase());
            return matches;
        });

    return (
        <div className="relative" ref={dropdownRef}>
            <div
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white flex flex-wrap items-center gap-2 cursor-text"
                onClick={() => setIsOpen(true)}
            >
                {selectedOptions.map(option => (
                    <div key={option} className="bg-brand-teal text-white text-sm font-medium px-2 py-1 rounded-full flex items-center">
                        <span>{option}</span>
                        <button
                            type="button"
                            className="ml-2 text-white hover:text-gray-200"
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleOption(option);
                            }}
                        >
                            &times;
                        </button>
                    </div>
                ))}
                <input
                    type="text"
                    placeholder={selectedOptions.length === 0 ? placeholder : ''}
                    className="flex-grow outline-none bg-transparent py-1"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                />
            </div>
            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map(option => (
                            <div
                                key={option}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                onClick={() => {
                                    toggleOption(option);
                                    setSearchTerm('');
                                    setIsOpen(false);
                                }}
                            >
                                {option}
                            </div>
                        ))
                    ) : (
                        <div className="px-4 py-2 text-gray-500">No options found</div>
                    )}
                </div>
            )}
        </div>
    );
};

type AvailabilitySlot = {
    id?: number | string;
    startTime: string;
    endTime: string;
    days: string[];
};

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface UserData {
    name: string;
    email: string;
    dob: string;
    about: string;
    availability: AvailabilitySlot[];
    teachSkills: string[];
    learnSkills: string[];
    credits: number;
    badges: number;
    pendingRequests: number;
    profilePicUrl: string;
    socialLinks: string[];
    joinedDate?: string;
}

// Separate state for the edit form to handle file objects
interface EditFormData extends Omit<UserData, 'profilePicUrl' | 'credits' | 'badges' | 'pendingRequests' | 'name'> {
    firstName: string;
    lastName: string;
    profilePicFile: File | null;
}

const MyAccountPage: React.FC<{ navigation: Navigation, initialTab?: string }> = ({ navigation, initialTab }) => {
    const [activeTab, setActiveTab] = useState(initialTab || 'Personal Details');
    const [isEditing, setIsEditing] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [unreadMessageCount, setUnreadMessageCount] = useState(0);
    const [blockedUsers, setBlockedUsers] = useState<Array<{ id: string; name: string; profilePic?: string }>>([]);
    const [isLoadingBlockedUsers, setIsLoadingBlockedUsers] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
    const { totalUnreadCount: totalGeneralNotificationCount } = useNotifications();

    const [userData, setUserData] = useState<UserData>({
        name: '',
        email: '',
        dob: '',
        about: '',
        availability: [],
        teachSkills: [],
        learnSkills: [],
        credits: 0,
        badges: 0,
        profilePicUrl: '/asset/p4.jpg',
        socialLinks: [],
        joinedDate: undefined,
    });

    const [editData, setEditData] = useState<EditFormData | null>(null);
    const [skillsList, setSkillsList] = useState<string[]>([]);
    const [skillsLoading, setSkillsLoading] = useState(true);

    useEffect(() => {
        const body = document.body;
        if (isSidebarOpen) {
            body.style.overflow = 'hidden';
        } else {
            body.style.overflow = 'auto';
        }

        return () => {
            body.style.overflow = 'auto';
        };
    }, [isSidebarOpen]);

    // Fetch available skills
    useEffect(() => {
        const fetchSkills = async () => {
            try {
                setSkillsLoading(true);
                const response = await authApi.getAllSkills();

                let skillsArray: string[] = [];
                if (response.success) {
                    if (Array.isArray(response.data)) {
                        skillsArray = response.data;
                    } else if (Array.isArray(response.skills)) {
                        skillsArray = response.skills;
                    } else if (response.data && Array.isArray(response.data.data)) {
                        skillsArray = response.data.data;
                    }
                }

                if (skillsArray.length > 0) {
                    const cleanedSkills = skillsArray
                        .filter(skill => skill != null && typeof skill === 'string')
                        .map(skill => skill.trim())
                        .filter(skill => skill !== '');
                    setSkillsList(cleanedSkills);
                } else {
                    console.error('Failed to fetch skills - Response:', response);
                    setSkillsList([]);
                }
            } catch (error) {
                console.error('Error fetching skills:', error);
                setSkillsList([]);
            } finally {
                setSkillsLoading(false);
            }
        };

        fetchSkills();
    }, []);

    // Listen for unread message count updates
    useEffect(() => {
        // Get initial count from localStorage
        const initialCount = parseInt(localStorage.getItem('unreadMessageCount') || '0', 10);
        setUnreadMessageCount(initialCount);

        // Listen for custom event (same tab updates from MessengerPage)
        const handleUnreadUpdate = (event: CustomEvent) => {
            const newCount = event.detail || 0;
            setUnreadMessageCount(newCount);
            localStorage.setItem('unreadMessageCount', newCount.toString());
        };

        // Listen for storage events (other tabs/windows updates)
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === 'unreadMessageCount' && event.newValue !== null) {
                const newCount = parseInt(event.newValue, 10);
                setUnreadMessageCount(newCount);
            }
        };

        window.addEventListener('unreadMessages:changed', handleUnreadUpdate as EventListener);
        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('unreadMessages:changed', handleUnreadUpdate as EventListener);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    useEffect(() => {
        // Fetch user profile data on component mount
        const fetchProfile = async () => {
            setIsLoading(true);
            setError('');
            try {
                const response = await authApi.getProfile();
                if (response.success && response.data) {
                    const data = response.data as {
                        name: string;
                        email: string;
                        dob: string;
                        about: string;
                        availability: AvailabilitySlot[] | string; // Backend may return array or legacy string
                        teachSkills: string[];
                        learnSkills: string[];
                        credits: number;
                        badges: number;
                        profilePicUrl: string | null;
                        socialLinks: string[];
                        joinedDate?: string;
                    };
                    // Convert availability to array format if it's a string (legacy data)
                    let availabilitySlots: AvailabilitySlot[] = [];
                    if (Array.isArray(data.availability)) {
                        availabilitySlots = data.availability.map((slot, index) => ({
                            id: slot.id || index,
                            startTime: slot.startTime,
                            endTime: slot.endTime,
                            days: Array.isArray(slot.days) ? slot.days : [],
                        }));
                    } else if (typeof data.availability === 'string' && data.availability.trim()) {
                        // Legacy string format - convert to empty array (user will need to set new availability)
                        availabilitySlots = [];
                    }

                    // Note: `joinedDate` should be set by your backend at account creation
                    // (e.g., createdAt). The API should return it and it will be displayed
                    // here as 'Member since' and visible to other users when viewing profiles.
                    setUserData({
                        name: data.name,
                        email: data.email,
                        dob: data.dob,
                        about: data.about,
                        availability: availabilitySlots,
                        teachSkills: data.teachSkills,
                        learnSkills: data.learnSkills,
                        credits: data.credits,
                        badges: data.badges,
                        profilePicUrl: data.profilePicUrl || '/asset/p4.jpg',
                        socialLinks: data.socialLinks || [],
                        joinedDate: data.joinedDate,
                    });
                } else {
                    setError(response.message || 'Failed to load profile');
                }
            } catch (err) {
                setError('An error occurred while loading your profile');
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, []);

    // Fetch blocked users when the tab is opened
    useEffect(() => {
        if (activeTab === 'Blocked Users') {
            const fetchBlockedUsers = async () => {
                setIsLoadingBlockedUsers(true);
                try {
                    const response = await authApi.getBlockedByMe();
                    if (response.success && response.data) {
                        setBlockedUsers(response.data);
                    } else {
                        setError(response.message || 'Failed to load blocked users');
                    }
                } catch (err) {
                    console.error('Error fetching blocked users:', err);
                    setError('Failed to load blocked users');
                } finally {
                    setIsLoadingBlockedUsers(false);
                }
            };

            fetchBlockedUsers();
        }
    }, [activeTab]);


    const handleEdit = () => {
        const nameParts = userData.name.trim().split(/\s+/);
        const firstName = nameParts[0] || '';
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

        setEditData({
            ...userData,
            firstName,
            lastName,
            profilePicFile: null,
            socialLinks: userData.socialLinks && userData.socialLinks.length > 0 ? [...userData.socialLinks] : [''],
        });
        setFieldErrors({});
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditData(null);
    };

    const handleSave = async () => {
        if (!editData) return;

        // Frontend validation
        const errors: { [key: string]: string } = {};
        if (!editData.firstName.trim()) errors.firstName = 'First name is required';
        if (!editData.lastName.trim()) errors.lastName = 'Last name is required';
        if (!editData.dob) errors.dob = 'Date of birth is required';
        else {
            const age = new Date().getFullYear() - new Date(editData.dob).getFullYear();
            if (age < 10) errors.dob = 'You must be at least 10 years old';
        }
        if (!editData.about.trim()) errors.about = 'Bio is required';
        else if (editData.about.length < 20) errors.about = 'Bio must be at least 20 characters';

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        setIsSaving(true);
        setError('');
        setFieldErrors({});

        try {
            // Convert profile pic to base64 if provided
            let profilePicBase64 = userData.profilePicUrl;
            if (editData.profilePicFile) {
                const reader = new FileReader();
                profilePicBase64 = await new Promise<string>((resolve, reject) => {
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(editData.profilePicFile!);
                });
            }

            // Prepare update data
            const updateData: {
                firstName?: string;
                lastName?: string;
                dob?: string;
                about?: string;
                availability?: AvailabilitySlot[];
                teachSkills?: string[];
                learnSkills?: string[];
                socialLinks?: string[];
                profilePic?: string | null;
            } = {};

            if (editData.dob) updateData.dob = editData.dob;
            if (editData.about) updateData.about = editData.about;
            if (editData.availability && Array.isArray(editData.availability) && editData.availability.length > 0) {
                // Remove id field before sending to backend (backend doesn't need it)
                updateData.availability = editData.availability.map(slot => ({
                    startTime: slot.startTime,
                    endTime: slot.endTime,
                    days: slot.days,
                }));
            }
            if (editData.teachSkills.length > 0) updateData.teachSkills = editData.teachSkills;
            if (editData.learnSkills.length > 0) updateData.learnSkills = editData.learnSkills;
            if (editData.socialLinks) {
                updateData.socialLinks = editData.socialLinks
                    .filter(link => link.trim() !== '')
                    .map(link => normalizeUrl(link));
            }
            if (profilePicBase64 && profilePicBase64 !== userData.profilePicUrl) {
                updateData.profilePic = profilePicBase64;
            }

            // Sync with editData fields directly
            updateData.firstName = editData.firstName;
            updateData.lastName = editData.lastName;

            const response = await authApi.updateProfile(updateData);

            if (response.success) {
                // Update local state with saved data
                setUserData(prev => ({
                    ...prev,
                    name: `${editData.firstName} ${editData.lastName}`,
                    email: prev.email,
                    dob: editData.dob,
                    about: editData.about,
                    availability: editData.availability,
                    teachSkills: editData.teachSkills,
                    learnSkills: editData.learnSkills,
                    profilePicUrl: profilePicBase64,
                    socialLinks: editData.socialLinks
                        .filter(link => link.trim() !== '')
                        .map(link => normalizeUrl(link)),
                }));
                setIsEditing(false);
                setEditData(null);
                navigation.showNotification('Profile Edited Successfully');
            } else {
                if (response.errors && typeof response.errors === 'object') {
                    // Map backend validation errors if available
                    setFieldErrors(response.errors);
                }
                setError(response.message || 'Failed to update profile');
            }
        } catch (err) {
            setError('An error occurred while saving your profile');
        } finally {
            setIsSaving(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!editData) return;
        const { name, value } = e.target;
        setEditData(prev => prev ? ({ ...prev, [name]: value }) : null);

        // Clear field error when user starts typing
        if (fieldErrors[name]) {
            setFieldErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setEditData(prev => prev ? ({ ...prev, profilePicFile: e.target.files[0] }) : null);
        }
    };

    const handleSkillsChange = (skills: string[], skillType: 'teachSkills' | 'learnSkills') => {
        if (!editData) return;
        setEditData(prev => prev ? ({ ...prev, [skillType]: skills }) : null);
    };

    const handleSocialLinkChange = (index: number, value: string) => {
        if (!editData) return;
        const newLinks = [...editData.socialLinks];
        newLinks[index] = value;
        setEditData(prev => (prev ? { ...prev, socialLinks: newLinks } : null));
    };

    const handleAddSocialLink = () => {
        if (!editData) return;
        setEditData(prev => (prev ? { ...prev, socialLinks: [...prev.socialLinks, ''] } : null));
    };

    const handleRemoveSocialLink = (index: number) => {
        if (!editData) return;
        const newLinks = [...editData.socialLinks];
        newLinks.splice(index, 1);
        setEditData(prev => (prev ? { ...prev, socialLinks: newLinks } : null));
    };


    const menuItems = [
        { icon: PersonalDetailsIcon, label: 'Personal Details' },
        { icon: HeadsetIcon, label: 'Schedule Classes' },
        { icon: InboxIcon, label: 'Manage Requests' },
        { icon: AvailabilityIcon, label: 'Watch Activity' },
        { icon: RoadmapIcon, label: 'See Progress' },
        { icon: CertificateIcon, label: 'Certificates' },
        { icon: SettingsIcon, label: 'Settings' },
        { icon: ReminderIcon, label: 'Reminders' },
        { icon: HelpIcon, label: 'Help Center' },
        { icon: ShieldBadgeIcon, label: 'Blocked Users' },
    ];

    const SkillTag: React.FC<{ skill: string; variant?: 'teach' | 'learn' }> = ({ skill, variant = 'teach' }) => {
        const colors = variant === 'teach'
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
            : 'bg-indigo-50 text-indigo-700 border border-indigo-100';
        return (
            <span className={`${colors} text-sm font-semibold px-4 py-1.5 rounded-full shadow-sm`}>{skill}</span>
        );
    };

    const badgeComponents = [BadgeIcon, ShieldBadgeIcon, CrownBadgeIcon];
    const badgeColors = [
        'text-brand-accent-yellow', 'text-gray-500', 'text-amber-500',
        'text-sky-500', 'text-rose-500'
    ];

    const getSocialIcon = (url: string) => {
        if (!url) return null;
        const lowerUrl = url.toLowerCase();

        // Check for WhatsApp (wa.me, whatsapp.com, api.whatsapp.com)
        if (lowerUrl.includes('wa.me') || lowerUrl.includes('whatsapp.com')) {
            return <WhatsAppIcon className="w-6 h-6 text-green-500" />;
        }
        // Check for Facebook
        if (lowerUrl.includes('facebook.com') || lowerUrl.includes('fb.com')) {
            return <FacebookIcon className="w-6 h-6 text-blue-600" />;
        }
        // Check for Instagram
        if (lowerUrl.includes('instagram.com')) {
            return <InstagramIcon className="w-6 h-6 text-pink-500" />;
        }
        // Check for Twitter/X
        if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) {
            return <TwitterIcon className="w-6 h-6 text-blue-400" />;
        }
        // Check for LinkedIn
        if (lowerUrl.includes('linkedin.com')) {
            return <LinkedInIcon className="w-6 h-6 text-blue-700" />;
        }
        // Check for GitHub
        if (lowerUrl.includes('github.com')) {
            return <GithubIcon className="w-6 h-6 text-gray-800" />;
        }

        // Default icon for unknown links
        return (
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
        );
    };

    const normalizeUrl = (url: string): string => {
        if (!url) return url;
        const trimmed = url.trim();
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
            return trimmed;
        }
        return `https://${trimmed}`;
    };

    // Availability Selector Component
    const AvailabilitySelector: React.FC<{
        availability: AvailabilitySlot[];
        setAvailability: React.Dispatch<React.SetStateAction<AvailabilitySlot[]>>;
        setError: React.Dispatch<React.SetStateAction<string>>;
    }> = ({ availability, setAvailability, setError }) => {
        const [newSlot, setNewSlot] = useState<Omit<AvailabilitySlot, 'id'>>({
            startTime: '',
            endTime: '',
            days: [],
        });

        const handleSlotChange = (field: keyof Omit<AvailabilitySlot, 'id' | 'days'>, value: string) => {
            setNewSlot(prev => ({ ...prev, [field]: value }));
            setError('');
        };

        const handleDayToggle = (day: string) => {
            setNewSlot(prev => {
                const newDays = prev.days.includes(day)
                    ? prev.days.filter(d => d !== day)
                    : [...prev.days, day];
                return { ...prev, days: newDays };
            });
            setError('');
        };

        const validateNewSlot = () => {
            if (!newSlot.startTime || !newSlot.endTime || newSlot.days.length === 0) {
                setError('Please select start time, end time, and at least one day.');
                return false;
            }

            const start = newSlot.startTime;
            const end = newSlot.endTime;

            if (start >= end) {
                setError('Start time must be before end time.');
                return false;
            }

            setError('');
            return true;
        };

        const handleAddSlot = () => {
            if (!validateNewSlot()) {
                return;
            }

            setAvailability(prevAvail => [
                ...prevAvail,
                { ...newSlot, id: Date.now() + Math.random() },
            ]);

            setNewSlot(prev => ({ ...prev, startTime: '', endTime: '' }));
        };

        const handleRemoveSlot = (id: number | string | undefined) => {
            if (id === undefined) return;
            setAvailability(prevAvail => prevAvail.filter(slot => slot.id !== id));
        };

        const formatTime = (time: string): string => {
            if (!time) return '';
            try {
                const [hours, minutes] = time.split(':').map(Number);
                const period = hours >= 12 ? 'PM' : 'AM';
                const displayHours = hours % 12 || 12;
                return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
            } catch {
                return time;
            }
        };

        return (
            <div className="space-y-4">
                <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                    <h3 className="font-semibold text-gray-800 mb-2">Add Availability Slot</h3>

                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Day(s)</label>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {DAYS_OF_WEEK.map(day => (
                            <button
                                key={day}
                                type="button"
                                onClick={() => handleDayToggle(day)}
                                className={`px-3 py-1 text-xs rounded-full transition duration-150 border ${newSlot.days.includes(day)
                                    ? 'bg-brand-teal text-white border-brand-teal hover:bg-brand-teal-dark'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                                    }`}
                            >
                                {day}
                            </button>
                        ))}
                    </div>

                    <div className="flex space-x-4 mb-4">
                        <div className="flex-1">
                            <label htmlFor="start-time" className="block text-sm font-medium text-gray-700">From (Start Time)</label>
                            <input
                                id="start-time"
                                type="time"
                                value={newSlot.startTime}
                                onChange={(e) => handleSlotChange('startTime', e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-brand-teal focus:border-brand-teal sm:text-sm"
                            />
                        </div>
                        <div className="flex-1">
                            <label htmlFor="end-time" className="block text-sm font-medium text-gray-700">To (End Time)</label>
                            <input
                                id="end-time"
                                type="time"
                                value={newSlot.endTime}
                                onChange={(e) => handleSlotChange('endTime', e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-brand-teal focus:border-brand-teal sm:text-sm"
                            />
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleAddSlot}
                        className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-teal hover:bg-brand-teal-dark"
                    >
                        <PlusCircleIcon className="h-5 w-5 mr-2" />
                        Add Slot
                    </button>
                </div>

                {availability.length > 0 && (
                    <div className="border border-gray-200 rounded-lg p-3 space-y-3 max-h-52 overflow-y-auto">
                        <p className="text-sm font-medium text-gray-700">Your Current Availability:</p>
                        {availability.map((slot, index) => (
                            <div
                                key={slot.id || index}
                                className="flex justify-between items-center bg-white p-3 border rounded-md shadow-sm"
                            >
                                <div>
                                    <p className="font-semibold text-gray-800">
                                        {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                    </p>
                                    <p className="text-xs text-gray-600 mt-1">
                                        {slot.days.sort((a, b) => DAYS_OF_WEEK.indexOf(a) - DAYS_OF_WEEK.indexOf(b)).join(', ')}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveSlot(slot.id)}
                                    className="text-gray-400 hover:text-red-500 p-1"
                                    title="Remove slot"
                                >
                                    <XCircleIcon className="h-6 w-6" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const renderEditForm = () => {
        if (!editData) return null;
        const previewUrl = editData.profilePicFile ? URL.createObjectURL(editData.profilePicFile) : userData.profilePicUrl;

        return (
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-white">Edit Profile</h1>
                </div>
                <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture</label>
                        <div className="mt-2 flex items-center space-x-4">
                            <img
                                src={previewUrl || "/placeholder.svg"}
                                alt="Profile Preview"
                                className="w-20 h-20 rounded-full object-cover"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/asset/p4.jpg';
                                }}
                            />
                            <label htmlFor="file-upload" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50">
                                <span>Change Picture</span>
                                <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*" />
                            </label>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                            <input type="text" name="firstName" value={editData.firstName} onChange={handleInputChange} className={`w-full border ${fieldErrors.firstName ? 'border-red-500' : 'border-gray-300'} p-2 rounded-md`} placeholder="First name" />
                            {fieldErrors.firstName && <p className="text-red-500 text-xs mt-1">{fieldErrors.firstName}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                            <input type="text" name="lastName" value={editData.lastName} onChange={handleInputChange} className={`w-full border ${fieldErrors.lastName ? 'border-red-500' : 'border-gray-300'} p-2 rounded-md`} placeholder="Last name" />
                            {fieldErrors.lastName && <p className="text-red-500 text-xs mt-1">{fieldErrors.lastName}</p>}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input type="email" name="email" value={editData.email} disabled className="w-full border border-gray-300 p-2 rounded-md bg-gray-100 cursor-not-allowed" placeholder="Enter your email address" />
                        <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                        <input type="date" name="dob" value={editData.dob} onChange={handleInputChange} className={`w-full border ${fieldErrors.dob ? 'border-red-500' : 'border-gray-300'} p-2 rounded-md`} placeholder="Select your date of birth" />
                        {fieldErrors.dob && <p className="text-red-500 text-xs mt-1">{fieldErrors.dob}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">About Me</label>
                        <textarea name="about" value={editData.about} onChange={handleInputChange} rows={4} className={`w-full border ${fieldErrors.about ? 'border-red-500' : 'border-gray-300'} p-2 rounded-md`} placeholder="Tell us about yourself"></textarea>
                        {fieldErrors.about && <p className="text-red-500 text-xs mt-1">{fieldErrors.about}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
                        <AvailabilitySelector
                            availability={editData.availability}
                            setAvailability={(avail) => {
                                setEditData(prev => {
                                    if (!prev) return null;
                                    const newAvail = typeof avail === 'function' ? avail(prev.availability) : avail;
                                    return { ...prev, availability: newAvail };
                                });
                            }}
                            setError={setError}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Skills to Teach</label>
                        {skillsLoading ? (
                            <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500">
                                Loading skills...
                            </div>
                        ) : (
                            <MultiSelectDropdown
                                options={skillsList}
                                selectedOptions={editData.teachSkills}
                                setSelectedOptions={(skills) => handleSkillsChange(skills, 'teachSkills')}
                                placeholder="Select skills you can teach"
                            />
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Skills to Learn</label>
                        {skillsLoading ? (
                            <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500">
                                Loading skills...
                            </div>
                        ) : (
                            <MultiSelectDropdown
                                options={skillsList}
                                selectedOptions={editData.learnSkills}
                                setSelectedOptions={(skills) => handleSkillsChange(skills, 'learnSkills')}
                                placeholder="Select skills you want to learn"
                            />
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Social Media Links</label>
                        <div className="space-y-2">
                            {editData.socialLinks.map((link, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                    <input
                                        type="url"
                                        value={link}
                                        onChange={(e) => handleSocialLinkChange(index, e.target.value)}
                                        className="w-full border border-gray-300 p-2 rounded-md"
                                        placeholder="https://github.com/your-profile or https://linkedin.com/in/your-profile"
                                    />
                                    {editData.socialLinks.length > 1 && (
                                        <button type="button" onClick={() => handleRemoveSocialLink(index)} className="text-red-500 hover:text-red-700" title="Remove link">
                                            <XCircleIcon className="h-6 w-6" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={handleAddSocialLink}
                            className="mt-2 flex items-center text-sm font-medium text-brand-teal hover:text-brand-teal-dark"
                        >
                            <PlusCircleIcon className="h-5 w-5 mr-1" />
                            Add another link
                        </button>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end gap-3 sm:space-x-4 pt-4">
                        <button
                            onClick={handleCancel}
                            disabled={isSaving}
                            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-brand-teal text-white px-4 py-2 rounded-lg hover:bg-brand-teal-dark w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    const renderDisplayView = () => (
        <div className="max-w-6xl mx-auto space-y-6 pb-8">
            {/* Header Section */}
            <div className="relative rounded-2xl overflow-hidden shadow-xl shadow-gray-200/50">
                <div className="absolute inset-0 bg-gradient-to-r from-brand-teal to-cyan-500"></div>

                <div className="relative z-10 px-6 py-6 flex flex-col md:flex-row items-center md:items-start gap-5">
                    <div className="flex-shrink-0">
                        <div className="w-24 h-24 rounded-2xl border-4 border-white/20 shadow-lg overflow-hidden backdrop-blur-sm bg-white/10 p-1">
                            <img
                                src={userData.profilePicUrl || '/asset/p4.jpg'}
                                alt={userData.name}
                                className="w-full h-full rounded-xl object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).src = '/asset/p4.jpg' }}
                            />
                        </div>
                    </div>
                    <div className="flex-1 text-center md:text-left text-white">
                        <h1 className="text-2xl font-bold tracking-tight">{userData.name || 'Your Name'}</h1>
                        <p className="text-teal-50 text-sm mt-0.5 font-medium">{userData.email}</p>
                        {userData.dob && (
                            <p className="text-teal-100 text-xs mt-1 flex items-center justify-center md:justify-start gap-1.5">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                Born: {new Date(userData.dob).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                        )}
                        {/* Social Links in Header */}
                        {userData.socialLinks && userData.socialLinks.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
                                {userData.socialLinks.map((link, index) => {
                                    const normalizedUrl = normalizeUrl(link);
                                    return (
                                        <a
                                            key={index}
                                            href={normalizedUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white transition-all border border-white/30 hover:border-white/50 hover:scale-110 shadow-sm"
                                            title={link}
                                        >
                                            {getSocialIcon(link)}
                                        </a>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    <div className="flex-shrink-0 mt-3 md:mt-0">
                        <button
                            onClick={handleEdit}
                            className="px-5 py-2 bg-white text-brand-teal font-bold text-sm rounded-full hover:bg-gray-50 hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                        >
                            Edit Profile
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column (Main Info) */}
                <div className="lg:col-span-8 space-y-6">
                    {/* About Me */}
                    <div className="bg-white rounded-2xl p-6 shadow-lg shadow-slate-200/60 border border-slate-100">
                        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <span className="w-6 h-1 bg-brand-teal rounded-full"></span>
                            About Me
                        </h3>
                        <p className="text-slate-600 text-base leading-relaxed whitespace-pre-line">
                            {userData.about || 'Tell others about yourself — what you teach, learn, and enjoy.'}
                        </p>
                    </div>

                    {/* Learning Roadmap (Premium) */}
                    <div className="relative group overflow-hidden rounded-2xl shadow-lg shadow-slate-200/60 border border-slate-100 bg-slate-900">
                        {/* Background Deco */}
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-brand-teal opacity-40"></div>

                        <div className="relative p-6 text-white z-10">
                            <h3 className="text-xl font-bold mb-1.5">Learning Roadmap</h3>
                            <p className="text-slate-300 text-sm">Unlock your personalized growth plan.</p>

                            {/* Blurred Content Preview */}
                            <div className="mt-5 space-y-3 opacity-30 select-none filter blur-sm">
                                <div className="h-3 bg-white/20 rounded w-3/4"></div>
                                <div className="h-3 bg-white/20 rounded w-1/2"></div>
                                <div className="h-3 bg-white/20 rounded w-5/6"></div>
                                <div className="h-3 bg-white/20 rounded w-2/3"></div>
                            </div>

                            {/* CTA Overlay */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 backdrop-blur-sm z-20 p-5 text-center">
                                <CrownBadgeIcon className="w-14 h-14 text-amber-400 mb-3 drop-shadow-lg" />
                                <h4 className="text-lg font-bold text-white mb-1.5">Premium Feature</h4>
                                <p className="text-slate-200 text-sm mb-4 max-w-md">Upgrade to Premium to access detailed learning paths, progress tracking, and exclusive content.</p>
                                <button className="px-6 py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-bold rounded-full shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-105 transition-all">
                                    Upgrade to Premium
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column (Details) */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Skills Card */}
                    <div className="bg-white rounded-2xl p-6 shadow-lg shadow-slate-200/60 border border-slate-100">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Skills</h3>

                        <div className="mb-5">
                            <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-3 border-b border-emerald-100 pb-1.5">Teaching</h4>
                            <div className="flex flex-wrap gap-2">
                                {userData.teachSkills.length ? userData.teachSkills.map(skill => <SkillTag key={skill} skill={skill} variant="teach" />) : <span className="text-slate-400 italic text-xs">No teaching skills added</span>}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3 border-b border-indigo-100 pb-1.5">Learning</h4>
                            <div className="flex flex-wrap gap-2">
                                {userData.learnSkills.length ? userData.learnSkills.map(skill => <SkillTag key={skill} skill={skill} variant="learn" />) : <span className="text-slate-400 italic text-xs">No learning skills added</span>}
                            </div>
                        </div>
                    </div>

                    {/* Availability Card */}
                    <div className="bg-white rounded-2xl p-6 shadow-lg shadow-slate-200/60 border border-slate-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-slate-800">Availability</h3>
                            <AvailabilityIcon className="w-5 h-5 text-gray-400" />
                        </div>
                        {userData.availability && userData.availability.length > 0 ? (
                            <div className="space-y-3">
                                {userData.availability.map((slot, index) => {
                                    const formatTime = (time: string): string => {
                                        if (!time) return '';
                                        try {
                                            const [hours, minutes] = time.split(':').map(Number);
                                            const period = hours >= 12 ? 'PM' : 'AM';
                                            const displayHours = hours % 12 || 12;
                                            return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
                                        } catch {
                                            return time;
                                        }
                                    };
                                    return (
                                        <div key={slot.id || index} className="group relative bg-slate-50 hover:bg-teal-50 rounded-xl p-3 transition-colors border border-slate-100">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                                                <span className="font-bold text-slate-700 text-sm">{formatTime(slot.startTime)} - {formatTime(slot.endTime)}</span>
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {slot.days.sort((a, b) => DAYS_OF_WEEK.indexOf(a) - DAYS_OF_WEEK.indexOf(b)).map(day => (
                                                    <span key={day} className="text-xs font-medium text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                                        {day.substring(0, 3)}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-5 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                                <p className="text-slate-500 text-sm">No availability set</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderBlockedUsersView = () => {
        if (isLoadingBlockedUsers) {
            return (
                <div className="flex items-center justify-center p-12">
                    <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-teal mb-4"></div>
                        <p className="text-gray-500 font-medium">Loading blocked users...</p>
                    </div>
                </div>
            );
        }

        if (blockedUsers.length === 0) {
            return (
                <div className="bg-white rounded-3xl p-16 shadow-xl shadow-slate-200/60 border border-slate-100 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldBadgeIcon className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">No Blocked Users</h3>
                    <p className="text-slate-500 text-lg">You haven't blocked anyone yet. Peace of mind enabled.</p>
                </div>
            );
        }

        return (
            <div className="space-y-6">
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-slate-50 to-white px-8 py-6 border-b border-slate-100">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <span className="w-2 h-6 bg-red-500 rounded-full"></span>
                            Blocked Users
                        </h2>
                    </div>

                    <div className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {blockedUsers.map((user) => (
                                <div key={user.id} className="group bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-red-100 transition-all flex items-center justify-between relative overflow-hidden">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-400 rounded-l-2xl"></div>

                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-full p-0.5 bg-red-100/50">
                                            <img
                                                src={user.profilePic || '/asset/p1.jfif'}
                                                alt={user.name}
                                                className="w-full h-full rounded-full object-cover"
                                                onError={(e) => { (e.target as HTMLImageElement).src = '/asset/p1.jfif' }}
                                            />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800 text-lg leading-tight">{user.name}</h3>
                                            <p className="text-xs font-bold text-red-500 uppercase tracking-wide mt-0.5">Blocked</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleUnblockFromView(user.id)}
                                        className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-800 hover:text-white transition-all font-bold text-sm shadow-sm"
                                    >
                                        Unblock
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const handleUnblockFromView = async (userId: string) => {
        try {
            const resp = await authApi.unblockUser(userId);
            if (!resp.success) {
                navigation.showNotification(resp.message || 'Failed to unblock user');
                return;
            }

            // Remove from blocked users list
            setBlockedUsers((prev) => prev.filter((u) => u.id !== userId));
            navigation.showNotification('User unblocked successfully');
        } catch (err) {
            console.error('Unblock error:', err);
            navigation.showNotification('Failed to unblock user. Please try again.');
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case "Personal Details":
                return isEditing ? renderEditForm() : renderDisplayView()
            case "Messenger":
                return <MessengerPage navigation={navigation} />
            case "Notifications":
                return <NotificationsPage navigation={navigation} />
            case "Schedule Classes":
                return <ScheduleSessionPage navigation={navigation} />
            case "Manage Requests":
                return <ManageRequestsPage navigation={navigation} />
            case "Watch Activity":
                return <WatchActivityPage navigation={navigation} />
            case "See Progress":
                return <SeeProgressPage navigation={navigation} />
            case "Certificates":
                return <CertificatesPage navigation={navigation} />
            case "Settings":
                return <SettingsPage navigation={navigation} />
            case "Reminders":
                return <RemindersPage navigation={navigation} />
            case "Help Center":
                return <HelpCenterPage navigation={navigation} />
            case "Blocked Users":
                return renderBlockedUsersView()
            default:
                return (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center text-gray-500">
                            <h2 className="text-2xl font-semibold mb-2">{activeTab}</h2>
                            <p>Content for this section will be displayed here.</p>
                        </div>
                    </div>
                )
        }
    }


    return (
        <div className="bg-brand-teal min-h-screen flex font-sans">
            {/* Mobile Header */}
            <header className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white p-4 flex justify-between items-center shadow-md">
                {isMobileSearchOpen ? (
                    <div className="w-full flex items-center">
                        <div className="relative w-full">
                            <input type="text" placeholder="Search dashboard..." className="w-full bg-gray-100 text-gray-800 rounded-lg py-2 pl-10 pr-4 text-sm" autoFocus />
                            <SearchIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        </div>
                        <button onClick={() => setIsMobileSearchOpen(false)} className="ml-2 text-brand-teal shrink-0" title="Close search">
                            <CloseIcon className="w-6 h-6" />
                        </button>
                    </div>
                ) : (
                    <>
                        <div
                            className="flex items-center space-x-2 cursor-pointer"
                            onClick={() => navigation.navigateTo(Page.Home)}
                        >
                            <img src="/asset/logo.png" alt="Hunar Bazaar Logo" className="w-8 h-8 object-contain" />
                            <span className="text-xl font-bold text-brand-teal">HunarBazaar</span>
                        </div>
                        <div className="flex items-center space-x-3 sm:space-x-4">
                            <button title="Search" onClick={() => setIsMobileSearchOpen(true)} className="text-gray-600 hover:text-brand-teal"><SearchIcon className="w-6 h-6" /></button>
                            <button title="Notifications" onClick={() => { navigation.navigateTo(Page.Notifications); }} className="text-gray-600 hover:text-brand-teal relative">
                                <NotificationIcon className="w-6 h-6" />
                                {totalGeneralNotificationCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                                        {totalGeneralNotificationCount > 99 ? '99+' : totalGeneralNotificationCount}
                                    </span>
                                )}
                            </button>
                            <button
                                title="Messages"
                                onClick={() => { navigation.navigateTo(Page.Messenger); }}
                                className="text-gray-600 hover:text-brand-teal relative"
                            >
                                <MessengerIcon className="w-6 h-6" />
                                {unreadMessageCount > 0 && (
                                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs font-bold flex items-center justify-center rounded-full border-2 border-white">
                                        {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                                    </span>
                                )}
                            </button>
                            <button title="Menu" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-brand-teal">
                                {isSidebarOpen ? <CloseIcon className="w-6 h-6" /> : <HamburgerIcon className="w-6 h-6" />}
                            </button>
                        </div>
                    </>
                )}
            </header>


            {/* Sidebar */}
            <aside className={`w-[280px] bg-brand-light-blue p-6 flex-shrink-0 flex flex-col border-r border-gray-200/50 fixed md:relative inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:inset-y-auto md:fixed-none ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="hidden md:flex items-center justify-start mb-8" onClick={() => navigation.navigateTo(Page.Home)} style={{ cursor: 'pointer' }}>
                    <div className="flex items-center space-x-2">
                        <img src="/asset/logo.png" alt="Hunar Bazaar Logo" className="w-8 h-8 object-contain" />
                        <span className="text-xl font-bold text-brand-teal">HunarBazaar</span>
                    </div>
                </div>
                {/* Quick actions: Messenger & Notifications (above nav) */}
                <div className="hidden md:flex items-center justify-between mb-6">
                    <div className="flex gap-2">
                        <button
                            onClick={() => { navigation.navigateTo(Page.Messenger); setIsSidebarOpen(false); }}
                            title="Messenger"
                            className="p-2 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 relative"
                        >
                            <MessengerIcon className="w-5 h-5 text-gray-600" />
                            {unreadMessageCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold flex items-center justify-center rounded-full border-2 border-white">
                                    {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => { navigation.navigateTo(Page.Notifications); setIsSidebarOpen(false); }}
                            title="Notifications"
                            className="p-2 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 relative"
                        >
                            <NotificationIcon className="w-5 h-5 text-gray-600" />
                            {totalGeneralNotificationCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                                    {totalGeneralNotificationCount > 99 ? '99+' : totalGeneralNotificationCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                <nav className="space-y-3 mt-16 md:mt-0 overflow-y-auto flex-1">
                    {menuItems.map((item) => (
                        <a
                            href="#"
                            key={item.label}
                            onClick={(e) => {
                                e.preventDefault();
                                setActiveTab(item.label);
                                setIsEditing(false);
                                setIsSidebarOpen(false);
                            }}
                            className={`flex items-center p-3 rounded-lg transition-colors text-sm font-medium ${activeTab === item.label ? 'bg-white shadow-sm text-brand-teal' : 'text-gray-700 hover:bg-white/50'}`}
                        >
                            <item.icon className={`w-5 h-5 shrink-0 ${activeTab === item.label ? 'text-brand-teal' : 'text-gray-500'}`} />
                            <span className="ml-4">{item.label}</span>
                        </a>
                    ))}
                </nav>

                <div className="flex-shrink-0 pt-6 border-t border-gray-200/50">
                    <button
                        onClick={() => navigation.logout()}
                        className="w-full justify-center text-center p-3 rounded-lg transition-colors text-sm font-medium bg-brand-teal text-white hover:bg-brand-teal-dark">
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4 sm:p-6 md:p-10 overflow-y-auto mt-16 md:mt-0">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <p className="text-gray-600">Loading your profile...</p>
                        </div>
                    </div>
                ) : error && !isEditing ? (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                        <p className="text-red-600">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-2 text-red-600 hover:text-red-800 underline"
                        >
                            Retry
                        </button>
                    </div>
                ) : (
                    <>
                        {error && isEditing && (
                            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
                                <p className="text-red-600 text-sm">{error}</p>
                            </div>
                        )}
                        {renderContent()}
                    </>
                )}
            </main>
        </div>
    );
};

export default MyAccountPage;