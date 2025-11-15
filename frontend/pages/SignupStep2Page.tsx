import React, { useState, useRef, useEffect } from 'react';
import { Page, Navigation } from '../App';
import { UploadIcon, PlusCircleIcon, XCircleIcon } from '../components/icons/MiscIcons';
import { authApi } from '../utils/api';

const SKILLS_LIST = [
  'JavaScript', 'TypeScript', 'React', 'Angular', 'Vue.js', 'Node.js', 
  'Python', 'Django', 'Flask', 'Java', 'Spring', 'C++', 'C#', '.NET',
  'HTML', 'CSS', 'Sass', 'SQL', 'PostgreSQL', 'MongoDB', 'GraphQL',
  'REST APIs', 'Docker', 'Kubernetes', 'AWS', 'Google Cloud', 'Azure',
  'Machine Learning', 'Data Science', 'AI', 'TensorFlow', 'PyTorch',
  'Data Structures & Algorithms', 'Cybersecurity', 'Ethical Hacking',
  'Mobile Development (iOS)', 'Swift', 'Mobile Development (Android)', 'Kotlin',
  'UI/UX Design', 'Figma', 'Web Development'
];

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
    .filter(option => !selectedOptions.includes(option))
    .filter(option => option.toLowerCase().includes(searchTerm.toLowerCase()));

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


const SignupStep2Page: React.FC<{ navigation: Navigation }> = ({ navigation }) => {
  const [teachSkills, setTeachSkills] = useState<string[]>([]);
  const [learnSkills, setLearnSkills] = useState<string[]>([]);
  const [availability, setAvailability] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [socialLinks, setSocialLinks] = useState<string[]>(['']);
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const [errors, setErrors] = useState({
      teachSkills: '', 
      learnSkills: '',
      availability: '',
      bio: '',
      profilePic: '',
      socialLinks: '',
  });

  useEffect(() => {
    // Check if user came from step 1
    const userId = localStorage.getItem('signupUserId');
    if (!userId) {
      // Redirect back to step 1 if no userId found
      navigation.navigateTo(Page.Signup1);
    }
  }, [navigation]);

  const handleLinkChange = (index: number, value: string) => {
    const newLinks = [...socialLinks];
    newLinks[index] = value;
    setSocialLinks(newLinks);
  };

  const handleAddLink = () => {
    setSocialLinks([...socialLinks, '']);
  };

  const handleRemoveLink = (index: number) => {
    const newLinks = [...socialLinks];
    newLinks.splice(index, 1);
    setSocialLinks(newLinks);
  };

  const validate = () => {
    const newErrors = { teachSkills: '', learnSkills: '', availability: '', bio: '', profilePic: '', socialLinks: '' };
    let isValid = true;
    
     if (bio.trim().length < 20 || bio.trim().length > 500) {
      newErrors.bio = 'Bio must be between 20 and 500 characters.';
      isValid = false;
    }
    if (!availability.trim()) {
        newErrors.availability = 'Please describe your availability.';
        isValid = false;
    }
    if (teachSkills.length === 0) {
      newErrors.teachSkills = 'Please select at least one skill you can teach.';
      isValid = false;
    }
    if (learnSkills.length === 0) {
      newErrors.learnSkills = 'Please select at least one skill you want to learn.';
      isValid = false;
    }

    // Validate only non-empty social links
    const invalidLinks = socialLinks.filter(link => link.trim() !== '' && !/^(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+\.){1,}[a-zA-Z]{2,}(\/[^\s]*)?$/.test(link));
    if (invalidLinks.length > 0) {
      newErrors.socialLinks = 'One or more social links are invalid. Please use a valid URL format or leave empty.';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfilePic(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    if (!validate()) {
      return;
    }

    const userId = localStorage.getItem('signupUserId');
    const signupDataStr = localStorage.getItem('signupData');
    
    if (!userId || !signupDataStr) {
      setGeneralError('Session expired. Please start over.');
      navigation.navigateTo(Page.Signup1);
      return;
    }

    const signupData = JSON.parse(signupDataStr);
    
    setIsLoading(true);
    try {
      // Convert profile pic to base64 if provided
      let profilePicBase64 = null;
      if (profilePic) {
        const reader = new FileReader();
        profilePicBase64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(profilePic);
        });
      }

      // Filter out empty social links
      const validSocialLinks = socialLinks.filter(link => link.trim() !== '');

      const response = await authApi.completeProfile({
        userId,
        firstName: signupData.firstName,
        lastName: signupData.lastName,
        dob: signupData.dob,
        bio,
        teachSkills,
        learnSkills,
        availability,
        socialLinks: validSocialLinks.length > 0 ? validSocialLinks : undefined,
        profilePic: profilePicBase64,
      });

      if (response.success) {
        navigation.navigateTo(Page.Verify);
      } else {
        setGeneralError(response.message || 'Failed to complete profile. Please try again.');
      }
    } catch (error) {
      setGeneralError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="bg-brand-light-blue min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-brand-teal">Complete Your Profile</h2>
          <p className="mt-2 text-sm text-gray-600">
            Tell us more about you to get the best matches.
          </p>
        </div>
        {generalError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm text-center">{generalError}</p>
          </div>
        )}
        <form className="mt-8 bg-white p-6 sm:p-8 md:p-10 rounded-xl shadow-lg" onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Side */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Upload your Picture</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-brand-teal hover:text-brand-teal-dark focus-within:outline-none">
                      <span>Upload a file</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/png, image/jpeg, image/gif" />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                   {profilePic && <p className="text-sm text-gray-600 mt-2 font-medium">{profilePic.name}</p>}
                </div>
              </div>
              {errors.profilePic && <p className="text-red-500 text-xs mt-1">{errors.profilePic}</p>}


              <div className="mt-6">
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700">Short Bio</label>
                <textarea id="bio" name="bio" rows={3} className="shadow-sm focus:ring-brand-teal focus:border-brand-teal mt-1 block w-full sm:text-sm border border-gray-300 rounded-md p-2" placeholder="Tell us about yourself..." value={bio} onChange={e => setBio(e.target.value)} />
                {errors.bio && <p className="text-red-500 text-xs mt-1">{errors.bio}</p>}
              </div>
            </div>
            
            {/* Right Side */}
            <div className="space-y-6">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Skills you can Teach</label>
                  <MultiSelectDropdown
                    options={SKILLS_LIST}
                    selectedOptions={teachSkills}
                    setSelectedOptions={setTeachSkills}
                    placeholder="e.g., Python, Graphic Design"
                  />
                  {errors.teachSkills && <p className="text-red-500 text-xs mt-1">{errors.teachSkills}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Skills you want to Learn</label>
                  <MultiSelectDropdown
                    options={SKILLS_LIST}
                    selectedOptions={learnSkills}
                    setSelectedOptions={setLearnSkills}
                    placeholder="e.g., Spanish, Public Speaking"
                  />
                  {errors.learnSkills && <p className="text-red-500 text-xs mt-1">{errors.learnSkills}</p>}
                </div>
                 <div>
                  <label htmlFor="availability" className="block text-sm font-medium text-gray-700">Your Availability</label>
                  <textarea id="availability" name="availability" rows={3} className="shadow-sm focus:ring-brand-teal focus:border-brand-teal mt-1 block w-full sm:text-sm border border-gray-300 rounded-md p-2" placeholder="e.g., Weekends, or weekdays after 5 PM" value={availability} onChange={e => setAvailability(e.target.value)}></textarea>
                  {errors.availability && <p className="text-red-500 text-xs mt-1">{errors.availability}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Social Links (Optional)</label>
                    <div className="space-y-2 mt-1">
                        {socialLinks.map((link, index) => (
                            <div key={index} className="flex items-center space-x-2">
                                <input
                                    type="url"
                                    value={link}
                                    onChange={(e) => handleLinkChange(index, e.target.value)}
                                    placeholder="https://linkedin.com/in/your-profile"
                                    className="block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                                />
                                {socialLinks.length > 1 && (
                                     <button type="button" onClick={() => handleRemoveLink(index)} className="text-gray-400 hover:text-red-500" title="Remove link">
                                         <XCircleIcon className="h-6 w-6"/>
                                     </button>
                                )}
                            </div>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={handleAddLink}
                        className="mt-2 flex items-center text-sm font-medium text-brand-teal hover:text-brand-teal-dark"
                    >
                        <PlusCircleIcon className="h-5 w-5 mr-1" />
                        Add another link
                    </button>
                    {errors.socialLinks && <p className="text-red-500 text-xs mt-1">{errors.socialLinks}</p>}
                </div>
            </div>
          </div>
          <div className="pt-8 flex items-center justify-between">
             <button type="button" onClick={() => navigation.navigateTo(Page.Signup1)} className="text-sm font-medium text-brand-teal hover:text-brand-teal-dark">
                &larr; Back
              </button>
            <button 
              type="submit" 
              disabled={isLoading}
              className="group relative flex justify-center py-2 px-8 border border-transparent text-sm font-medium rounded-md text-white bg-brand-teal hover:bg-brand-teal-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-teal disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : 'Finish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignupStep2Page;
