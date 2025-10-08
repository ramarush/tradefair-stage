module.exports = {
    apps: [{
      name: 'tradefair',
      script: 'node_modules/.bin/next',
      args: 'start -p 3000',
      cwd: '/root/tradefair',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PATH: '/root/.nvm/versions/node/v22.19.0/bin:/usr/bin:/bin'
      },
      // Using default PM2 logs location: ~/.pm2/logs/
      // error_file: './logs/err.log',
      // out_file: './logs/out.log',
      // log_file: './logs/combined.log',
      time: true
    }]
  };