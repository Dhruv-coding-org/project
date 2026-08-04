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
  const forceRaw = req.query.raw === 'true';

  // If MKV or requested transcode (and not explicitly raw), transcode audio on-the-fly to AAC with zero video quality loss
  if ((ext === '.mkv' || forceTranscode) && !forceRaw) {
    console.log(`[StreamHandler] Transcoding MKV/audio on-the-fly (c:v copy, c:a aac) for: ${path.basename(filePath)}`);
    res.writeHead(200, {
      'Content-Type': 'video/mp4',
      'Accept-Ranges': 'none',
      'Cache-Control': 'no-cache',
    });

    const command = ffmpeg(filePath)
      .outputOptions([
        '-c:v copy', // Zero video loss, 0% CPU for video
        '-c:a aac',  // Convert AC3/DTS/EAC3 audio to stereo AAC for Chrome/Electron compatibility
        '-b:a 320k', // 320kbps high quality audio
        '-ac 2',
        '-movflags frag_keyframe+empty_moov+default_base_moof',
        '-f mp4'
      ])
      .on('error', (err) => {
        if (!err.message.includes('Output stream closed') && !err.message.includes('pipe:1')) {
          console.error('[StreamHandler] FFmpeg transcode error:', err.message);
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

    if (start >= fileSize || end >= fileSize) {
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

    fileStream.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': mimeType,
      'Accept-Ranges': 'bytes',
    });

    fs.createReadStream(filePath).pipe(res);
  }
}

module.exports = {
  handleStreamRequest,
};
