import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { getWhopSdk } from '@/lib/whop';
import { headers } from 'next/headers';

export async function GET() {
  try {
    await connectDB();
    
    const whopSdk = getWhopSdk();
    const { userId } = await whopSdk.verifyUserToken(await headers());
    console.log('userId', userId);
    const companyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID!;
    
    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    
    let user = await User.findOne({ userId, companyId });
    
    if (!user) {
      // Create new user if doesn't exist
      const whopSdk = getWhopSdk();
        let userData: Record<string, unknown> = {};
      
      try {
        userData = await whopSdk.users.getUser({ userId: userId as string });
      } catch (error) {
        console.error('Error fetching user from Whop:', error);
        userData = {};
      }
      
        user = new User({
          userId,
          companyId,
          username: (userData as any)?.username || '',
          name: (userData as any)?.name || (userData as any)?.fullName || '',
          avatarUrl: (userData as any)?.profilePicture?.sourceUrl || (userData as any)?.profilePicUrl || (userData as any)?.avatarUrl || '',
          roles: (userData as any)?.roles || [],
          stats: (userData as any)?.stats || {},
          points: 0,
          freeTimeEarned: 0,
        });
      
      await user.save();
    }
    
    return NextResponse.json({
      userId: user.userId,
      username: user.username,
      name: user.name,
      avatarUrl: user.avatarUrl,
      points: user.points,
      freeTimeEarned: user.freeTimeEarned,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
