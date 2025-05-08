import { NextRequest, NextResponse } from 'next/server';
import { abillioApiRequest } from '@/lib/abillio';

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  console.log(params);
  try {
    const data = await abillioApiRequest('services', {}, 'GET', params);
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
} 