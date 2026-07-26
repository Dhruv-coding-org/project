const fs = require('fs');
const path = require('path');

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
  const range = req.headers.range;

  // Enable CORS for stream requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

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
