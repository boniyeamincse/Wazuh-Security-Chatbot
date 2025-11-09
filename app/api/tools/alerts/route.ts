import { NextRequest, NextResponse } from 'next/server';
import { getWazuhClient } from '@/lib/wazuh';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;
    const level = searchParams.get('level');
    const time = searchParams.get('time');
    const search = searchParams.get('search');

    const client = getWazuhClient();
    const result = await client.getAlerts({
      limit,
      offset,
      level: level || undefined,
      time: time || undefined,
      search: search || undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}