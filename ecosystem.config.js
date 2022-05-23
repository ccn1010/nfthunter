module.exports = {
  apps: [
    {
      name: 'nft-hunter',
      script: './dist/main.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        PORT: 3002,
      },
    },
  ],
};
