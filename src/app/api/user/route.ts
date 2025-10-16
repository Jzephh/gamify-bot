import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
// import { getWhopSdk } from '@/lib/whop';
// import { headers } from 'next/headers';

interface WhopUserData {
  username?: string;
  name?: string;
  fullName?: string;
  profilePicture?: {
    sourceUrl?: string;
  };
  profilePicUrl?: string;
  avatarUrl?: string;
  roles?: unknown[];
  stats?: Record<string, unknown>;
}

export async function GET() {
  try {
    await connectDB();
    
    // Log database connection info
    console.log('=== VERCEL DEPLOYMENT DEBUG ===');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('MONGO_URI (first 50 chars):', process.env.MONGO_URI?.substring(0, 50) + '...');
    
    // HARDCODED FOR TESTING - Remove this in production
    const userId = 'user_lT20gDxtbTkix';
    console.log('HARDCODED userId for testing:', userId);
    
    // Original code (commented out for testing):
    // const whopSdk = getWhopSdk();
    // const { userId } = await whopSdk.verifyUserToken(await headers());
    
    const companyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID!;
    console.log('companyId', companyId);
    
    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    
    // Debug: Show all users in database
    const allUsers = await User.find({});
    console.log('All users in database:', allUsers.map(u => ({ 
      _id: u._id, 
      userId: u.userId, 
      companyId: u.companyId, 
      username: u.username, 
      name: u.name, 
      points: u.points 
    })));
    
    let user = await User.findOne({ userId, companyId });
    console.log('Found user by userId/companyId:', user ? { userId: user.userId, companyId: user.companyId, points: user.points } : 'No user found');
    
    // If no user found by userId/companyId, try multiple fallback methods
    if (!user) {
      try {
        // For testing, use mock user data instead of Whop API
        const userData = {
          username: 'localgang',
          name: 'hobby',
          fullName: 'hobby',
          profilePicture: { sourceUrl: 'https://assets.whop.com/uploads/2025-10-15/user_18128674_74c24160-7286-4f79-9bc4-25bb8b7e0705.png' },
          profilePicUrl: 'https://assets.whop.com/uploads/2025-10-15/user_18128674_74c24160-7286-4f79-9bc4-25bb8b7e0705.png',
          avatarUrl: 'https://assets.whop.com/uploads/2025-10-15/user_18128674_74c24160-7286-4f79-9bc4-25bb8b7e0705.png',
          roles: [],
          stats: {}
        };
        console.log('MOCK user data for testing:', userData);
        
        // Original code (commented out for testing):
        // const whopSdk = getWhopSdk();
        // const userData = await whopSdk.users.getUser({ userId: userId as string });
        
        // Try to find existing user by username
        if (userData?.username) {
          user = await User.findOne({ username: userData.username, companyId });
          console.log('Found user by username:', user ? { username: user.username, points: user.points } : 'No user found by username');
          
          // If found, update the userId to match the current authentication
          if (user) {
            user.userId = userId;
            await user.save();
            console.log('Updated user userId to:', userId);
          }
        }
        
        // If still not found, try to find by username only (in case companyId is different)
        if (!user && userData?.username) {
          user = await User.findOne({ username: userData.username });
          console.log('Found user by username only:', user ? { username: user.username, points: user.points } : 'No user found by username only');
          
          // If found, update both userId and companyId
          if (user) {
            user.userId = userId;
            user.companyId = companyId;
            await user.save();
            console.log('Updated user userId and companyId');
          }
        }
        
        // If still not found, try to find any user with the same username (last resort)
        if (!user && userData?.username) {
          const allUsers = await User.find({ username: userData.username });
          console.log('All users with username:', allUsers.map(u => ({ username: u.username, userId: u.userId, companyId: u.companyId, points: u.points })));
          
          if (allUsers.length > 0) {
            user = allUsers[0]; // Take the first one
            user.userId = userId;
            user.companyId = companyId;
            await user.save();
            console.log('Updated first user with matching username');
          }
        }
      } catch (error) {
        console.error('Error fetching user from Whop:', error);
      }
    }
    
    if (!user) {
      // Create new user if doesn't exist
      // For testing, use mock user data
      const userData: WhopUserData = {
        username: 'localgang',
        name: 'hobby',
        fullName: 'hobby',
        profilePicture: { sourceUrl: 'https://assets.whop.com/uploads/2025-10-15/user_18128674_74c24160-7286-4f79-9bc4-25bb8b7e0705.png' },
        profilePicUrl: 'https://assets.whop.com/uploads/2025-10-15/user_18128674_74c24160-7286-4f79-9bc4-25bb8b7e0705.png',
        avatarUrl: 'https://assets.whop.com/uploads/2025-10-15/user_18128674_74c24160-7286-4f79-9bc4-25bb8b7e0705.png',
        roles: [],
        stats: {}
      };
      
      // Original code (commented out for testing):
      // const whopSdk = getWhopSdk();
      // try {
      //   userData = await whopSdk.users.getUser({ userId: userId as string });
      // } catch (error) {
      //   console.error('Error fetching user from Whop:', error);
      //   userData = {};
      // }
      
        user = new User({
          userId,
          companyId,
          username: userData?.username || '',
          name: userData?.name || userData?.fullName || '',
          avatarUrl: userData?.profilePicture?.sourceUrl || userData?.profilePicUrl || userData?.avatarUrl || '',
          roles: userData?.roles || [],
          stats: userData?.stats || {},
          points: 0,
          freetimeStartDate: null,
          freetimeEndDate: null,
        });
      
      await user.save();
    }
    
    const response = {
      userId: user.userId,
      username: user.username,
      name: user.name,
      avatarUrl: user.avatarUrl,
      points: user.points,
      freetimeStartDate: user.freetimeStartDate,
      freetimeEndDate: user.freetimeEndDate,
    };
    
    console.log('Final API response:', response);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
