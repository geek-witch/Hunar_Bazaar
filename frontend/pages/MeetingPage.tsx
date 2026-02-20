"use client"

import React, { useState, useEffect, useRef } from 'react';
import type { Navigation } from '../App';
import { sessionApi } from '../utils/api';
import { generateJitsiUrl, shouldUseEmbedded, getEmbedTimeLimit } from '../utils/jitsiConfig';

interface MeetingPageProps {
  navigation: Navigation;
  sessionId: string;
}

interface MeetingDetails {
  meeting_room: string;
  session_id: string;
  teacher_name: string;
  participant_names: string[];
  skill: string;
  date: string;
  time: string;
  status: string;
  user_role: 'teacher' | 'learner' | 'participant';
  participant_count: number;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

const MeetingPage: React.FC<MeetingPageProps> = ({ navigation, sessionId }) => {
  const [meetingDetails, setMeetingDetails] = useState<MeetingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jitsiLoaded, setJitsiLoaded] = useState(false);
  const [useEmbedded] = useState(shouldUseEmbedded());
  const [timeLimit] = useState(getEmbedTimeLimit());
  const meetingRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);

  useEffect(() => {
    fetchMeetingDetails();

    if (useEmbedded) {
      loadJitsiScript();
    }

    return () => {
      // Cleanup if needed
      if (apiRef.current) {
        apiRef.current.dispose();
      }
    };
  }, [sessionId]);

  useEffect(() => {
    if (meetingDetails) {
      if (useEmbedded && jitsiLoaded && meetingRef.current) {
        initializeJitsi();
      } else if (!useEmbedded) {
        // Automatically redirect to Jitsi Meet for unlimited duration
        redirectToJitsiMeet();
      }
    }
  }, [meetingDetails, jitsiLoaded, useEmbedded]);

  const fetchMeetingDetails = async () => {
    try {
      setLoading(true);
      const response = await sessionApi.getMeetingDetails(sessionId);

      if (response.success && response.data) {
        setMeetingDetails(response.data);
      } else {
        setError(response.message || 'Failed to load meeting details');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load meeting details');
    } finally {
      setLoading(false);
    }
  };

  const loadJitsiScript = () => {
    // Check if script is already loaded
    if (window.JitsiMeetExternalAPI) {
      setJitsiLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;
    script.onload = () => setJitsiLoaded(true);
    script.onerror = () => setError('Failed to load Jitsi Meet');
    document.head.appendChild(script);
  };

  const initializeJitsi = () => {
    if (!meetingDetails || !window.JitsiMeetExternalAPI || !meetingRef.current) return;

    // Dispose existing API if any
    if (apiRef.current) {
      apiRef.current.dispose();
    }

    // Determine display name based on user role
    let displayName = '';
    if (meetingDetails.user_role === 'teacher') {
      displayName = meetingDetails.teacher_name;
    } else {
      // For participants, use their name from the current user context
      // Since we don't have current user name in this context, we'll use a generic name
      // This could be improved by passing user info from the parent component
      displayName = `Participant`;
    }

    const domain = 'meet.jit.si';
    const options = {
      roomName: meetingDetails.meeting_room,
      width: '100%',
      height: 600,
      parentNode: meetingRef.current,
      userInfo: {
        displayName: displayName,
      },
      configOverwrite: {
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        enableWelcomePage: false,
        prejoinPageEnabled: false,
      },
      interfaceConfigOverwrite: {
        TOOLBAR_BUTTONS: [
          'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
          'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
          'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
          'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
          'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
        ],
        SETTINGS_SECTIONS: ['devices', 'language', 'moderator', 'profile', 'calendar'],
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
      },
    };

    try {
      apiRef.current = new window.JitsiMeetExternalAPI(domain, options);

      // Handler for meeting end events
      const handleMeetingEnd = async () => {
        try {
          await markSessionCompleted();
        } catch (e) {
          // ignore
        }

        // Only redirect to feedback for learners/participants
        if (meetingDetails && meetingDetails.user_role !== 'teacher') {
          try {
            // This hash hint is for the account page to potentially show feedback
            window.location.hash = `#/account?openFeedbackSession=${meetingDetails.session_id}`;
            return;
          } catch (e) {
            // ignore fallback
          }
        }

        // Redirect back to schedule for everyone else
        navigation.setCurrentPage('Schedule Sessions');
      };

      // Add event listeners: call handleMeetingEnd when meeting closes or user leaves
      apiRef.current.addEventListeners({
        readyToClose: () => {
          handleMeetingEnd();
        },
        videoConferenceLeft: () => {
          handleMeetingEnd();
        },
        participantLeft: (participant: any) => {
          console.log('Participant left:', participant);
        },
        participantJoined: (participant: any) => {
          console.log('Participant joined:', participant);
        },
      });
    } catch (err) {
      console.error('Failed to initialize Jitsi:', err);
      setError('Failed to initialize meeting');
    }
  };

  const redirectToJitsiMeet = () => {
    if (!meetingDetails) return;

    // Determine display name based on user role
    let displayName = '';
    if (meetingDetails.user_role === 'teacher') {
      displayName = meetingDetails.teacher_name;
    } else {
      displayName = `Participant`;
    }

    // Generate Jitsi Meet URL using configuration
    const jitsiUrl = generateJitsiUrl(meetingDetails.meeting_room, displayName);

    // Open in same window to avoid popup blockers
    window.location.href = jitsiUrl;
  };

  const markSessionCompleted = async () => {
    try {
      // Call API to mark session as completed
      const response = await sessionApi.completeSession(sessionId);
      if (response.success) {
        console.log('Session marked as completed');
      }
    } catch (error) {
      console.error('Failed to mark session as completed:', error);
      // Don't show error to user as this is background operation
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-teal to-brand-teal-dark flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-xl text-center max-w-md w-full mx-4">
          <div className="text-6xl mb-4">⏳</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Loading Meeting...</h2>
          <p className="text-gray-600">Please wait while we prepare your session</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-teal to-brand-teal-dark flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-xl text-center max-w-md w-full mx-4">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">Meeting Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigation.setCurrentPage('Schedule Sessions')}
            className="bg-brand-teal text-white px-6 py-2 rounded-lg hover:bg-brand-teal-dark transition-colors"
          >
            Back to Sessions
          </button>
        </div>
      </div>
    );
  }

  if (!meetingDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-teal to-brand-teal-dark flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-xl text-center max-w-md w-full mx-4">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Session Not Found</h2>
          <p className="text-gray-600 mb-4">The requested session could not be found</p>
          <button
            onClick={() => navigation.setCurrentPage('Schedule Sessions')}
            className="bg-brand-teal text-white px-6 py-2 rounded-lg hover:bg-brand-teal-dark transition-colors"
          >
            Back to Sessions
          </button>
        </div>
      </div>
    );
  }

  // Redirect mode (no time limit)
  if (!useEmbedded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-teal to-brand-teal-dark flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-xl text-center max-w-md w-full mx-4">
          <div className="text-6xl mb-4">🚀</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Redirecting to Meeting...</h2>
          <p className="text-gray-600 mb-4">
            You're being redirected to Jitsi Meet for your {meetingDetails?.skill} session
          </p>
          <div className="mb-4">
            <div className="w-8 h-8 border-4 border-brand-teal border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            If you're not redirected automatically, click the button below:
          </p>
          <button
            onClick={redirectToJitsiMeet}
            className="bg-brand-teal text-white px-6 py-3 rounded-lg hover:bg-brand-teal-dark transition-colors font-medium"
          >
            Join Meeting Now
          </button>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => navigation.setCurrentPage('Schedule Sessions')}
              className="text-gray-500 hover:text-gray-700 transition-colors text-sm"
            >
              ← Back to Sessions
            </button>
          </div>
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 text-sm">
              ✅ <strong>No Time Limit:</strong> Your meeting will continue until you end it
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Embedded mode (with potential time limit warning)
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Time limit warning for embedded mode */}
      {timeLimit && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Note:</strong> Embedded meetings have a {timeLimit}-minute limit.
                For unlimited duration, consider using our redirect mode or self-hosted solution.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigation.setCurrentPage('Schedule Sessions')}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                ← Back to Sessions
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {meetingDetails?.skill} Session
                </h1>
                <p className="text-sm text-gray-500">
                  {meetingDetails?.user_role === 'teacher' ? 'Teaching' : 'Learning'} with{' '}
                  {meetingDetails?.user_role === 'teacher'
                    ? (meetingDetails?.participant_count > 1
                      ? `${meetingDetails.participant_count} students`
                      : meetingDetails?.participant_names?.[0] || 'students')
                    : meetingDetails?.teacher_name}
                </p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {meetingDetails && new Date(meetingDetails.date).toLocaleDateString()} at {meetingDetails?.time}
            </div>
          </div>
        </div>
      </div>

      {/* Meeting Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {!jitsiLoaded ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="text-4xl mb-4">🔄</div>
                <p className="text-gray-600">Loading meeting interface...</p>
              </div>
            </div>
          ) : (
            <div ref={meetingRef} className="w-full" style={{ minHeight: '600px' }} />
          )}
        </div>
      </div>

      {/* Meeting Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-500 mb-1">Skill</p>
              <p className="font-medium text-gray-900">{meetingDetails?.skill}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">
                {meetingDetails?.user_role === 'teacher' ? 'Participants' : 'Teacher'}
              </p>
              {meetingDetails?.user_role === 'teacher' ? (
                <div>
                  <p className="font-medium text-gray-900">
                    {meetingDetails?.participant_count > 1
                      ? `${meetingDetails.participant_count} students`
                      : meetingDetails?.participant_names?.[0] || 'No participants'}
                  </p>
                  {meetingDetails?.participant_count > 1 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {meetingDetails?.participant_names?.map((name, index) => (
                        <span
                          key={index}
                          className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="font-medium text-gray-900">{meetingDetails?.teacher_name}</p>
              )}
            </div>
            <div>
              <p className="text-gray-500 mb-1">Your Role</p>
              <p className="font-medium text-gray-900 capitalize">{meetingDetails?.user_role}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingPage;