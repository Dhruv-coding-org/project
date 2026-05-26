import { NextResponse } from 'next/server';
import { getAccounts } from '@/lib/db';

export async function GET() {
  try {
    const accounts = getAccounts();
    const { clientId } = accounts.youtube;
    if (!clientId) return NextResponse.json({ error: 'Client ID not set' }, { status: 400 });
    const redirectUri = 'http://127.0.0.1:3000/api/auth/youtube/callback';
    const scope = 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube';
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`;
    return NextResponse.redirect(authUrl);
  } catch (error: any) { return NextResponse.json({ error: error.message }, { status: 500 }); }
}
