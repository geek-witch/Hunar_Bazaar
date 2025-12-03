# Testing Guide for Hunar Bazaar Backend API

## Prerequisites

1. **Install Dependencies**
   cd backend
   npm install
  

2. **Set up Environment Variables**
   Create a `.env` file in the `backend` directory:
   ```env
   PORT=4000
   NODE_ENV=development
   MONGO_URI=mongodb://localhost:27017/hunar-bazaar
   JWT_SECRET=test-secret-key-change-in-production
   JWT_EXPIRES_IN=7d
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   FRONTEND_URL=http://localhost:3000
   ```

3. **Start MongoDB**
   Make sure MongoDB is running on your system.

4. **Start the Server**
   ```bash
   npm start
   ```
   You should see: `Server running on port 4000`


## API Endpoint Tests

### 1. Health Check
**GET** `http://localhost:4000/api/health`


**Expected Response:**
```json
{
  "success": true,
  "message": "Server is running"
}
```

---

### 2. Signup (Step 1)
**POST** `http://localhost:4000/api/auth/signup`

**Body (JSON):**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "dob": "1995-05-15",
  "email": "john.doe@example.com",
  "password": "Password123"
}

**Expected Response:**
```json
{
  "success": true,
  "message": "User created successfully. OTP sent to email.",
  "data": {
    "userId": "...",
    "email": "john.doe@example.com",
    "name": "John Doe"
  }
}
```

**Save the `userId` for the next step!**

---

### 3. Complete Profile (Step 2)
**POST** `http://localhost:4000/api/auth/complete-profile`

**Body (JSON):**
```json
{
  "userId": "69189778b44665ad7c910c02",
  "firstName": "John",
  "lastName": "Doe",
  "dob": "1995-05-15",
  "bio": "I am a software developer with 5 years of experience in web development. I love teaching and learning new technologies.",
  "teachSkills": ["JavaScript", "React", "Node.js"],
  "learnSkills": ["Python", "Machine Learning"],
  "availability": "Weekends and weekdays after 5 PM",
  "socialLinks": ["https://linkedin.com/in/johndoe"],
  "profilePic": null
}
```

---

### 4. Verify OTP
**POST** `http://localhost:4000/api/auth/verify-otp`

**Body (JSON):**
```json
{
  "email": "john.doe@example.com",
  "code": "123456"
}
```

**Note:** Check your email for the OTP code, or check the MongoDB `otps` collection.

**Expected Response:**
```json
{
  "success": true,
  "message": "Account verified successfully",
  "data": {
    "token": "JWT_TOKEN_HERE",
    "user": {
      "id": "...",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "isVerified": true
    }
  }
}
```

eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTE4OTc3OGI0NDY2NWFkN2M5MTBjMDIiLCJpYXQiOjE3NjMyMTk1NTQsImV4cCI6MTc2MzIyMzE1NH0.MF8jgcyLQ_5hFaLPqJf7OvDuk1msAvZ0elr_RAxXnBQ

---

### 5. Resend OTP
**POST** `http://localhost:4000/api/auth/resend-otp`

**Body (JSON):**
```json
{
  "email": "john.doe@example.com"
}
```

---

### 6. Login
**POST** `http://localhost:4000/api/auth/login`

**Body (JSON):**
```json
{
  "email": "john.doe@example.com",
  "password": "Password123"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "JWT_TOKEN_HERE",
    "user": {
      "id": "...",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "isVerified": true
    }
  }
}
```

### 7. Get Current User (Protected Route)
**GET** `http://localhost:4000/api/auth/me`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```
---

### 8. Forgot Password
**POST** `http://localhost:4000/api/auth/forgot-password`

**Body (JSON):**
```json
{
  "email": "john.doe@example.com"
}
```

**Note:** Check your email for the reset link, or check MongoDB `passwordresets` collection for the token.

---

### 9. Reset Password
**POST** `http://localhost:4000/api/auth/reset-password`

**Body (JSON):**
```json
{
  "token": "RESET_TOKEN_FROM_EMAIL",
  "newPassword": "NewPassword123"
}
```
