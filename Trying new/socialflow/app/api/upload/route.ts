import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

export async function POST(request: Request) {
  try {
    if (!existsSync(UPLOAD_DIR)) await mkdir(UPLOAD_DIR, { recursive: true });
    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = path.extname(file.name);
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    const filePath = path.join(UPLOAD_DIR, uniqueName);
    await writeFile(filePath, buffer);
    return NextResponse.json({ success: true, filePath, fileName: file.name, fileSize: file.size, savedAs: uniqueName });
  } catch (error) { console.error('Upload error:', error); return NextResponse.json({ error: 'Upload failed' }, { status: 500 }); }
}
