import React, { useState, useEffect } from 'react';
import { Page, Navigation } from '../App';
import ScheduleSessionPage from "./ScheduleSessionPage";
import WatchActivityPage from "./WatchActivityPage";
import ManageRequestsPage from "./ManageRequestsPage";
import SeeProgressPage from "./SeeProgressPage";
import CertificatesPage from "./CertificatesPage";
import SettingsPage from "./SettingsPage";
import RemindersPage from "./RemindersPage";
import HelpCenterPage from "./HelpCenterPage";
import MessengerPage from "./MessengerPage";
import NotificationsPage from "./NotificationsPage";

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
import { GithubIcon, LinkedInIcon, InstagramIcon, FacebookIcon, TwitterIcon } from '../components/icons/SocialIcons';
import { EditIcon, PlusCircleIcon, SearchIcon, XCircleIcon } from '../components/icons/MiscIcons';
import { HamburgerIcon, CloseIcon } from '../components/icons/MenuIcons';
import { authApi } from '../utils/api';

interface UserData {
    name: string;
    email: string;
    dob: string;
    about: string;
    availability: string;
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
interface EditFormData extends Omit<UserData, 'profilePicUrl' | 'credits' | 'badges' | 'pendingRequests'> {
    profilePicFile: File | null;
}

const MyAccountPage: React.FC<{ navigation: Navigation }> = ({ navigation }) => {
    const [activeTab, setActiveTab] = useState('Personal Details');
    const [isEditing, setIsEditing] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [userData, setUserData] = useState<UserData>({
        name: '',
        email: '',
        dob: '',
        about: '',
        availability: '',
        teachSkills: [],
        learnSkills: [],
        credits: 0,
        badges: 0,
        pendingRequests: 0,
        profilePicUrl: '/asset/p4.jpg',
        socialLinks: [],
        joinedDate: undefined,
    });
    
    const [editData, setEditData] = useState<EditFormData | null>(null);

    useEffect(() => {
        const body = document.body;
        body.style.overflow = isSidebarOpen ? 'hidden' : 'auto';
        return () => { body.style.overflow = 'auto'; };
    }, [isSidebarOpen]);

    useEffect(() => {
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
                        availability: string;
                        teachSkills: string[];
                        learnSkills: string[];
                        credits: number;
                        badges: number;
                        profilePicUrl: string | null;
                        socialLinks: string[];
                        joinedDate?: string;
                    };
                    setUserData({
                        name: data.name,
                        email: data.email,
                        dob: data.dob,
                        about: data.about,
                        availability: data.availability,
                        teachSkills: data.teachSkills,
                        learnSkills: data.learnSkills,
                        credits: data.credits,
                        badges: data.badges,
                        pendingRequests: 0,
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

    // --- Handlers for editing profile ---
    const handleEdit = () => {
        setEditData({
            ...userData,
            profilePicFile: null,
            socialLinks: userData.socialLinks.length > 0 ? [...userData.socialLinks] : [''],
        }); 
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditData(null);
    };

    const handleSave = async () => {
        if (!editData) return;
        setIsSaving(true);
        setError('');

        try {
            let profilePicBase64 = userData.profilePicUrl;
            if (editData.profilePicFile) {
                const reader = new FileReader();
                profilePicBase64 = await new Promise<string>((resolve, reject) => {
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(editData.profilePicFile!);
                });
            }

            const updateData: any = {};
            const nameParts = editData.name.trim().split(/\s+/);
            updateData.firstName = nameParts[0];
            updateData.lastName = nameParts.slice(1).join(' ') || '';

            if (editData.dob) updateData.dob = editData.dob;
            if (editData.about) updateData.about = editData.about;
            if (editData.availability) updateData.availability = editData.availability;
            if (editData.teachSkills.length) updateData.teachSkills = editData.teachSkills;
            if (editData.learnSkills.length) updateData.learnSkills = editData.learnSkills;
            if (editData.socialLinks) {
                updateData.socialLinks = editData.socialLinks
                    .filter(link => link.trim() !== '')
                    .map(link => normalizeUrl(link));
            }
            if (profilePicBase64 !== userData.profilePicUrl) updateData.profilePic = profilePicBase64;

            const response = await authApi.updateProfile(updateData);
            if (response.success) {
                setUserData(prev => ({
                    ...prev,
                    name: editData.name,
                    dob: editData.dob,
                    about: editData.about,
                    availability: editData.availability,
                    teachSkills: editData.teachSkills,
                    learnSkills: editData.learnSkills,
                    profilePicUrl: profilePicBase64,
                    socialLinks: editData.socialLinks.filter(link => link.trim() !== '').map(link => normalizeUrl(link)),
                }));
                setIsEditing(false);
                setEditData(null);
            } else {
                setError(response.message || 'Failed to update profile');
            }
        } catch {
            setError('An error occurred while saving your profile');
        } finally {
            setIsSaving(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!editData) return;
        setEditData(prev => prev ? ({ ...prev, [e.target.name]: e.target.value }) : null);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setEditData(prev => prev ? ({ ...prev, profilePicFile: e.target.files[0] }) : null);
        }
    };

    const handleSkillsChange = (e: React.ChangeEvent<HTMLInputElement>, skillType: 'teachSkills' | 'learnSkills') => {
        if (!editData) return;
        setEditData(prev => prev ? ({ ...prev, [skillType]: e.target.value.split(',').map(s => s.trim()) }) : null);
    };

    const handleSocialLinkChange = (index: number, value: string) => {
        if (!editData) return;
        const newLinks = [...editData.socialLinks];
        newLinks[index] = value;
        setEditData(prev => prev ? { ...prev, socialLinks: newLinks } : null);
    };

    const handleAddSocialLink = () => {
        if (!editData) return;
        setEditData(prev => prev ? { ...prev, socialLinks: [...prev.socialLinks, ''] } : null);
    };

    const handleRemoveSocialLink = (index: number) => {
        if (!editData) return;
        const newLinks = [...editData.socialLinks];
        newLinks.splice(index, 1);
        setEditData(prev => prev ? { ...prev, socialLinks: newLinks } : null);
    };

    // --- Menu Items ---
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
    ];

    const SkillTag: React.FC<{ skill: string }> = ({ skill }) => (
        <span className="bg-brand-teal/10 text-brand-teal text-sm font-medium px-3 py-1 rounded-full">{skill}</span>
    );

    const badgeComponents = [ BadgeIcon, ShieldBadgeIcon, CrownBadgeIcon ];
    const badgeColors = ['text-brand-accent-yellow', 'text-gray-500', 'text-amber-500', 'text-sky-500', 'text-rose-500'];

    const getSocialIcon = (url: string) => {
        const lowerUrl = url.toLowerCase();
        if (lowerUrl.includes('github.com')) return <GithubIcon className="w-6 h-6" />;
        if (lowerUrl.includes('linkedin.com')) return <LinkedInIcon className="w-6 h-6" />;
        if (lowerUrl.includes('instagram.com')) return <InstagramIcon className="w-6 h-6" />;
        if (lowerUrl.includes('facebook.com')) return <FacebookIcon className="w-6 h-6" />;
        if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) return <TwitterIcon className="w-6 h-6" />;
        return <GithubIcon className="w-6 h-6" />;
    };

    const normalizeUrl = (url: string) => url.startsWith('http') ? url : `https://${url.trim()}`;

    const renderEditForm = () => {
        if (!editData) return null;
        const previewUrl = editData.profilePicFile ? URL.createObjectURL(editData.profilePicFile) : userData.profilePicUrl;
        return (
            <div className="space-y-6">
                {/* Edit form content here */}
            </div>
        );
    };

    const renderDisplayView = () => (
        <div className="space-y-8">
            {/* Display profile, skills, availability, social links */}
        </div>
    );

    const renderContent = () => {
        switch (activeTab) {
            case "Personal Details": return isEditing ? renderEditForm() : renderDisplayView();
            case "Messenger": return <MessengerPage navigation={navigation} />;
            case "Notifications": return <NotificationsPage navigation={navigation} />;
            case "Schedule Classes": return <ScheduleSessionPage navigation={navigation} />;
            case "Manage Requests": return <ManageRequestsPage navigation={navigation} />;
            case "Watch Activity": return <WatchActivityPage navigation={navigation} />;
            case "See Progress": return <SeeProgressPage navigation={navigation} />;
            case "Certificates": return <CertificatesPage navigation={navigation} />;
            case "Settings": return <SettingsPage navigation={navigation} />;
            case "Reminders": return <RemindersPage navigation={navigation} />;
            case "Help Center": return <HelpCenterPage navigation={navigation} />;
            default: return <div className="text-center text-gray-500">No content</div>;
        }
    };

    return (
        <div className="bg-brand-teal min-h-screen flex font-sans">
            {/* Sidebar, Header, Main content */}
            <main className="flex-1 p-6 md:p-10 overflow-y-auto mt-16 md:mt-0">
                {isLoading ? <p>Loading...</p> : renderContent()}
            </main>
        </div>
    );
};

export default MyAccountPage;
