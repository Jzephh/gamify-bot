import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { Membership } from '@/models/Membership';
import { getWhopSdk } from '@/lib/whop';
import { headers } from 'next/headers';

export async function GET() {
  try {
    await connectDB();
    
    const whopSdk = getWhopSdk();
    const { userId } = await whopSdk.verifyUserToken(await headers());
    const companyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID!;
    
    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    
    // Check if user is admin
    const adminUser = await User.findOne({ userId, companyId });
    if (!adminUser || !adminUser.roles?.includes('admin')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    // Get all users
    const users = await User.find({ companyId }).sort({ createdAt: -1 });

    // Resolve requestedMembership for each user if requestedMembershipId exists
    const populatedUsers = await Promise.all(users.map(async (u) => {
      let requestedMembership = null;
      if (u.requestedMembershipId) {
        try {
          const m = await Membership.findById(u.requestedMembershipId);
          if (m) {
            requestedMembership = {
              _id: m._id.toString(),
              name: m.name,
              duration: m.duration,
              cost: m.cost
            };
          }
        } catch {}
      }
      // Add requestedMembership to each user
      return {
        ...u.toObject(),
        requestedMembership,
      };
    }));

    return NextResponse.json(populatedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    
    const whopSdk = getWhopSdk();
    const { userId } = await whopSdk.verifyUserToken(await headers());
    const companyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID!;
    
    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    
    // Check if user is admin
    const adminUser = await User.findOne({ userId, companyId });
    if (!adminUser || !adminUser.roles?.includes('admin')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    const { userId: targetUserId, points } = await request.json();
    
    if (!targetUserId || points === undefined) {
      return NextResponse.json({ error: 'User ID and points are required' }, { status: 400 });
    }
    
    // Update user points
    const user = await User.findOneAndUpdate(
      { userId: targetUserId, companyId },
      { points },
      { new: true }
    );
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'User points updated successfully',
      user: {
        userId: user.userId,
        username: user.username,
        name: user.name,
        points: user.points
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
