import { NextResponse } from 'next/server';
import { getAccounts, updateAccounts } from '@/lib/db';

export async function GET() {
  try {
    const accounts = getAccounts();
    return NextResponse.json({
      youtube: { connected: accounts.youtube.connected, channelName: accounts.youtube.channelName || '', hasCredentials: !!(accounts.youtube.clientId && accounts.youtube.clientSecret) },
      instagram: { connected: accounts.instagram.connected, username: accounts.instagram.username || '', hasCredentials: !!(accounts.instagram.appId && accounts.instagram.appSecret) },
    });
  } catch (error) { return NextResponse.json({ youtube: { connected: false }, instagram: { connected: false } }); }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const accounts = getAccounts();
    if (body.platform === 'youtube') {
      accounts.youtube = { ...accounts.youtube, connected: body.clientId === '' ? false : accounts.youtube.connected,
        clientId: body.clientId ?? accounts.youtube.clientId, clientSecret: body.clientSecret ?? accounts.youtube.clientSecret,
        refreshToken: body.refreshToken ?? accounts.youtube.refreshToken, channelName: body.channelName ?? accounts.youtube.channelName };
    } else if (body.platform === 'instagram') {
      accounts.instagram = { ...accounts.instagram, connected: body.accessToken === '' ? false : accounts.instagram.connected,
        accessToken: body.accessToken ?? accounts.instagram.accessToken, userId: body.userId ?? accounts.instagram.userId,
        username: body.username ?? accounts.instagram.username, appId: body.appId ?? accounts.instagram.appId,
        appSecret: body.appSecret ?? accounts.instagram.appSecret };
    }
    updateAccounts(accounts); return NextResponse.json({ success: true });
  } catch (error) { return NextResponse.json({ error: 'Failed to update' }, { status: 500 }); }
}
