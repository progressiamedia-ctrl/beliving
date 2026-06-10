import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface PropertyParams {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  { params }: PropertyParams
) {
  try {
    const { id } = await params
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    if (!data) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Get property error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch property' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: PropertyParams
) {
  try {
    const { id } = await params
    const { host_id, ...updateData } = await request.json()

    // Verify ownership
    const { data: property } = await supabase
      .from('properties')
      .select('host_id')
      .eq('id', id)
      .single()

    if (!property || property.host_id !== host_id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const { data, error } = await supabase
      .from('properties')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Update property error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update property' },
      { status: 500 }
    )
  }
}
