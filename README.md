# Membership Dashboard

A Next.js dashboard for purchasing memberships using points earned in your Whop community.

## Features

- **User Authentication**: Integrates with Whop API to get user information
- **Points System**: Displays user's current points and earned free time
- **Membership Purchase**: Two membership options:
  - 7 Days Free (50 points)
  - 1 Month Free (150 points)
- **Real-time Updates**: Points are deducted immediately upon purchase
- **Responsive Design**: Built with Material-UI for a modern, mobile-friendly interface

## Tech Stack

- **Next.js 15** with TypeScript
- **Material-UI (MUI)** for UI components
- **MongoDB** for data storage
- **Whop API** for user authentication and data
- **Vercel** for deployment

## Environment Variables

Create a `.env.local` file with the following variables:

```env
WHOP_API_KEY=your_whop_api_key
NEXT_PUBLIC_WHOP_APP_ID=your_app_id
NEXT_PUBLIC_WHOP_AGENT_USER_ID=agent_user_id
NEXT_PUBLIC_WHOP_COMPANY_ID=company_id
MONGO_DB=your_database_name
MONGO_URI=your_mongodb_connection_string
```

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env.local`

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment on Vercel

1. Push your code to GitHub

2. Connect your repository to Vercel

3. Set up environment variables in Vercel dashboard:
   - `WHOP_API_KEY`
   - `NEXT_PUBLIC_WHOP_APP_ID`
   - `NEXT_PUBLIC_WHOP_AGENT_USER_ID`
   - `NEXT_PUBLIC_WHOP_COMPANY_ID`
   - `MONGO_DB`
   - `MONGO_URI`

4. Deploy!

## Usage

1. Users access the dashboard with their Whop user ID
2. The dashboard displays their current points and profile information
3. Users can purchase memberships using their points
4. Points are automatically deducted from their account
5. Success/error messages provide feedback

## API Endpoints

- `GET /api/user?userId={id}` - Get user information and points
- `POST /api/membership/purchase` - Purchase a membership with points

## Integration with Whop

This dashboard is designed to be integrated into your Whop community. Users can access it through a link in your community, and it will automatically authenticate them using the Whop API.

## Database Schema

The application uses the existing User model from your backend:

```typescript
interface IUser {
  userId: string;
  companyId: string;
  username: string;
  name: string;
  avatarUrl: string;
  points: number;
  freeTimeEarned: number;
  lastImageMessage: Date;
  roles: string[];
  stats: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
```