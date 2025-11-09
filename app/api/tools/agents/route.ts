import { NextRequest, NextResponse } from 'next/server';
import { getWazuhClient } from '@/lib/wazuh';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const client = getWazuhClient();
    const result = await client.getAgents({
      limit,
      offset,
      status: status || undefined,
      search: search || undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}