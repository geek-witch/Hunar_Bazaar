// Jitsi Meet Configuration
export interface JitsiConfig {
  domain: string;
  useEmbedded: boolean;
  embedTimeLimit?: number; // in minutes, only for meet.jit.si
}

// Configuration options for different environments
export const jitsiConfigs = {
  // Free Jitsi Meet (5-minute limit for embedded)
  free: {
    domain: 'meet.jit.si',
    useEmbedded: false, // Set to false to avoid 5-minute limit
    embedTimeLimit: 5
  },
  
  // Self-hosted Jitsi Meet (no limits)
  selfHosted: {
    domain: process.env.VITE_JITSI_DOMAIN || 'your-jitsi-domain.com',
    useEmbedded: true,
    embedTimeLimit: undefined
  },
  
  // Jitsi as a Service (JaaS) - paid service, no limits
  jaas: {
    domain: process.env.VITE_JAAS_DOMAIN || 'your-tenant.moderated.jitsi.net',
    useEmbedded: true,
    embedTimeLimit: undefined
  }
};

// Get current configuration based on environment
export const getCurrentJitsiConfig = (): JitsiConfig => {
  const configType = process.env.VITE_JITSI_CONFIG || 'free';
  
  switch (configType) {
    case 'selfHosted':
      return jitsiConfigs.selfHosted;
    case 'jaas':
      return jitsiConfigs.jaas;
    case 'free':
    default:
      return jitsiConfigs.free;
  }
};

// Generate Jitsi Meet URL with parameters
export const generateJitsiUrl = (
  roomName: string, 
  displayName: string, 
  config: JitsiConfig = getCurrentJitsiConfig()
): string => {
  const baseUrl = `https://${config.domain}/${roomName}`;
  const params = new URLSearchParams({
    'userInfo.displayName': displayName,
    'config.startWithAudioMuted': 'false',
    'config.startWithVideoMuted': 'false',
    'config.prejoinPageEnabled': 'false',
    'config.enableWelcomePage': 'false'
  });
  
  return `${baseUrl}#${params.toString()}`;
};

// Check if embedding should be used
export const shouldUseEmbedded = (): boolean => {
  const config = getCurrentJitsiConfig();
  return config.useEmbedded;
};

// Get embed time limit warning
export const getEmbedTimeLimit = (): number | undefined => {
  const config = getCurrentJitsiConfig();
  return config.embedTimeLimit;
};