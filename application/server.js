'use strict';

const http = require('http');

// Code

const PORT = 3000;

http
  .createServer((req, res) => res.end(`<h1>Node.js server is running...</h1>`))
  .listen(PORT, () => console.log(`http://localhost:${PORT}`));
