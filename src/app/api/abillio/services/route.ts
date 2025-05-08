import { NextResponse } from 'next/server';
import { abillioApiRequest } from '@/lib/abillio';

export async function GET() {
  try {
    const data = await abillioApiRequest('services', {}, 'GET', { lang: 'en' });
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
} 