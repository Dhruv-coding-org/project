import { NextResponse } from 'next/server';
import { getPosts, updatePost, getAccounts } from '@/lib/db';
import { uploadToYouTube } from '@/lib/platforms/youtube';
import { uploadToInstagram } from '@/lib/platforms/instagram';

export async function POST(request: Request) {
  try {
    const { postId } = await request.json();
    if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 });
    const posts = getPosts();
    const post = posts.find(p => p.id === postId);
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    updatePost(postId, { status: 'uploading' });
    const accounts = getAccounts();
    const results: any = {};
    if (post.platforms.includes('youtube') && accounts.youtube.connected) {
      const ytResult = await uploadToYouTube(post.filePath, post.title, `${post.description}\n\n${post.hashtags}`);
      results.youtube = ytResult;
      if (ytResult.success) updatePost(postId, { youtubeUrl: ytResult.url });
    }
    if (post.platforms.includes('instagram') && accounts.instagram.connected) {
      const igResult = await uploadToInstagram(post.filePath, `${post.title}\n\n${post.description}\n\n${post.hashtags}`);
      results.instagram = igResult;
      if (igResult.success) updatePost(postId, { instagramUrl: igResult.url });
    }
    const allSucceeded = Object.values(results).every((r: any) => r.success);
    const errors = Object.entries(results).filter(([, r]: any) => !r.success).map(([p, r]: any) => `${p}: ${r.error}`).join('; ');
    updatePost(postId, { status: allSucceeded ? 'posted' : 'failed', postedAt: new Date().toISOString(), error: errors || undefined });
    return NextResponse.json({ success: true, results });
  } catch (error: any) { return NextResponse.json({ error: error.message }, { status: 500 }); }
}
