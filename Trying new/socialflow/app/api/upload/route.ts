import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const ALLOWED_EXTENSIONS = new Set(['.mp4', '.mov', '.avi', '.webm', '.mkv', '.m4v']);
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB

export async function POST(request: Request) {
  try {
    if (!existsSync(UPLOAD_DIR)) await mkdir(UPLOAD_DIR, { recursive: true });
    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size exceeds maximum limit of 500 MB' }, { status: 400 });
    }

    const ext = path.extname(file.name || '').toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json({ error: 'Unsupported file format. Please upload MP4, MOV, WEBM, AVI, or MKV video files.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const sanitizedBase = path.basename(file.name).replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    const filePath = path.join(UPLOAD_DIR, uniqueName);
    
    await writeFile(filePath, buffer);
    return NextResponse.json({ 
      success: true, 
      filePath, 
      fileName: sanitizedBase, 
      fileSize: file.size, 
      savedAs: uniqueName 
    });
  } catch (error: any) { 
    console.error('Upload error:', error); 
    return NextResponse.json({ error: 'Upload failed: ' + (error?.message || 'Internal error') }, { status: 500 }); 
  }
}
