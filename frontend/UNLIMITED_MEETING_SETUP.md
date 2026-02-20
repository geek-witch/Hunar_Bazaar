# Unlimited Duration Meeting Setup Guide

## Problem
The free `meet.jit.si` service has a 5-minute limitation when embedding meetings in external applications. This is their policy to encourage using paid services for production applications.

## Solutions Implemented

### 1. Direct Redirect (Recommended - No Time Limit) ✅
**Current Default Configuration**

Instead of embedding Jitsi Meet, we redirect users directly to the Jitsi Meet website. This removes the 5-minute limitation completely.

**How it works:**
- User clicks "Join Session"
- System validates session timing
- User is redirected to `https://meet.jit.si/room-name` with pre-configured settings
- Meeting continues indefinitely until participants leave

**Advantages:**
- ✅ No time limits
- ✅ Full Jitsi Meet features
- ✅ Better performance
- ✅ Mobile-friendly
- ✅ No additional setup required

**Configuration:**
```env
VITE_JITSI_CONFIG=free
```

### 2. Self-Hosted Jitsi Meet (Best for Production)
**For organizations wanting full control**

Deploy your own Jitsi Meet server to remove all limitations and add custom branding.

**Setup Steps:**
1. Deploy Jitsi Meet on your server (Docker recommended)
2. Configure domain and SSL certificates
3. Update environment variables:
```env
VITE_JITSI_CONFIG=selfHosted
VITE_JITSI_DOMAIN=your-jitsi-domain.com
```

**Advantages:**
- ✅ No time limits
- ✅ Full customization
- ✅ Your own branding
- ✅ Data privacy
- ✅ Can embed without restrictions

**Docker Setup Example:**
```bash
# Clone Jitsi Meet Docker setup
git clone https://github.com/jitsi/docker-jitsi-meet
cd docker-jitsi-meet

# Configure environment
cp env.example .env
# Edit .env with your domain and settings

# Start services
docker-compose up -d
```

### 3. Jitsi as a Service (JaaS) - Paid Option
**Professional hosted solution**

Use Jitsi's official paid service for production applications.

**Setup:**
1. Sign up at https://jaas.8x8.vc/
2. Get your tenant domain
3. Configure environment:
```env
VITE_JITSI_CONFIG=jaas
VITE_JAAS_DOMAIN=your-tenant.moderated.jitsi.net
```

**Advantages:**
- ✅ No time limits
- ✅ Professional support
- ✅ High availability
- ✅ Advanced features
- ✅ Can embed without restrictions

## Current Implementation

### Configuration System
The system automatically detects the configuration and adjusts behavior:

```typescript
// frontend/utils/jitsiConfig.ts
export const getCurrentJitsiConfig = (): JitsiConfig => {
  const configType = process.env.VITE_JITSI_CONFIG || 'free';
  
  switch (configType) {
    case 'selfHosted':
      return jitsiConfigs.selfHosted;
    case 'jaas':
      return jitsiConfigs.jaas;
    case 'free':
    default:
      return jitsiConfigs.free; // Uses redirect mode
  }
};
```

### Meeting Flow
1. **Session Creation**: Generates unique room name
2. **Time Validation**: Ensures session time has arrived
3. **Mode Detection**: Checks configuration for embed vs redirect
4. **Meeting Launch**: Either embeds or redirects based on config

## Switching Between Modes

### To Use Direct Redirect (Current Default)
```env
VITE_JITSI_CONFIG=free
```
- No time limits
- Redirects to meet.jit.si
- Best user experience

### To Use Self-Hosted
```env
VITE_JITSI_CONFIG=selfHosted
VITE_JITSI_DOMAIN=your-domain.com
```
- Requires your own Jitsi server
- Full control and customization

### To Use JaaS (Paid)
```env
VITE_JITSI_CONFIG=jaas
VITE_JAAS_DOMAIN=your-tenant.moderated.jitsi.net
```
- Professional hosted solution
- Requires JaaS subscription

## Testing the Solution

### Test Unlimited Duration
1. Create a test session
2. Join the session
3. Verify you're redirected to meet.jit.si
4. Confirm no 5-minute warning appears
5. Test that meeting continues beyond 5 minutes

### Test Different Configurations
1. Copy `.env.example` to `.env`
2. Modify `VITE_JITSI_CONFIG` value
3. Restart development server
4. Test meeting behavior changes

## Production Recommendations

### For Small Applications
- Use **Direct Redirect** mode (current default)
- Free and unlimited duration
- Good user experience

### For Professional Applications
- Use **Self-Hosted Jitsi Meet**
- Full control and branding
- Better privacy and security

### For Enterprise Applications
- Use **Jitsi as a Service (JaaS)**
- Professional support
- High availability guarantees

## Security Considerations

### Room Name Security
- Unique room names prevent unauthorized access
- Format: `session_{teacherId}_{studentId}_{timestamp}`
- Unpredictable and session-specific

### Access Control
- Backend validates user permissions
- Only session participants can get room details
- Time-based access control

### Data Privacy
- Self-hosted: Full control over data
- JaaS: Professional data handling
- Free redirect: Standard Jitsi privacy policy

## Troubleshooting

### Issue: Still seeing 5-minute warning
**Solution:** Ensure `VITE_JITSI_CONFIG=free` and restart dev server

### Issue: Redirect not working
**Solution:** Check browser popup blockers and JavaScript console

### Issue: Self-hosted domain not working
**Solution:** Verify SSL certificates and domain configuration

### Issue: JaaS authentication failing
**Solution:** Check tenant domain and API credentials

## Migration Path

### Current Users
- No action required
- System automatically uses redirect mode
- Existing sessions work without changes

### Future Upgrades
1. **Phase 1**: Current redirect implementation (✅ Done)
2. **Phase 2**: Self-hosted option for organizations
3. **Phase 3**: JaaS integration for enterprise users
4. **Phase 4**: Mobile app with native Jitsi SDK

## Cost Analysis

### Free Redirect Mode
- **Cost**: $0
- **Limitations**: None for basic use
- **Best for**: Small to medium applications

### Self-Hosted
- **Cost**: Server hosting (~$20-100/month)
- **Limitations**: Requires technical setup
- **Best for**: Organizations wanting control

### JaaS
- **Cost**: Pay per usage (~$0.05-0.15 per participant minute)
- **Limitations**: Ongoing costs
- **Best for**: Professional applications

## Conclusion

The implemented solution provides unlimited duration meetings by default using the redirect approach. This eliminates the 5-minute limitation while maintaining a great user experience. Organizations can easily upgrade to self-hosted or JaaS solutions as needed.

The system is designed to be flexible and can accommodate different deployment scenarios without code changes - just environment configuration updates.