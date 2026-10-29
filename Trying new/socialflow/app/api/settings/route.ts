import { NextResponse } from 'next/server';
import { getSettings, updateSettings } from '@/lib/db';

export async function GET() {
  try { return NextResponse.json(getSettings()); } catch (error) { return NextResponse.json({}); }
}

export async function POST(request: Request) {
  try { const body = await request.json(); const updated = updateSettings(body); return NextResponse.json(updated); }
  catch (error) { return NextResponse.json({ error: 'Failed to update' }, { status: 500 }); }
}
