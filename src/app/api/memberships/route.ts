import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Membership } from '@/models/Membership';

export async function GET() {
  try {
    await connectDB();
    
    const companyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID!;
    
    if (!companyId) {
      return NextResponse.json({ error: 'Company ID not configured' }, { status: 500 });
    }
    
    // Get all active memberships for the company
    const memberships = await Membership.find({ 
      companyId, 
      isActive: true 
    }).sort({ cost: 1 }); // Sort by cost ascending
    
    return NextResponse.json(memberships);
  } catch (error) {
    console.error('Error fetching memberships:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
