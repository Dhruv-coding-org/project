import { NextResponse } from 'next/server';
import { getPosts, addPost, deletePost, updatePost } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function GET() {
  try { return NextResponse.json(getPosts()); }
  catch (error) { return NextResponse.json([], { status: 200 }); }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const post = {
      id: randomUUID(), title: body.title || '', description: body.description || '',
      hashtags: body.hashtags || '', filePath: body.filePath || '',
      fileName: body.fileName || '', fileSize: body.fileSize || 0,
      platforms: body.platforms || ['youtube', 'instagram'],
      status: 'scheduled' as const, scheduledAt: body.scheduledAt || new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    addPost(post);
    return NextResponse.json(post, { status: 201 });
  } catch (error) { return NextResponse.json({ error: 'Failed to create post' }, { status: 500 }); }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    deletePost(id); return NextResponse.json({ success: true });
  } catch (error) { return NextResponse.json({ error: 'Failed to delete' }, { status: 500 }); }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json(); const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    const updated = updatePost(id, updates); return NextResponse.json(updated);
  } catch (error) { return NextResponse.json({ error: 'Failed to update' }, { status: 500 }); }
}
