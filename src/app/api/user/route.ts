import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { getWhopSdk } from '@/lib/whop';
import { headers } from 'next/headers';

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
    
    const whopSdk = getWhopSdk();
    const { userId } = await whopSdk.verifyUserToken(await headers());
    console.log('userId', userId);
    const companyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID!;
    console.log('companyId', companyId);
    
    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    
    let user = await User.findOne({ userId, companyId });
    console.log('Found user:', user ? { userId: user.userId, companyId: user.companyId, points: user.points } : 'No user found');
    
    // If no user found by userId/companyId, try to find by username from Whop data
    if (!user) {
      try {
        const whopSdk = getWhopSdk();
        const userData = await whopSdk.users.getUser({ userId: userId as string });
        console.log('Whop user data:', userData);
        
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
      } catch (error) {
        console.error('Error fetching user from Whop:', error);
      }
    }
    
    if (!user) {
      // Create new user if doesn't exist
      const whopSdk = getWhopSdk();
        let userData: WhopUserData = {};
      
      try {
        userData = await whopSdk.users.getUser({ userId: userId as string });
      } catch (error) {
        console.error('Error fetching user from Whop:', error);
        userData = {};
      }
      
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
    
    return NextResponse.json({
      userId: user.userId,
      username: user.username,
      name: user.name,
      avatarUrl: user.avatarUrl,
      points: user.points,
      freetimeStartDate: user.freetimeStartDate,
      freetimeEndDate: user.freetimeEndDate,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
