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
    
    // Set membership status to pending (admin approval required)
    user.points -= cost;
    user.membershipStatus = 'pending';
    user.membershipRequestDate = new Date();
    user.requestedMembershipId = membership._id;
    // Don't set freetimeStartDate/freetimeEndDate until approved
    await user.save();
    
    // Here you would typically integrate with Whop's membership system
    // For now, we'll just return success
    
    return NextResponse.json({
      success: true,
      message: `Membership request submitted for approval. You will be notified when approved.`,
      remainingPoints: user.points,
      membershipType: membership.name,
      cost,
      membershipStatus: user.membershipStatus
    });
  } catch (error) {
    console.error('Error purchasing membership:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
