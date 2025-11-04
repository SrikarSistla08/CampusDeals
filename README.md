# CampusDeals - Student Deals & Local Discovery Platform

A SaaS platform connecting local Arbutus businesses with UMBC students through exclusive deals and discounts.

## Features

### For Students

- **UMBC Email Verification**: Only verified UMBC students can access deals
- **Deal Discovery**: Browse deals by category (Food, Retail, Services, Entertainment, Health)
- **Business Directory**: Discover local businesses in Arbutus
- **Deal Details**: View detailed information about each deal including terms and conditions

### For Businesses

- **Business Dashboard**: Manage your profile and track deal performance
- **Deal Management**: Create, edit, and manage your deals
- **Analytics**: Track views and engagement for your deals
- **Business Profile**: Showcase your business to UMBC students

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Firebase** - Authentication, Firestore database, and Storage
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **date-fns** - Date formatting

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase project (Firebase Authentication and Firestore enabled)

### Installation

1. Clone the repository:

```bash
git clone <your-repo-url>
cd Saas
```

2. Install dependencies:

```bash
npm install
```

3. Set up Firebase:

   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - **Enable Authentication (Email/Password)** - This is critical!
     - Go to Authentication > Get started (if first time)
     - Click on "Sign-in method" tab
     - Click on "Email/Password"
     - Toggle "Enable" to ON
     - Click "Save"
   - Create a Firestore database
   - Get your Firebase configuration
4. Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

5. Fill in your Firebase configuration in `.env.local`:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

6. Set up Firestore Security Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  
    // Businesses can read/write their own business
    match /businesses/{businessId} {
      allow read: if true;
      allow write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
  
    // Deals are readable by all, writable by business owners
    match /deals/{dealId} {
      allow read: if true;
      allow write: if request.auth != null && 
        exists(/databases/$(database)/documents/businesses/$(resource.data.businessId)) &&
        get(/databases/$(database)/documents/businesses/$(resource.data.businessId)).data.userId == request.auth.uid;
    }
  
    // Reviews are readable by all, writable by authenticated users
    match /reviews/{reviewId} {
      allow read: if true;
      allow write: if request.auth != null && 
        request.resource.data.userId == request.auth.uid;
    }
  }
}
```

7. **IMPORTANT**: Make sure Email/Password authentication is enabled in Firebase Console:

   - Go to Firebase Console > Authentication > Sign-in method
   - Enable "Email/Password" provider
   - Save the changes
   - If you see "auth/configuration-not-found" error, this is the fix!
8. Run the development server:

```bash
npm run dev
```

9. Open [http://localhost:3000](http://localhost:3000) in your browser

## Troubleshooting

### Error: "auth/configuration-not-found"

This means Email/Password authentication is not enabled in Firebase. Fix it:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Authentication** > **Sign-in method**
4. Click on **Email/Password**
5. Toggle **Enable** to ON
6. Click **Save**
7. Restart your dev server

For more details, see [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)

## Project Structure

```
├── app/
│   ├── auth/              # Authentication pages
│   ├── business/          # Business dashboard and management
│   ├── deals/             # Deal discovery and details
│   ├── businesses/        # Business directory
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing page
├── components/
│   ├── layout/            # Layout components (Navbar, etc.)
│   └── providers/         # Context providers (AuthProvider)
├── lib/
│   └── firebase/          # Firebase configuration and utilities
├── types/
│   └── index.ts           # TypeScript type definitions
└── public/                # Static assets
```

## Usage

### For Students

1. Sign up with your UMBC email address (`@umbc.edu`)
2. Browse deals by category
3. View deal details and save money!

### For Businesses

1. Sign up as a business
2. Complete your business profile setup
3. Create deals and start attracting UMBC students
4. Track performance in your dashboard

## Future Enhancements

- QR code redemption system
- Push notifications for new deals
- Student reviews and ratings
- Advanced analytics for businesses
- Mobile app
- Email marketing tools
- Payment integration for premium listings

## License

MIT
