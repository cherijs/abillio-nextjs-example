export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { abillioApiRequest } from '@/lib/abillio';

export async function GET(req: NextRequest, context: { params: { endpoint: string[] } }) {
  const endpoint = context.params.endpoint.join('/');
  const queryParams = Object.fromEntries(req.nextUrl.searchParams.entries());
  try {
    const data = await abillioApiRequest(endpoint, {}, 'GET', queryParams);
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, context: { params: { endpoint: string[] } }) {
  const endpoint = context.params.endpoint.join('/');
  const body = await req.json();
  const queryParams = Object.fromEntries(req.nextUrl.searchParams.entries());
  try {
    const data = await abillioApiRequest(endpoint, body, 'POST', queryParams);
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
