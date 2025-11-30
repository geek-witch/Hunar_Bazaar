# Hunar Bazaar Backend API

Backend API for Hunar Bazaar skill exchange platform with authentication, OTP verification, and password reset functionality.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the backend directory (use `.env.example` as a template):
```env
PORT=4000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/hunar-bazaar
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
FRONTEND_URL=http://localhost:3000
```

3. Start the server:
```bash
npm start
```

## Notes

- OTPs expire after 10 minutes
- Password reset tokens expire after 1 hour
- Passwords must be at least 8 characters and include uppercase, lowercase, and a number
- Users must be at least 10 years old to sign up
- Email verification is required before login

