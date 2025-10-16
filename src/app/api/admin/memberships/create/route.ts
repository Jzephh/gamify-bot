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
    const companyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID!;
    
    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    
    // Check if user is admin
    const adminUser = await User.findOne({ userId, companyId });
    if (!adminUser || !adminUser.roles?.includes('admin')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    const { name, description, duration, cost, isActive = true } = await request.json();
    
    if (!name || !description || !duration || cost === undefined) {
      return NextResponse.json({ 
        error: 'Name, description, duration, and cost are required' 
      }, { status: 400 });
    }
    
    if (duration < 1 || cost < 0) {
      return NextResponse.json({ 
        error: 'Duration must be at least 1 day and cost must be non-negative' 
      }, { status: 400 });
    }
    
    // Create new membership
    const membership = new Membership({
      name,
      description,
      duration,
      cost,
      isActive,
      companyId
    });
    
    await membership.save();
    
    return NextResponse.json({
      success: true,
      message: 'Membership created successfully',
      membership
    });
  } catch (error) {
    console.error('Error creating membership:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
