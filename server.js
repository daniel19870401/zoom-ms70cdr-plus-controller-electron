const express = require('express');
const path = require('path');

function startServer() {
  const app = express();
  const root = __dirname;

  app.use(express.static(root, { index: 'index.html' }));

  return new Promise((resolve, reject) => {
    const server = app
      .listen(0, '127.0.0.1', () => {
        const address = server.address();
        resolve({ server, port: address.port });
      })
      .on('error', reject);
  });
}

module.exports = { startServer };
