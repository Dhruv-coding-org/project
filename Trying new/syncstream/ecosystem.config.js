module.exports = {
  apps: [
    {
      name: 'syncstream-server',
      script: './server/server.js',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      time: true
    }
  ]
};
