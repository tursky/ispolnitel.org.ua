'use strict';

const http = require('http');

// Code

const HOST = 'localhost';
const PORT = 3000;

http
  .createServer((req, res) => res.end(`<h1>Node.js server is running...</h1>`))
  .listen(PORT, HOST, () => console.log(`http://${HOST}:${PORT}`));
