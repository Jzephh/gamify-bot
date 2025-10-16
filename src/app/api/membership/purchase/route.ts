import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { Membership } from '@/models/Membership';
import { getWhopSdk } from '@/lib/whop';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const whopSdk = getWhopSdk();
    const { userId } = await whopSdk.verifyUserToken(await headers());
    const { membershipType } = await request.json();
    const companyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID!;
    
    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    
    if (!membershipType) {
      return NextResponse.json({ error: 'Membership type is required' }, { status: 400 });
    }
    
    // Find the membership in database
    const membership = await Membership.findOne({ 
      _id: membershipType, 
      companyId, 
      isActive: true 
    });
    
    if (!membership) {
      return NextResponse.json({ error: 'Membership not found or inactive' }, { status: 404 });
    }
    
    const cost = membership.cost;
    
    // Find user
    const user = await User.findOne({ userId, companyId });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Check if user has enough points
    if (user.points < cost) {
      return NextResponse.json({ 
        error: 'Insufficient points', 
        currentPoints: user.points,
        requiredPoints: cost 
      }, { status: 400 });
    }
    
    // Calculate free time dates
    const now = new Date();
    const freeTimeEndDate = new Date(now.getTime() + (membership.duration * 24 * 60 * 60 * 1000));
    
    // Update user with new free time and deduct points
    user.points -= cost;
    user.freetimeStartDate = now;
    user.freetimeEndDate = freeTimeEndDate;
    await user.save();
    
    // Here you would typically integrate with Whop's membership system
    // For now, we'll just return success
    
    return NextResponse.json({
      success: true,
      message: `Successfully purchased ${membership.name} membership`,
      remainingPoints: user.points,
      membershipType: membership.name,
      cost,
      freetimeStartDate: user.freetimeStartDate,
      freetimeEndDate: user.freetimeEndDate
    });
  } catch (error) {
    console.error('Error purchasing membership:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
