import { getAccounts } from '@/lib/db';

export async function uploadToInstagram(filePath: string, caption: string): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const accounts = getAccounts();
    const { accessToken, userId } = accounts.instagram;
    if (!accessToken || !userId) return { success: false, error: 'Instagram credentials not configured' };
    const isUrl = filePath.startsWith('http://') || filePath.startsWith('https://');
    if (!isUrl) return { success: false, error: 'Instagram requires videos at a public URL. Please host the video online first.' };
    const containerRes = await fetch(`https://graph.facebook.com/v19.0/${userId}/media`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ media_type: 'REELS', video_url: filePath, caption, access_token: accessToken }),
    });
    const containerData = await containerRes.json();
    if (containerData.error) return { success: false, error: containerData.error.message };
    const containerId = containerData.id;
    let ready = false, attempts = 0;
    while (!ready && attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      const statusRes = await fetch(`https://graph.facebook.com/v19.0/${containerId}?fields=status_code&access_token=${accessToken}`);
      const statusData = await statusRes.json();
      if (statusData.status_code === 'FINISHED') ready = true;
      else if (statusData.status_code === 'ERROR') return { success: false, error: 'Instagram media processing failed' };
      attempts++;
    }
    if (!ready) return { success: false, error: 'Instagram media processing timed out' };
    const publishRes = await fetch(`https://graph.facebook.com/v19.0/${userId}/media_publish`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creation_id: containerId, access_token: accessToken }),
    });
    const publishData = await publishRes.json();
    if (publishData.error) return { success: false, error: publishData.error.message };
    return { success: true, url: `https://www.instagram.com/reel/${publishData.id}/` };
  } catch (error: any) { return { success: false, error: error.message || 'Instagram upload failed' }; }
}
