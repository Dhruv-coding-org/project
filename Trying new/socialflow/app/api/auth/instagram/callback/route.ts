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
    const { appId, appSecret } = accounts.instagram;
    const tokenRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent('http://127.0.0.1:3000/api/auth/instagram/callback')}&client_secret=${appSecret}&code=${code}`);
    const tokenData = await tokenRes.json();
    if (tokenData.error) return NextResponse.redirect(`http://127.0.0.1:3000/accounts?error=${encodeURIComponent(tokenData.error.message)}`);
    const longTokenRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${tokenData.access_token}`);
    const longTokenData = await longTokenRes.json();
    const accessToken = longTokenData.access_token || tokenData.access_token;
    let userId = '', username = '';
    try {
      const pagesRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}`);
      const pagesData = await pagesRes.json();
      if (pagesData.data?.length > 0) {
        const pageId = pagesData.data[0].id;
        const pageToken = pagesData.data[0].access_token;
        const igRes = await fetch(`https://graph.facebook.com/v19.0/${pageId}?fields=instagram_business_account&access_token=${pageToken}`);
        const igData = await igRes.json();
        if (igData.instagram_business_account) {
          userId = igData.instagram_business_account.id;
          const userRes = await fetch(`https://graph.facebook.com/v19.0/${userId}?fields=username&access_token=${accessToken}`);
          const userData = await userRes.json();
          username = userData.username || '';
        }
      }
    } catch (e) {}
    accounts.instagram = { connected: !!(accessToken && userId), accessToken, userId, username, appId, appSecret };
    updateAccounts(accounts);
    return NextResponse.redirect(userId ? 'http://127.0.0.1:3000/accounts?success=instagram' : 'http://127.0.0.1:3000/accounts?error=no_ig_business');
  } catch (error: any) { return NextResponse.redirect('http://127.0.0.1:3000/accounts?error=server_error'); }
}
