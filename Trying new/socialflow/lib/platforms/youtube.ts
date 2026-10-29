import { google } from 'googleapis';
import fs from 'fs';
import { getAccounts } from '@/lib/db';

export async function uploadToYouTube(filePath: string, title: string, description: string): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const accounts = getAccounts();
    const { clientId, clientSecret, refreshToken } = accounts.youtube;
    if (!clientId || !clientSecret || !refreshToken) return { success: false, error: 'YouTube credentials not configured' };
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await oauth2Client.refreshAccessToken();
    oauth2Client.setCredentials(credentials);
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
    const fileStream = fs.createReadStream(filePath);
    const response = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: { snippet: { title, description, categoryId: '22' }, status: { privacyStatus: 'public', selfDeclaredMadeForKids: false } },
      media: { body: fileStream },
    });
    const videoId = response.data.id;
    return { success: true, url: `https://youtube.com/shorts/${videoId}` };
  } catch (error: any) { return { success: false, error: error.message || 'YouTube upload failed' }; }
}
