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
    
    // Get all memberships for the company
    const memberships = await Membership.find({ companyId }).sort({ createdAt: -1 });
    
    return NextResponse.json(memberships);
  } catch (error) {
    console.error('Error fetching memberships:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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
    
    const { targetUserId, membershipId } = await request.json();
    
    if (!targetUserId || !membershipId) {
      return NextResponse.json({ error: 'Target user ID and membership ID are required' }, { status: 400 });
    }
    
    // Find the membership
    const membership = await Membership.findOne({ _id: membershipId, companyId, isActive: true });
    if (!membership) {
      return NextResponse.json({ error: 'Membership not found or inactive' }, { status: 404 });
    }
    
    // Find the target user
    const user = await User.findOne({ userId: targetUserId, companyId });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Calculate free time dates
    const now = new Date();
    const freeTimeEndDate = new Date(now.getTime() + (membership.duration * 24 * 60 * 60 * 1000));
    
    // Update user with free time
    user.freetimeStartDate = now;
    user.freetimeEndDate = freeTimeEndDate;
    await user.save();
    
    return NextResponse.json({
      success: true,
      message: `Free time membership granted successfully`,
      user: {
        userId: user.userId,
        username: user.username,
        name: user.name,
        freetimeStartDate: user.freetimeStartDate,
        freetimeEndDate: user.freetimeEndDate
      }
    });
  } catch (error) {
    console.error('Error granting membership:', error);
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
    
    const { membershipId, name, description, duration, cost, isActive } = await request.json();
    
    if (!membershipId) {
      return NextResponse.json({ error: 'Membership ID is required' }, { status: 400 });
    }
    
    // Update membership
    const membership = await Membership.findOneAndUpdate(
      { _id: membershipId, companyId },
      { name, description, duration, cost, isActive },
      { new: true }
    );
    
    if (!membership) {
      return NextResponse.json({ error: 'Membership not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Membership updated successfully',
      membership
    });
  } catch (error) {
    console.error('Error updating membership:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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
    
    const { searchParams } = new URL(request.url);
    const membershipId = searchParams.get('id');
    
    if (!membershipId) {
      return NextResponse.json({ error: 'Membership ID is required' }, { status: 400 });
    }
    
    // Delete membership
    const membership = await Membership.findOneAndDelete({ _id: membershipId, companyId });
    
    if (!membership) {
      return NextResponse.json({ error: 'Membership not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Membership deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting membership:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
