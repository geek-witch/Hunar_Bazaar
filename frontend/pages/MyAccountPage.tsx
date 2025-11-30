import React, { useState, useEffect } from 'react';
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
        profilePicUrl: '/asset/p4.jpg',
        socialLinks: [],
        joinedDate: undefined,
    });
    
    const [editData, setEditData] = useState<EditFormData | null>(null);

    useEffect(() => {
        const body = document.body;
        if (isSidebarOpen) {
            body.style.overflow = 'hidden';
        } else {
            body.style.overflow = 'auto';
        }

        // Cleanup function to reset the style when the component unmounts
        return () => {
            body.style.overflow = 'auto';
        };
    }, [isSidebarOpen]);

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
                        availability: string;
                        teachSkills: string[];
                        learnSkills: string[];
                        credits: number;
                        badges: number;
                        profilePicUrl: string | null;
                        socialLinks: string[];
                        joinedDate?: string;
                    };
                    // Note: `joinedDate` should be set by your backend at account creation
                    // (e.g., createdAt). The API should return it and it will be displayed
                    // here as 'Member since' and visible to other users when viewing profiles.
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


    const handleEdit = () => {
        setEditData({
            ...userData,
            profilePicFile: null,
            socialLinks: userData.socialLinks && userData.socialLinks.length > 0 ? [...userData.socialLinks] : [''],
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
                availability?: string;
                teachSkills?: string[];
                learnSkills?: string[];
                socialLinks?: string[];
                profilePic?: string | null;
            } = {};

            // Split name into firstName and lastName
            const nameParts = editData.name.trim().split(/\s+/);
            if (nameParts.length >= 2) {
                updateData.firstName = nameParts[0];
                updateData.lastName = nameParts.slice(1).join(' ');
            } else if (nameParts.length === 1) {
                updateData.firstName = nameParts[0];
                updateData.lastName = '';
            }

            if (editData.dob) updateData.dob = editData.dob;
            if (editData.about) updateData.about = editData.about;
            if (editData.availability) updateData.availability = editData.availability;
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

            const response = await authApi.updateProfile(updateData);
            
            if (response.success) {
                // Update local state with saved data
                setUserData(prev => ({
                    ...prev,
                    name: editData.name,
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
            } else {
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
    };
    
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
             setEditData(prev => prev ? ({ ...prev, profilePicFile: e.target.files[0] }) : null);
        }
    };

    const handleSkillsChange = (e: React.ChangeEvent<HTMLInputElement>, skillType: 'teachSkills' | 'learnSkills') => {
        if (!editData) return;
        const { value } = e.target;
        setEditData(prev => prev ? ({...prev, [skillType]: value.split(',').map(s => s.trim())}) : null);
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
    ];

    const SkillTag: React.FC<{ skill: string }> = ({ skill }) => (
        <span className="bg-brand-teal/10 text-brand-teal text-sm font-medium px-3 py-1 rounded-full">{skill}</span>
    );
    
    const badgeComponents = [ BadgeIcon, ShieldBadgeIcon, CrownBadgeIcon ];
    const badgeColors = [
        'text-brand-accent-yellow', 'text-gray-500', 'text-amber-500', 
        'text-sky-500', 'text-rose-500'
    ];

    const getSocialIcon = (url: string) => {
        const lowerUrl = url.toLowerCase();
        if (lowerUrl.includes('github.com')) {
            return <GithubIcon className="w-6 h-6" />;
        } else if (lowerUrl.includes('linkedin.com')) {
            return <LinkedInIcon className="w-6 h-6" />;
        } else if (lowerUrl.includes('instagram.com')) {
            return <InstagramIcon className="w-6 h-6" />;
        } else if (lowerUrl.includes('facebook.com')) {
            return <FacebookIcon className="w-6 h-6" />;
        } else if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) {
            return <TwitterIcon className="w-6 h-6" />;
        }

        return <GithubIcon className="w-6 h-6" />;
    };

    const normalizeUrl = (url: string): string => {
        if (!url) return url;
        const trimmed = url.trim();
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
            return trimmed;
        }
        return `https://${trimmed}`;
    };

    const renderEditForm = () => {
        if (!editData) return null;
        const previewUrl = editData.profilePicFile ? URL.createObjectURL(editData.profilePicFile) : userData.profilePicUrl;

        return (
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-white">Edit Profile</h1>
                </div>
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture</label>
                        <div className="mt-2 flex items-center space-x-4">
                            <img 
                                src={previewUrl} 
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
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input type="text" name="name" value={editData.name} onChange={handleInputChange} className="w-full border border-gray-300 p-2 rounded-md" placeholder="Enter your full name" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input type="email" name="email" value={editData.email} disabled className="w-full border border-gray-300 p-2 rounded-md bg-gray-100 cursor-not-allowed" placeholder="Enter your email address" />
                        <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                        <input type="date" name="dob" value={editData.dob} onChange={handleInputChange} className="w-full border border-gray-300 p-2 rounded-md" placeholder="Select your date of birth" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">About Me</label>
                        <textarea name="about" value={editData.about} onChange={handleInputChange} rows={4} className="w-full border border-gray-300 p-2 rounded-md" placeholder="Tell us about yourself"></textarea>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
                        <textarea name="availability" value={editData.availability} onChange={handleInputChange} rows={3} className="w-full border border-gray-300 p-2 rounded-md" placeholder="Enter your availability (e.g., Weekdays 6 PM - 9 PM EST)"></textarea>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Skills to Teach (comma separated)</label>
                        <input type="text" value={editData.teachSkills.join(', ')} onChange={(e) => handleSkillsChange(e, 'teachSkills')} className="w-full border border-gray-300 p-2 rounded-md" placeholder="Enter skills separated by commas (e.g., Python, C++)" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Skills to Learn (comma separated)</label>
                        <input type="text" value={editData.learnSkills.join(', ')} onChange={(e) => handleSkillsChange(e, 'learnSkills')} className="w-full border border-gray-300 p-2 rounded-md" placeholder="Enter skills separated by commas (e.g., Coding, Desinging)" />
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
                                            <XCircleIcon className="h-6 w-6"/>
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
        <div className="space-y-8">
            

            {/* Profile */}
          <div className="bg-white py-2 sm:py-3 px-4 sm:px-6 rounded-lg shadow-sm">
  <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
    <div className="flex items-center space-x-4">
      <img 
        src={userData.profilePicUrl || '/asset/p4.jpg'} 
        alt={userData.name} 
        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).src = '/asset/p4.jpg';
        }}
      />
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-brand-dark-blue">{userData.name || 'User'}</h2>
        <p className="text-gray-500 text-sm sm:text-base">{userData.email || ''}</p>
        {userData.dob && (
          <p className="text-gray-500 text-xs sm:text-sm mt-1">Born: {new Date(userData.dob).toLocaleDateString()}</p>
        )}
        {userData.joinedDate && (
          <p className="text-gray-500 text-xs sm:text-sm mt-1">Member since: {new Date(userData.joinedDate).toLocaleDateString()}</p>
        )}
      </div>
    </div>
    <div className="flex items-center space-x-2 sm:space-x-4 self-start sm:self-center">
      <div className="hidden md:flex items-center space-x-4">
        <div className="w-px h-6 bg-gray-200"></div>
      </div>
      <button onClick={handleEdit} className="bg-gray-100 p-2 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-200" aria-label="Edit Profile">
        <EditIcon className="w-5 h-5 text-brand-teal"/>
      </button>
    </div>
  </div>

  <hr className="my-2 sm:my-3 border-gray-200" />

  <div className="flex flex-col md:flex-row md:items-start gap-6 md:gap-12">
    {/* Additional content can go here */}
  </div>
</div>

            
            {/* About Me */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">About Me</h3>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{userData.about}</p>
            </div>
            
            {/* Skills */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Skills</h3>
                <div className="space-y-4">
                    <div>
                        <h4 className="font-semibold text-gray-600 mb-2">Skills to Teach</h4>
                        <div className="flex flex-wrap gap-2">
                            {userData.teachSkills.map(skill => <SkillTag key={skill} skill={skill} />)}
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-600 mb-2">Skills to Learn</h4>
                        <div className="flex flex-wrap gap-2">
                             {userData.learnSkills.map(skill => <SkillTag key={skill} skill={skill} />)}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Availability */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Availability</h3>
                <p className="text-gray-600 whitespace-pre-line">{userData.availability}</p>
            </div>

            {/* Social Links */}
            {userData.socialLinks && userData.socialLinks.length > 0 && (
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Social Links</h3>
                    <div className="flex flex-wrap gap-4">
                        {userData.socialLinks.map((link, index) => {
                            const normalizedUrl = normalizeUrl(link);
                            return (
                                <a
                                    key={index}
                                    href={normalizedUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-500 hover:text-brand-teal transition-colors"
                                    title={link}
                                >
                                    {getSocialIcon(link)}
                                </a>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Roadmap */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
                <div className="flex items-center mb-4">
                    <RoadmapIcon className="w-6 h-6 text-brand-teal mr-3" />
                    <h3 className="text-xl font-semibold text-gray-800">Your Learning Roadmap</h3>
                </div>
                <p className="text-gray-600">This is a premium feature. Upgrade your plan to create and track your learning goals.</p>
            </div>
        </div>
    );

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
                             <button title="Search" onClick={() => setIsMobileSearchOpen(true)} className="text-gray-600 hover:text-brand-teal"><SearchIcon className="w-6 h-6"/></button>
                                      <button
                                          title="Notifications"
                                          onClick={() => { setActiveTab('Notifications'); }}
                                          className="text-gray-600 hover:text-brand-teal"
                                      >
                                          <NotificationIcon className="w-6 h-6"/>
                                      </button>
                                      <button
                                          title="Messages"
                                          onClick={() => { setActiveTab('Messenger'); }}
                                          className="text-gray-600 hover:text-brand-teal"
                                      >
                                          <MessengerIcon className="w-6 h-6"/>
                                      </button>
                             <button title="Menu" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-brand-teal">
                                {isSidebarOpen ? <CloseIcon className="w-6 h-6" /> : <HamburgerIcon className="w-6 h-6" />}
                            </button>
                        </div>
                    </>
                )}
            </header>

            {/* Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/50 z-20"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}

             {/* Sidebar */}
            <aside className={`w-[280px] bg-brand-light-blue p-6 flex-shrink-0 flex flex-col border-r border-gray-200/50 fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="hidden md:flex items-center justify-start mb-8" onClick={() => navigation.navigateTo(Page.Home)} style={{cursor: 'pointer'}}>
                    <div className="flex items-center space-x-2">
                       <img src="/asset/logo.png" alt="Hunar Bazaar Logo" className="w-8 h-8 object-contain" />
                       <span className="text-xl font-bold text-brand-teal">HunarBazaar</span>
                    </div>
                </div>
                {/* Quick actions: Messenger & Notifications (above nav) */}
                <div className="hidden md:flex items-center justify-between mb-6">
                    <div className="flex gap-2">
                        <button
                            onClick={() => { setActiveTab('Messenger'); setIsSidebarOpen(false); }}
                            title="Messenger"
                            className="p-2 rounded-lg bg-white hover:bg-gray-50 border border-gray-200"
                        >
                            <MessengerIcon className="w-5 h-5 text-gray-600" />
                        </button>
                        <button
                            onClick={() => { setActiveTab('Notifications'); setIsSidebarOpen(false); }}
                            title="Notifications"
                            className="p-2 rounded-lg bg-white hover:bg-gray-50 border border-gray-200"
                        >
                            <NotificationIcon className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>
                </div>
                
                <nav className="flex-grow space-y-3 mt-16 md:mt-0">
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

                <div className="mt-auto">
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