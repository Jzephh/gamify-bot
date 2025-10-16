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
    const { userId: adminUserId } = await whopSdk.verifyUserToken(await headers());
    const companyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID!;
    
    if (!adminUserId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    
    // Check if user is admin
    const adminUser = await User.findOne({ userId: adminUserId, companyId });
    if (!adminUser || !adminUser.roles?.includes('admin')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    const { userId, action } = await request.json();
    
    if (!userId || !action) {
      return NextResponse.json({ error: 'User ID and action are required' }, { status: 400 });
    }
    
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be approve or reject' }, { status: 400 });
    }
    
    // Find the target user
    const user = await User.findOne({ userId, companyId });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    if (user.membershipStatus !== 'pending') {
      return NextResponse.json({ error: 'User does not have a pending membership request' }, { status: 400 });
    }
    
    if (action === 'approve') {
      // Find the membership that was requested
      let membership = null;
      if (user.requestedMembershipId) {
        membership = await Membership.findOne({ 
          _id: user.requestedMembershipId, 
          companyId, 
          isActive: true 
        });
      }
      
      const now = new Date();
      let freeTimeEndDate;
      
      if (membership) {
        // Use the actual membership duration
        freeTimeEndDate = new Date(now.getTime() + (membership.duration * 24 * 60 * 60 * 1000));
      } else {
        // Fallback to 7 days if membership not found
        freeTimeEndDate = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
      }
      
      // Update user with approved membership
      user.membershipStatus = 'approved';
      user.freetimeStartDate = now;
      user.freetimeEndDate = freeTimeEndDate;
    } else {
      // Reject the membership request
      user.membershipStatus = 'rejected';
    }
    
    await user.save();
    
    return NextResponse.json({
      success: true,
      message: `Membership request ${action}d successfully`,
      user: {
        userId: user.userId,
        username: user.username,
        name: user.name,
        membershipStatus: user.membershipStatus,
        freetimeStartDate: user.freetimeStartDate,
        freetimeEndDate: user.freetimeEndDate
      }
    });
  } catch (error) {
    console.error('Error processing membership request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
