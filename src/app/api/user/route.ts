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
    const companyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID!;
    
    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    
    let user = await User.findOne({ userId, companyId });
    
    // If no user found by userId/companyId, try multiple fallback methods
    if (!user) {
      try {
        const whopSdk = getWhopSdk();
        const userData = await whopSdk.users.getUser({ userId: userId as string });
        
        // Try to find existing user by username
        if (userData?.username) {
          user = await User.findOne({ username: userData.username, companyId });
          
          // If found, update the userId to match the current authentication
          if (user) {
            user.userId = userId;
            await user.save();
          }
        }
        
        // If still not found, try to find by username only (in case companyId is different)
        if (!user && userData?.username) {
          user = await User.findOne({ username: userData.username });
          
          // If found, update both userId and companyId
          if (user) {
            user.userId = userId;
            user.companyId = companyId;
            await user.save();
          }
        }
        
        // If still not found, try to find any user with the same username (last resort)
        if (!user && userData?.username) {
          const allUsers = await User.find({ username: userData.username });
          
          if (allUsers.length > 0) {
            user = allUsers[0]; // Take the first one
            user.userId = userId;
            user.companyId = companyId;
            await user.save();
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
      roles: user.roles,
      stats: user.stats,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
