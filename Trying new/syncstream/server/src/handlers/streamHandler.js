const fs = require('fs');
const path = require('path');
const os = require('os');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

// Fast in-memory cache for file codec inspection
const probeCache = new Map();

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
    case '.ts': case '.m2ts': case '.mts': return 'video/mp2t';
    case '.mp3': return 'audio/mpeg';
    case '.wav': return 'audio/wav';
    case '.aac': return 'audio/aac';
    case '.flac': return 'audio/flac';
    case '.ogg': case '.opus': return 'audio/ogg';
    default: return 'video/mp4';
  }
}

async function probeMedia(filePath, mtimeMs) {
  const cacheKey = `${filePath}_${mtimeMs}`;
  if (probeCache.has(cacheKey)) {
    return probeCache.get(cacheKey);
  }

  return new Promise((resolve) => {
    ffmpeg.ffprobe(filePath, (err, data) => {
      if (err || !data) {
        console.warn('[StreamHandler] FFprobe probe warning:', err?.message);
        resolve(null);
        return;
      }
      probeCache.set(cacheKey, data);
      resolve(data);
    });
  });
}

/**
 * Universal Stream Handler:
 * - Detects container & codecs automatically
 * - Zero-loss instant remux for supported codecs
 * - Real-time zero-latency transcoding for HEVC/AC3/DTS/AVI/MKV
 * - Native fast seeking with startTime / t parameter
 */
async function handleStreamRequest(req, res) {
  const rawPath = req.query.path;
  if (!rawPath) {
    return res.status(400).json({ error: 'Missing path parameter' });
  }

  const filePath = decodeURIComponent(rawPath);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found on disk' });
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

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  const startTime = Math.max(0, parseFloat(req.query.startTime || req.query.start || req.query.t || 0));
  const forceTranscode = req.query.transcode === 'true' || req.query.transcode === 'full';
  const forceRaw = req.query.raw === 'true';

  const nonNativeContainers = ['.mkv', '.avi', '.mov', '.wmv', '.flv', '.ts', '.mts', '.m2ts', '.vob', '.3gp'];
  const isNonNativeContainer = nonNativeContainers.includes(ext);

  let videoSupported = true;
  let audioSupported = true;
  let hasVideo = false;

  const metadata = await probeMedia(filePath, stat.mtimeMs);

  if (metadata && metadata.streams) {
    const videoStream = metadata.streams.find(s => s.codec_type === 'video');
    const audioStream = metadata.streams.find(s => s.codec_type === 'audio');

    if (videoStream) {
      hasVideo = true;
      const codec = (videoStream.codec_name || '').toLowerCase();
      // Browser-native video decoders: h264, vp8, vp9, av1
      videoSupported = ['h264', 'avc1', 'vp8', 'vp9', 'av1'].includes(codec);
      if (!videoSupported) {
        console.log(`[StreamHandler] Unsupported video codec detected: ${codec} (Requires libx264 transcode)`);
      }
    }

    if (audioStream) {
      const codec = (audioStream.codec_name || '').toLowerCase();
      // Browser-native audio decoders: aac, mp3, opus, vorbis, flac
      audioSupported = ['aac', 'mp3', 'opus', 'vorbis', 'flac'].includes(codec);
      if (!audioSupported) {
        console.log(`[StreamHandler] Unsupported audio codec detected: ${codec} (Requires aac transcode)`);
      }
    }
  }

  const needsConversion = forceTranscode || isNonNativeContainer || !videoSupported || !audioSupported || startTime > 0;

  // ── 1. NATIVE MP4 / WEBM DIRECT RANGE STREAMING ──────────────
  if (!needsConversion && !forceRaw) {
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
        console.error('[StreamHandler] Range stream error:', err.message);
        if (!res.headersSent) res.status(500).send('File streaming error');
      });

      fileStream.pipe(res);
      return;
    }

    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': mimeType,
      'Accept-Ranges': 'bytes',
    });

    const fileStream = fs.createReadStream(filePath);
    fileStream.on('error', (err) => {
      console.error('[StreamHandler] File stream error:', err.message);
      if (!res.headersSent) res.status(500).send('File streaming error');
    });

    fileStream.pipe(res);
    return;
  }

  // ── 2. UNIVERSAL ON-THE-FLY REMUX & TRANSCODE PIPELINE ────────
  console.log(`[StreamHandler] Streaming via FFmpeg: ${path.basename(filePath)} (start: ${startTime}s, v:${videoSupported ? 'copy' : 'h264'}, a:${audioSupported ? 'copy' : 'aac'})`);

  res.writeHead(200, {
    'Content-Type': 'video/mp4',
    'Accept-Ranges': 'none',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Connection': 'keep-alive',
    'X-Stream-Start-Time': String(startTime),
  });

  const command = ffmpeg(filePath);

  // Fast keyframe seek before input for zero buffering
  if (startTime > 0) {
    command.seekInput(startTime);
  }

  const outputOptions = [
    '-movflags frag_keyframe+empty_moov+default_base_moof',
    '-f mp4'
  ];

  if (hasVideo) {
    if (videoSupported && req.query.transcode !== 'full') {
      outputOptions.push('-c:v copy');
    } else {
      // Real-time ultra-low latency x264 transcode (for HEVC / WMV / MPEG4)
      outputOptions.push(
        '-c:v libx264',
        '-preset ultrafast',
        '-tune zerolatency',
        '-threads 0',
        '-pix_fmt yuv420p',
        '-crf 25'
      );
    }
  }

  if (audioSupported && req.query.transcode !== 'full') {
    outputOptions.push('-c:a copy');
  } else {
    // Universal stereo AAC audio for AC3/DTS/EAC3
    outputOptions.push('-c:a aac', '-b:a 192k', '-ac 2');
  }

  command.outputOptions(outputOptions);

  command.on('error', (err) => {
    if (!err.message.includes('Output stream closed') && !err.message.includes('pipe:1')) {
      console.error('[StreamHandler] FFmpeg stream error:', err.message);
    }
  });

  const ffmpegStream = command.pipe();
  ffmpegStream.pipe(res);

  res.on('close', () => {
    try {
      command.kill('SIGKILL');
    } catch {
      // Ignore kill error on socket close
    }
  });
}

function handleStreamHealth(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({
    status: 'ok',
    service: 'SyncStream Universal Media Streaming Engine',
    ffmpegReady: !!ffmpegPath,
    ffprobeReady: !!ffprobePath
  });
}

/**
 * Handle direct file upload / streaming for Web App users
 */
function handleStreamUpload(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

  const origName = req.query.name || `upload_${Date.now()}.mp4`;
  const uploadDir = path.join(__dirname, '../../uploads');

  try {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
  } catch (err) {
    console.error('[StreamHandler] Failed to create upload directory:', err);
  }

  const safeName = `${Date.now()}_${path.basename(origName).replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const targetPath = path.join(uploadDir, safeName);
  const writeStream = fs.createWriteStream(targetPath);

  req.pipe(writeStream);

  writeStream.on('finish', () => {
    console.log(`[StreamHandler] Upload complete: ${origName} -> ${targetPath}`);
    res.json({
      success: true,
      path: targetPath,
      fileName: origName,
      streamUrl: `/api/stream?path=${encodeURIComponent(targetPath)}`
    });
  });

  writeStream.on('error', (err) => {
    console.error('[StreamHandler] Upload write stream error:', err);
    res.status(500).json({ error: 'Failed to write upload' });
  });
}

/**
 * Inspects media metadata and extracts all embedded subtitle tracks
 */
async function handleMediaInfo(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const rawPath = req.query.path;
  if (!rawPath) return res.status(400).json({ error: 'Missing path' });

  const filePath = decodeURIComponent(rawPath);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });

  let stat;
  try {
    stat = fs.statSync(filePath);
  } catch {
    return res.status(500).json({ error: 'Failed to stat file' });
  }

  const metadata = await probeMedia(filePath, stat.mtimeMs);
  if (!metadata) {
    return res.status(500).json({ error: 'Probe failed' });
  }

  const videoStream = metadata.streams.find(s => s.codec_type === 'video');
  const audioStream = metadata.streams.find(s => s.codec_type === 'audio');

  const subtitles = (metadata.streams || [])
    .filter(s => s.codec_type === 'subtitle')
    .map(s => {
      const lang = s.tags && (s.tags.language || s.tags.lang) ? (s.tags.language || s.tags.lang).toLowerCase() : 'unknown';
      const title = s.tags && s.tags.title ? s.tags.title : `Track ${s.index} (${lang.toUpperCase()})`;
      const isDefault = !!(s.disposition && s.disposition.default);
      return {
        index: s.index,
        codec: s.codec_name,
        language: lang,
        title,
        isDefault
      };
    });

  res.json({
    duration: metadata.format?.duration ? parseFloat(metadata.format.duration) : null,
    videoCodec: videoStream?.codec_name || null,
    audioCodec: audioStream?.codec_name || null,
    width: videoStream?.width || null,
    height: videoStream?.height || null,
    subtitles,
  });
}

/**
 * Extracts any embedded subtitle stream directly into clean WebVTT
 */
function handleSubtitleExtract(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const rawPath = req.query.path;
  const trackIndex = req.query.track;

  if (!rawPath || trackIndex === undefined) {
    return res.status(400).send('Missing path or track parameter');
  }

  const filePath = decodeURIComponent(rawPath);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File not found');
  }

  res.writeHead(200, {
    'Content-Type': 'text/vtt; charset=utf-8',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
  });

  const command = ffmpeg(filePath)
    .outputOptions([
      `-map 0:${trackIndex}`,
      '-f webvtt'
    ])
    .on('error', (err) => {
      if (!err.message.includes('Output stream closed') && !err.message.includes('pipe:1')) {
        console.error('[StreamHandler] Subtitle extract error:', err.message);
      }
    });

  const ffmpegStream = command.pipe();
  ffmpegStream.pipe(res);

  res.on('close', () => {
    try {
      command.kill('SIGKILL');
    } catch {
      // Ignore kill error on socket close
    }
  });
}

module.exports = {
  handleStreamRequest,
  handleStreamHealth,
  handleStreamUpload,
  handleMediaInfo,
  handleSubtitleExtract,
};
