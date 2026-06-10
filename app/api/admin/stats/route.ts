import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get all counts
    const [usersResult, propertiesResult, bookingsResult, revenueResult] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('properties').select('id', { count: 'exact', head: true }),
      supabase.from('bookings').select('id', { count: 'exact', head: true }),
      supabase.from('bookings').select('total_price').eq('status', 'confirmed')
    ]);

    const totalUsers = usersResult.count || 0;
    const totalProperties = propertiesResult.count || 0;
    const totalBookings = bookingsResult.count || 0;

    let totalRevenue = 0;
    if (revenueResult.data) {
      totalRevenue = revenueResult.data.reduce((sum, booking) => sum + (booking.total_price || 0), 0);
    }

    return NextResponse.json({
      totalUsers,
      totalProperties,
      totalBookings,
      totalRevenue: parseFloat(totalRevenue.toFixed(2))
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
