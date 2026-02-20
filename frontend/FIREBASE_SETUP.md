## Firebase messaging setup (1:1 friend chat)

### 1) Create Firebase project + enable Auth + Firestore

- Enable **Authentication**: Sign-in method doesn’t matter for users because we use **Custom Tokens**.
- Create **Firestore Database** (production mode recommended).

### 2) Frontend env vars

Set these in your local `frontend/.env`:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

Your existing API env remains:

- `VITE_API_BASE_URL` (defaults to `http://localhost:4000/api/auth` in code)

### 3) Backend env vars (for Custom Token minting)

The backend now exposes:

- `GET /api/auth/firebase-token` (requires your existing JWT `Authorization: Bearer <token>`)

Configure Firebase Admin by setting **one** of:

- `FIREBASE_SERVICE_ACCOUNT_JSON` (JSON string of the service account)
- `FIREBASE_SERVICE_ACCOUNT_PATH` (absolute or relative path to the JSON file)

### 4) Firestore data model

- `conversations/{conversationId}`
  - `participants: [userIdA, userIdB]` (sorted)
  - `updatedAt`, `lastMessageText`, `lastMessageAt`, `lastMessageSenderId`
- `conversations/{conversationId}/messages/{messageId}`
  - `text`, `senderId`, `createdAt`

Conversation id is deterministic: `"{minUserId}_{maxUserId}"`.

### 5) Firestore security rules (friends-only)

Friendships are now mirrored to Firestore when friend requests are accepted/removed:
- `friendships/{userId}/friends/{friendId}` - indicates userId and friendId are friends

**IMPORTANT:** Before using the secure rules below, you must:
1. Run the migration: `cd backend && node utils/migrateFriendships.js`
2. OR accept a new friend request (friendships are auto-mirrored)

**Temporary testing rules** (use these first to verify messaging works, then switch to secure rules):

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null;
    }

    // Bidirectional friendship check
    function areFriends(uid1, uid2) {
      return
        get(/databases/$(database)/documents/friendships/$(uid1)/friends/$(uid2)) != null
        &&
        get(/databases/$(database)/documents/friendships/$(uid2)/friends/$(uid1)) != null;
    }

    // Get the other participant (2-person only)
    function otherParticipant(participants) {
      return participants[0] == request.auth.uid
        ? participants[1]
        : participants[0];
    }

    // Final access check (NO if statements)
    function canAccessConversation(participants) {
      return
        isSignedIn()
        &&
        participants is list
        &&
        participants.size() == 2
        &&
        request.auth.uid in participants
        &&
        areFriends(
          request.auth.uid,
          otherParticipant(participants)
        );
    }

    match /conversations/{cid} {
      // Read: Allow if user is participant (friendship verified on create)
      // This makes collection queries efficient (no expensive get() calls)
      allow read: if isSignedIn() 
        && resource.data.participants is list
        && request.auth.uid in resource.data.participants;

      allow create: if
        isSignedIn()
        &&
        request.resource.data.participants is list
        &&
        request.resource.data.participants.size() == 2
        &&
        request.auth.uid in request.resource.data.participants
        &&
        areFriends(
          request.resource.data.participants[0],
          request.resource.data.participants[1]
        );

      allow update: if canAccessConversation(resource.data.participants);

      match /messages/{mid} {
        function parentConversation() {
          return get(/databases/$(database)/documents/conversations/$(cid));
        }

        // Read messages if user is participant (friendship already verified when conversation was created)
        allow read: if isSignedIn() 
          && request.auth.uid in parentConversation().data.participants;

        // Create message if user is sender and participant
        allow create: if isSignedIn()
          && request.resource.data.senderId == request.auth.uid
          && request.auth.uid in parentConversation().data.participants;
      }
    }

    match /friendships/{userId}/friends/{friendId} {
      // Allow users to read their own friendships
      // Also allow reading if you're checking friendship with that user (for areFriends() function)
      allow read: if isSignedIn() 
        && (request.auth.uid == userId || request.auth.uid == friendId);
      // Only backend can write friendships (via Admin SDK)
      allow write: if false;
    }
  }
}

### 6) Migrate existing friendships

If you have existing friendships in MongoDB, sync them to Firestore:

```bash
cd backend
node utils/migrateFriendships.js
```

This will create `friendships/{userId}/friends/{friendId}` documents for all existing friendships.

**Note:** New friendships are automatically mirrored when friend requests are accepted. This migration is only needed for existing data.

### 7) Index

The Messenger page uses a query:

- `conversations` where `participants` **array-contains** `me`
- ordered by `updatedAt desc`

Firestore may prompt you to create an index for this in the console.

