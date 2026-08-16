const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.mp4': case '.m4v': return 'video/mp4';
    case '.mkv': return 'video/x-matroska';
    case '.webm': return 'video/webm';
    case '.mov': return 'video/quicktime';
    case '.avi': return 'video/x-msvideo';
    case '.flv': return 'video/x-flv';
    case '.wmv': return 'video/x-ms-wmv';
    case '.mp3': return 'audio/mpeg';
    case '.wav': return 'audio/wav';
    case '.aac': return 'audio/aac';
    case '.flac': return 'audio/flac';
    case '.ogg': case '.opus': return 'audio/ogg';
    default: return 'video/mp4';
  }
}

async function handleStreamRequest(req, res) {
  const rawPath = req.query.path;
  if (!rawPath) {
    return res.status(400).json({ error: 'Missing path parameter' });
  }

  const filePath = decodeURIComponent(rawPath);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found on local disk' });
  }

  let stat;
  try {
    stat = fs.statSync(filePath);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to access file stats', details: err.message });
  }

  const fileSize = stat.size;
  const mimeType = getMimeType(filePath);
  const ext = path.extname(filePath).toLowerCase();

  // Enable CORS for stream requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  let forceTranscode = req.query.transcode === 'true';
  let fullTranscode = req.query.transcode === 'full';
  const forceRaw = req.query.raw === 'true';
  const autoRemuxExts = ['.mkv', '.avi', '.mov', '.wmv', '.flv', '.ts', '.mts', '.m2ts'];

  // --- Smart Codec Probing ---
  if (!forceRaw) {
    try {
      const metadata = await new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, data) => {
          if (err) reject(err);
          else resolve(data);
        });
      });

      const videoStream = metadata.streams.find(s => s.codec_type === 'video');
      const audioStreams = metadata.streams.filter(s => s.codec_type === 'audio');

      if (videoStream) {
        const browserSupportedVideo = ['h264', 'vp8', 'vp9', 'av1'];
        if (!browserSupportedVideo.includes(videoStream.codec_name)) {
          console.log(`[StreamHandler] Unsupported video codec detected: ${videoStream.codec_name}. Forcing full transcode.`);
          fullTranscode = true;
        }
      }

      if (!fullTranscode && audioStreams.length > 0) {
        // If video is fine, check if audio needs transcoding (e.g. AC3/DTS in MP4)
        const browserSupportedAudio = ['aac', 'mp3', 'vorbis', 'opus', 'flac'];
        // We just check the first audio stream for simplicity
        if (!browserSupportedAudio.includes(audioStreams[0].codec_name)) {
          console.log(`[StreamHandler] Unsupported audio codec detected: ${audioStreams[0].codec_name}. Forcing audio transcode.`);
          forceTranscode = true;
        }
      }
    } catch (err) {
      console.error('[StreamHandler] FFprobe smart detection failed:', err.message);
    }
  }
  // ---------------------------

  // Full Transcode Mode (e.g. HEVC / H.265 video stream conversion to H.264 for Chrome/Electron)
  if (fullTranscode && !forceRaw) {
    console.log(`[StreamHandler] Full transcoding (c:v libx264 ultrafast, c:a aac) for: ${path.basename(filePath)}`);
    res.writeHead(200, {
      'Content-Type': 'video/mp4',
      'Accept-Ranges': 'none',
      'Cache-Control': 'no-cache',
    });

    const command = ffmpeg(filePath)
      .outputOptions([
        '-c:v libx264',
        '-preset ultrafast',
        '-tune zerolatency',
        '-threads 0',
        '-vf scale=-2:1080',
        '-pix_fmt yuv420p',
        '-profile:v main',
        '-crf 28', // Lower quality to ensure real-time speed on all CPUs
        '-c:a aac',
        '-b:a 128k',
        '-ac 2',
        '-movflags frag_keyframe+empty_moov+default_base_moof',
        '-f mp4'
      ])
      .on('start', (cmd) => console.log(`[StreamHandler] FFmpeg started: ${cmd}`))
      .on('error', (err) => {
        if (!err.message.includes('Output stream closed') && !err.message.includes('pipe:1')) {
          console.error('[StreamHandler] FFmpeg full transcode error:', err.message);
        }
      });

    const ffmpegStream = command.pipe();
    ffmpegStream.pipe(res);

    res.on('close', () => {
      try {
        command.kill('SIGKILL');
      } catch (e) {
        // Ignore kill errors on close
      }
    });
    return;
  }

  // Auto-Remux Mode (Zero video loss, 0% CPU for video, transcode AC3/DTS audio to AAC)
  if ((autoRemuxExts.includes(ext) || forceTranscode) && !forceRaw) {
    console.log(`[StreamHandler] Transcoding container/audio on-the-fly (c:v copy, c:a aac) for: ${path.basename(filePath)}`);
    res.writeHead(200, {
      'Content-Type': 'video/mp4',
      'Accept-Ranges': 'none',
      'Cache-Control': 'no-cache',
    });

    const command = ffmpeg(filePath)
      .outputOptions([
        '-c:v copy', // Zero video loss, 0% CPU for video
        '-c:a aac',  // Convert AC3/DTS/EAC3 audio to stereo AAC for Chrome/Electron compatibility
        '-b:a 192k', // fast high quality audio
        '-ac 2',
        '-movflags frag_keyframe+empty_moov+default_base_moof',
        '-f mp4'
      ])
      .on('error', (err) => {
        if (!err.message.includes('Output stream closed') && !err.message.includes('pipe:1')) {
          console.error('[StreamHandler] FFmpeg remux error:', err.message);
        }
      });

    const ffmpegStream = command.pipe();
    ffmpegStream.pipe(res);

    res.on('close', () => {
      try {
        command.kill('SIGKILL');
      } catch (e) {
        // Ignore kill errors on close
      }
    });
    return;
  }

  const range = req.headers.range;
  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (isNaN(start) || start >= fileSize || end >= fileSize || start > end) {
      res.setHeader('Content-Range', `bytes */${fileSize}`);
      return res.status(416).send('Requested Range Not Satisfiable');
    }

    const chunksize = (end - start) + 1;
    const fileStream = fs.createReadStream(filePath, { start, end });

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': mimeType,
    });

    fileStream.on('error', (err) => {
      console.error('[StreamHandler] File stream error:', err.message);
      if (!res.headersSent) {
        res.status(500).send('File streaming error');
      }
    });

    fileStream.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': mimeType,
      'Accept-Ranges': 'bytes',
    });

    const fileStream = fs.createReadStream(filePath);
    fileStream.on('error', (err) => {
      console.error('[StreamHandler] File stream error:', err.message);
      if (!res.headersSent) {
        res.status(500).send('File streaming error');
      }
    });

    fileStream.pipe(res);
  }
}

function handleStreamHealth(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({ status: 'ok', service: 'SyncStream Local Streaming' });
}

function handleMediaInfo(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const rawPath = req.query.path;
  if (!rawPath) return res.status(400).json({ error: 'Missing path' });

  const filePath = decodeURIComponent(rawPath);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });

  ffmpeg.ffprobe(filePath, (err, metadata) => {
    if (err) {
      console.error('[StreamHandler] FFprobe error:', err.message);
      return res.status(500).json({ error: 'Probe failed' });
    }

    const subtitles = metadata.streams
      .filter(s => s.codec_type === 'subtitle' && ['subrip', 'ass', 'webvtt', 'mov_text'].includes(s.codec_name))
      .map(s => ({
        index: s.index,
        codec: s.codec_name,
        language: s.tags && s.tags.language ? s.tags.language : 'Unknown',
        title: s.tags && s.tags.title ? s.tags.title : `Track ${s.index}`
      }));

    res.json({ subtitles });
  });
}

function handleSubtitleExtract(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const rawPath = req.query.path;
  const trackIndex = req.query.track;
  
  if (!rawPath || !trackIndex) return res.status(400).send('Missing path or track parameter');
  
  const filePath = decodeURIComponent(rawPath);
  if (!fs.existsSync(filePath)) return res.status(404).send('File not found');

  res.writeHead(200, {
    'Content-Type': 'text/vtt',
    'Cache-Control': 'no-cache',
  });

  const command = ffmpeg(filePath)
    .outputOptions([
      `-map 0:${trackIndex}`,
      '-f webvtt'
    ])
    .on('error', (err) => {
      if (!err.message.includes('Output stream closed')) {
        console.error('[StreamHandler] Subtitle extract error:', err.message);
      }
    });

  const ffmpegStream = command.pipe();
  ffmpegStream.pipe(res);

  res.on('close', () => {
    try {
      command.kill('SIGKILL');
    } catch (e) {}
  });
}

module.exports = {
  handleStreamRequest,
  handleStreamHealth,
  handleMediaInfo,
  handleSubtitleExtract,
};
