import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { searchParams } = new URL(request.url);
    const verifiedFilter = searchParams.get('verified');
    const cityFilter = searchParams.get('city');

    let query = supabase.from('properties').select(
      'id, title, city, price, verified, available, rating, host_id, images, created_at'
    );

    if (verifiedFilter === 'true') {
      query = query.eq('verified', true);
    } else if (verifiedFilter === 'false') {
      query = query.eq('verified', false);
    }

    if (cityFilter) {
      query = query.eq('city', cityFilter);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch properties' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { propertyId, verified, available } = await request.json();

    if (!propertyId) {
      return NextResponse.json({ error: 'propertyId is required' }, { status: 400 });
    }

    const updates: Record<string, boolean> = {};
    if (verified !== undefined) updates.verified = verified;
    if (available !== undefined) updates.available = available;

    const { data, error } = await supabase
      .from('properties')
      .update(updates)
      .eq('id', propertyId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update property' },
      { status: 500 }
    );
  }
}
