import { NextResponse } from 'next/server';
import { getAccounts, updateAccounts } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    if (error) return NextResponse.redirect('http://127.0.0.1:3000/accounts?error=denied');
    if (!code) return NextResponse.redirect('http://127.0.0.1:3000/accounts?error=no_code');
    const accounts = getAccounts();
    const { clientId, clientSecret } = accounts.youtube;
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret,
        redirect_uri: 'http://127.0.0.1:3000/api/auth/youtube/callback', grant_type: 'authorization_code' }),
    });
    const tokenData = await tokenRes.json();
    if (tokenData.error) return NextResponse.redirect(`http://127.0.0.1:3000/accounts?error=${tokenData.error}`);
    let channelName = '';
    try {
      const channelRes = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
        { headers: { Authorization: `Bearer ${tokenData.access_token}` } });
      const channelData = await channelRes.json();
      if (channelData.items?.length > 0) channelName = channelData.items[0].snippet.title;
    } catch (e) {}
    accounts.youtube = { connected: true, clientId, clientSecret,
      refreshToken: tokenData.refresh_token || accounts.youtube.refreshToken,
      accessToken: tokenData.access_token, channelName };
    updateAccounts(accounts);
    return NextResponse.redirect('http://127.0.0.1:3000/accounts?success=youtube');
  } catch (error: any) { return NextResponse.redirect('http://127.0.0.1:3000/accounts?error=server_error'); }
}
