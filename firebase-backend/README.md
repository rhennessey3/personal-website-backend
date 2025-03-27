# Firebase Backend for Personal Website

This repository contains the Firebase backend implementation for a personal website showcasing product management and UX strategy experience.

## Features

- Authentication for admin access
- Cloud Firestore database for storing structured data
- Firebase Storage for media files
- Cloud Functions for server-side logic
- Security rules for Firestore and Storage

## Project Structure

```
firebase-backend/
├── .github/workflows/      # CI/CD configuration
├── functions/              # Cloud Functions
├── firestore.rules         # Firestore security rules
├── storage.rules           # Storage security rules
├── firebase.json           # Firebase configuration
├── .firebaserc             # Firebase project settings
└── package.json            # Project dependencies
```

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Firebase CLI

### Installation

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

3. Install Firebase CLI globally:

```bash
npm install -g firebase-tools
```

4. Login to Firebase:

```bash
firebase login
```

5. Initialize the project with your Firebase project ID:

```bash
firebase use --add
```

### Local Development

Run Firebase emulators for local development:

```bash
npm run emulators
```

This will start the following emulators:
- Authentication: http://localhost:9099
- Firestore: http://localhost:8080
- Functions: http://localhost:5001
- Storage: http://localhost:9199
- Emulator UI: http://localhost:4000

### Deployment

Deploy all Firebase resources:

```bash
npm run deploy
```

Or deploy specific resources:

```bash
npm run deploy:functions
npm run deploy:firestore
npm run deploy:storage
```

## Database Schema

The Firestore database includes collections for:
- users (admin authentication)
- profile (personal information)
- work_experiences
- education
- skills
- case_studies
- case_study_sections
- case_study_metrics
- blog_posts
- tags
- contact_submissions

## Security

Access control is implemented through Firebase Authentication and security rules:
- Public read access for published content
- Admin-only write access for all content
- Form submission allowed for unauthenticated users

## License

This project is licensed under the ISC License.