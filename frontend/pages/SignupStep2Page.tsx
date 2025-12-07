import React, { useState, useRef, useEffect } from 'react';
import { Page, Navigation } from '../App';
import { UploadIcon, PlusCircleIcon, XCircleIcon } from '../components/icons/MiscIcons';
import { authApi } from '../utils/api';

type AvailabilitySlot = {
  id: number; // Unique identifier for time slot
  startTime: string; // e.g., "09:00"
  endTime: string;   // e.g., "17:00"
  days: string[];    // e.g., ["Monday", "Wednesday"]
};

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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

    // Simple time string comparison (HH:MM format)
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
      { ...newSlot, id: Date.now() + Math.random() }, // Assign a unique ID
    ]);
    
    // Reset the input fields, but keep days selected for potential quick add
    setNewSlot(prev => ({ ...prev, startTime: '', endTime: '' }));
  };

  const handleRemoveSlot = (id: number) => {
    setAvailability(prevAvail => prevAvail.filter(slot => slot.id !== id));
  };
  
  const formatTime = (time: string): string => {
    if (!time) return '';
    try {
      // Assuming time is in "HH:MM" 24-hour format
      const [hours, minutes] = time.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
    } catch {
      return time; // Return original if parsing fails
    }
  };

  return (
    <div className="space-y-4">
      <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
        <h3 className="font-semibold text-gray-800 mb-2">Add Availability Slot</h3>
        
        {/* Day Selector */}
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Day(s)</label>
        <div className="flex flex-wrap gap-2 mb-4">
          {DAYS_OF_WEEK.map(day => (
            <button
              key={day}
              type="button"
              onClick={() => handleDayToggle(day)}
              className={`px-3 py-1 text-xs rounded-full transition duration-150 border ${
                newSlot.days.includes(day) 
                  ? 'bg-brand-teal text-white border-brand-teal hover:bg-brand-teal-dark' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
        
        {/* Time Selector */}
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

      {/* Display Existing Slots */}
      {availability.length > 0 && (
        <div className="border border-gray-200 rounded-lg p-3 space-y-3 max-h-52 overflow-y-auto">
          <p className="text-sm font-medium text-gray-700">Your Current Availability:</p>
          {availability.map(slot => (
            <div 
              key={slot.id} 
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
                <XCircleIcon className="h-6 w-6"/>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const SignupStep2Page: React.FC<{ navigation: Navigation }> = ({ navigation }) => {
  const [teachSkills, setTeachSkills] = useState<string[]>([]);
  const [learnSkills, setLearnSkills] = useState<string[]>([]);
 const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [bio, setBio] = useState<string>('');
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [socialLinks, setSocialLinks] = useState<string[]>(['']);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [skillsList, setSkillsList] = useState<string[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(true);
  const [availabilityError, setAvailabilityError] = useState(''); 

  const [errors, setErrors] = useState({
      teachSkills: '', 
      learnSkills: '',
      availability: '',
      bio: '',
      profilePic: '',
      socialLinks: '',
  });

  useEffect(() => {
    const userId = localStorage.getItem('signupUserId');
    if (!userId) {
      navigation.navigateTo(Page.Signup1);
    }
  }, [navigation]);

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
          console.log('Cleaned skills:', cleanedSkills);
          console.log('Cleaned skills count:', cleanedSkills.length);
          setSkillsList(cleanedSkills);
        } else {
          console.error('Failed to fetch skills - Response:', response);
          console.error('Success:', response.success, 'Data type:', typeof response.data, 'Is array:', Array.isArray(response.data));
          console.error('No skills found in response');
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
    const newErrors = { 
        teachSkills: '', 
        learnSkills: '', 
        availability: availabilityError, // Start with any error from the selector
        bio: '', 
        profilePic: '', 
        socialLinks: '' 
    };
    let isValid = true;
    
     if (bio.trim().length < 20 || bio.trim().length > 500) {
      newErrors.bio = 'Bio must be between 20 and 500 characters.';
      isValid = false;
    }
    
    // --- Updated availability validation ---
    if (availability.length === 0) {
        newErrors.availability = 'Please add at least one time slot for your availability.';
        isValid = false;
    } else if (availabilityError) {
        // If there is an error reported by the selector component (e.g., incomplete slot being added)
        isValid = false;
    }
    // --------------------------------------
    
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
      const file = e.target.files[0];
      const maxSize = 10 * 1024 * 1024; 
      
      if (file.size > maxSize) {
        setErrors(prev => ({ ...prev, profilePic: 'File size exceeds 10MB limit. Please choose a smaller image.' }));
        setProfilePic(null);
        e.target.value = '';
        return;
      }
      
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, profilePic: 'Invalid file type. Please upload PNG, JPG, or GIF only.' }));
        setProfilePic(null);
        e.target.value = '';
        return;
      }
      
      setErrors(prev => ({ ...prev, profilePic: '' }));
      setProfilePic(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    
    if (isSubmitting) {
      return; // Prevent double submission
    }
    
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
    setIsSubmitting(true);
    try {
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
      
       const formattedAvailability = availability
        .map(slot => 
          `${slot.startTime}-${slot.endTime} on ${slot.days.join(', ')}`
        )
        .join('; ');

      const response = await authApi.completeProfile({
        userId,
        firstName: signupData.firstName,
        lastName: signupData.lastName,
        dob: signupData.dob,
        bio,
        teachSkills,
        learnSkills,
        availability: availability, 
        socialLinks: validSocialLinks.length > 0 ? validSocialLinks : undefined,
        profilePic: profilePicBase64,
      });

      if (response.success) {
        navigation.navigateTo(Page.Verify);
      } else {
        setGeneralError(response.message || 'Failed to complete profile. Please try again.');
      }
    } catch (error: any) {
      console.error('Profile completion error:', error);
      setGeneralError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
      setIsSubmitting(false);
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
                  {skillsLoading ? (
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                      Loading skills...
                    </div>
                  ) : skillsList.length === 0 ? (
                    <div className="w-full px-3 py-2 border border-red-300 rounded-md bg-red-50 text-red-600 text-sm">
                      No skills available. Please check your connection or contact support.
                    </div>
                  ) : (
                    <MultiSelectDropdown
                      options={skillsList}
                      selectedOptions={teachSkills}
                      setSelectedOptions={setTeachSkills}
                      placeholder="e.g., Python, Graphic Design"
                    />
                  )}
                  {errors.teachSkills && <p className="text-red-500 text-xs mt-1">{errors.teachSkills}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Skills you want to Learn</label>
                  {skillsLoading ? (
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                      Loading skills...
                    </div>
                  ) : skillsList.length === 0 ? (
                    <div className="w-full px-3 py-2 border border-red-300 rounded-md bg-red-50 text-red-600 text-sm">
                      No skills available. Please check your connection or contact support.
                    </div>
                  ) : (
                    <MultiSelectDropdown
                      options={skillsList}
                      selectedOptions={learnSkills}
                      setSelectedOptions={setLearnSkills}
                      placeholder="e.g., Spanish, Public Speaking"
                    />
                  )}
                  {errors.learnSkills && <p className="text-red-500 text-xs mt-1">{errors.learnSkills}</p>}
                </div>
                
                {/* --- Replaced Availability Field with Time Range Selector --- */}
                 <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Availability Time Slots</label>
                  <AvailabilitySelector 
                    availability={availability} 
                    setAvailability={setAvailability}
                    setError={setAvailabilityError}
                  />
                  {(errors.availability || availabilityError) && <p className="text-red-500 text-xs mt-1">{errors.availability || availabilityError}</p>}
                </div>
                {/* --------------------------------------------------------- */}
                
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
              disabled={isLoading || isSubmitting}
              className="group relative flex justify-center py-2 px-8 border border-transparent text-sm font-medium rounded-md text-white bg-brand-teal hover:bg-brand-teal-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-teal disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading || isSubmitting ? 'Saving...' : 'Finish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignupStep2Page;