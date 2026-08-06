const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;

ffmpeg.setFfmpegPath(ffmpegPath);

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

function handleStreamRequest(req, res) {
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

  const forceTranscode = req.query.transcode === 'true';
  const fullTranscode = req.query.transcode === 'full';
  const forceRaw = req.query.raw === 'true';
  const autoRemuxExts = ['.mkv', '.avi', '.mov', '.wmv', '.flv', '.ts', '.mts', '.m2ts'];

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
        '-vf scale=-2:1080', // Downscale to 1080p max to ensure real-time CPU encoding
        '-crf 23',
        '-c:a aac',
        '-b:a 192k',
        '-ac 2',
        '-movflags frag_keyframe+empty_moov+default_base_moof',
        '-f mp4'
      ])
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

module.exports = {
  handleStreamRequest,
  handleStreamHealth,
};
