import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
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
    
    // Define membership costs
    const membershipCosts = {
      '7days': 50,
      '1month': 150
    };
    
    const cost = membershipCosts[membershipType as keyof typeof membershipCosts];
    
    if (!cost) {
      return NextResponse.json({ error: 'Invalid membership type' }, { status: 400 });
    }
    
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
    let freeTimeEndDate: Date;
    
    if (membershipType === '7days') {
      freeTimeEndDate = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days from now
    } else if (membershipType === '1month') {
      freeTimeEndDate = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days from now
    } else {
      return NextResponse.json({ error: 'Invalid membership type' }, { status: 400 });
    }
    
    // Update user with new free time and deduct points
    user.points -= cost;
    user.freetimeStartDate = now;
    user.freetimeEndDate = freeTimeEndDate;
    await user.save();
    
    // Here you would typically integrate with Whop's membership system
    // For now, we'll just return success
    
    return NextResponse.json({
      success: true,
      message: `Successfully purchased ${membershipType} membership`,
      remainingPoints: user.points,
      membershipType,
      cost,
      freetimeStartDate: user.freetimeStartDate,
      freetimeEndDate: user.freetimeEndDate
    });
  } catch (error) {
    console.error('Error purchasing membership:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
