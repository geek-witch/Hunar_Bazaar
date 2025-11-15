import React, { useState, useEffect } from 'react';
import { Page, Navigation } from '../App';
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
    GithubIcon,
    CrownBadgeIcon,
    ShieldBadgeIcon,
} from '../components/icons/AccountIcons';
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
    });
    
    // State for form inputs
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
                    setUserData({
                        name: response.data.name,
                        email: response.data.email,
                        dob: response.data.dob,
                        about: response.data.about,
                        availability: response.data.availability,
                        teachSkills: response.data.teachSkills,
                        learnSkills: response.data.learnSkills,
                        credits: response.data.credits,
                        badges: response.data.badges,
                        profilePicUrl: response.data.profilePicUrl || '/asset/p4.jpg',
                        socialLinks: response.data.socialLinks || [],
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
            if (editData.socialLinks) updateData.socialLinks = editData.socialLinks.filter(link => link.trim() !== '');
            if (profilePicBase64 && profilePicBase64 !== userData.profilePicUrl) {
                updateData.profilePic = profilePicBase64;
            }

            const response = await authApi.updateProfile(updateData);
            
            if (response.success) {
                // Update local state with saved data
                setUserData(prev => ({
                    ...prev,
                    name: editData.name,
                    email: editData.email,
                    dob: editData.dob,
                    about: editData.about,
                    availability: editData.availability,
                    teachSkills: editData.teachSkills,
                    learnSkills: editData.learnSkills,
                    profilePicUrl: profilePicBase64,
                    socialLinks: editData.socialLinks,
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

    const renderEditForm = () => {
        if (!editData) return null;
        const previewUrl = editData.profilePicFile ? URL.createObjectURL(editData.profilePicFile) : userData.profilePicUrl;

        return (
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Edit Profile</h1>
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
                        <input type="email" name="email" value={editData.email} onChange={handleInputChange} className="w-full border border-gray-300 p-2 rounded-md" placeholder="Enter your email address" />
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
                        <input type="text" value={editData.teachSkills.join(', ')} onChange={(e) => handleSkillsChange(e, 'teachSkills')} className="w-full border border-gray-300 p-2 rounded-md" placeholder="Enter skills separated by commas (e.g., Photography, Photo Editing)" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Skills to Learn (comma separated)</label>
                        <input type="text" value={editData.learnSkills.join(', ')} onChange={(e) => handleSkillsChange(e, 'learnSkills')} className="w-full border border-gray-300 p-2 rounded-md" placeholder="Enter skills separated by commas (e.g., Spanish, Public Speaking)" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Social Media Links</label>
                        {editData.socialLinks.map((link, index) => (
                            <div key={index} className="flex items-center space-x-2 mt-2">
                                <input
                                    type="url"
                                    value={link}
                                    onChange={(e) => handleSocialLinkChange(index, e.target.value)}
                                    className="w-full border border-gray-300 p-2 rounded-md"
                                    placeholder="https://github.com/your-profile"
                                />
                                {editData.socialLinks.length > 1 && (
                                    <button type="button" onClick={() => handleRemoveSocialLink(index)} className="text-red-500 hover:text-red-700">
                                        ✕
                                    </button>
                                )}
                                {index === editData.socialLinks.length - 1 && (
                                    <button type="button" onClick={handleAddSocialLink} className="text-brand-teal hover:text-brand-teal-dark">
                                        +
                                    </button>
                                )}
                            </div>
                        ))}
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
            <div className="relative mb-8">
                <input type="text" placeholder="Search skills, tutors..." className="w-full bg-white text-gray-800 rounded-lg py-3 pl-12 pr-4 shadow-sm border border-gray-200 focus:ring-brand-teal focus:border-brand-teal" />
                <SearchIcon className="w-6 h-6 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Profile, Credits & Badges */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
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
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 sm:space-x-4 self-start sm:self-center">
                        <div className="hidden md:flex items-center space-x-4">
                            <button title="Notifications" className="text-gray-500 hover:text-brand-teal"><NotificationIcon className="w-6 h-6"/></button>
                            <button title="Messages" className="text-gray-500 hover:text-brand-teal"><MessengerIcon className="w-6 h-6"/></button>
                            {userData.socialLinks?.[0] && (
                                <a href={userData.socialLinks[0]} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-brand-teal">
                                    <GithubIcon className="w-6 h-6"/>
                                </a>
                            )}
                            <div className="w-px h-6 bg-gray-200"></div>
                        </div>
                        <button onClick={handleEdit} className="bg-gray-100 p-2 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-200" aria-label="Edit Profile">
                            <EditIcon className="w-5 h-5 text-brand-teal"/>
                        </button>
                    </div>
                </div>
                <hr className="my-4 sm:my-6 border-gray-200" />
                <div className="flex flex-col md:flex-row md:items-start gap-6 md:gap-12">
                    <div>
                        <p className="text-gray-500 text-sm font-medium tracking-wide uppercase">Credit Balance</p>
                        <p className="text-3xl sm:text-4xl font-bold text-brand-dark-blue mt-1">{userData.credits}</p>
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm font-medium tracking-wide uppercase">Badges Earned</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {Array.from({ length: userData.badges }).map((_, index) => {
                                const BadgeComponent = badgeComponents[index % badgeComponents.length];
                                const badgeColor = badgeColors[index % badgeColors.length];
                                return <BadgeComponent key={index} className={`w-8 h-8 ${badgeColor}`} />;
                            })}
                        </div>
                    </div>
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

            {/* Roadmap */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
                <div className="flex items-center mb-4">
                    <RoadmapIcon className="w-6 h-6 text-brand-teal mr-3" />
                    <h3 className="text-xl font-semibold text-gray-800">Your Learning Roadmap</h3>
                </div>
                <p className="text-gray-600">This is a premium feature. Upgrade your plan to create and track your learning goals.</p>
                <ul className="mt-4 space-y-2 list-disc list-inside text-gray-500">
                    <li>Master Spanish basics - In Progress</li>
                    <li>Advanced public speaking techniques - Not Started</li>
                </ul>
            </div>
        </div>
    );

    const renderContent = () => {
        if (activeTab !== 'Personal Details') {
            return (
                <div className="flex items-center justify-center h-full">
                    <div className="text-center text-gray-500">
                        <h2 className="text-2xl font-semibold mb-2">{activeTab}</h2>
                        <p>Content for this section will be displayed here.</p>
                    </div>
                </div>
            );
        }
        
        return isEditing ? renderEditForm() : renderDisplayView();
    };

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
                             <button title="Notifications" className="text-gray-600 hover:text-brand-teal"><NotificationIcon className="w-6 h-6"/></button>
                             <button title="Messages" className="text-gray-600 hover:text-brand-teal"><MessengerIcon className="w-6 h-6"/></button>
                             {userData.socialLinks?.[0] && <a href={userData.socialLinks[0]} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-brand-teal"><GithubIcon className="w-6 h-6"/></a>}
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