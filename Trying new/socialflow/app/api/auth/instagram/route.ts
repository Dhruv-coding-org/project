import { NextResponse } from 'next/server';
import { getAccounts } from '@/lib/db';

export async function GET() {
  try {
    const accounts = getAccounts();
    const appId = accounts.instagram.appId;
    if (!appId) return NextResponse.json({ error: 'App ID not set' }, { status: 400 });
    const redirectUri = 'http://127.0.0.1:3000/api/auth/instagram/callback';
    const scope = 'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement';
    const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${encodeURIComponent(appId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}`;
    return NextResponse.redirect(authUrl);
  } catch (error: any) { return NextResponse.json({ error: error.message }, { status: 500 }); }
}
