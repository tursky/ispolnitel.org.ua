/**
 * https://www.npmjs.com/package/html-minifier-terser
 * https://www.npmjs.com/package/terser
 * https://www.npmjs.com/package/postcss
 */

'use strict';

const HTMLTerser = require('html-minifier-terser');
const Terser = require('terser');
const postcss = require('postcss');
const cssnano = require('cssnano');
const path = require('path');
const fs = require('fs');

const CONFIGURATIONS = {
  ROOT: 'application/static',
  IGNORE: 'bundles',
  OPTIONS: {
    JS: { compress: false },
    HTML: { collapseWhitespace: true, removeComments: true },
    CSS: [cssnano],
  },
};

const SCHEMA = {
  '.js': (file, options) => handleJS(file, options),
  '.html': (file, options) => handleHTML(file, options),
  '.css': (file, options) => handleCSS(file, options),
};

const handleCSS = (file, options) => {
  const [...plugins] = options;
  new Promise(() => {
    fs.readFile(file, (err, css) => {
      if (err) throw err;
      postcss(plugins)
        .process(css, {
          from: file,
          to: file,
        })
        .then((result) => {
          fs.writeFile(file, result.css, (e) => {
            if (e) throw e;
            output(file);
          });
        });
    });
  });
};

const handleJS = (file, options) => {
  new Promise(() => {
    Terser.minify(fs.readFileSync(file, 'utf8'), options).then((processed) => {
      fs.writeFile(file, processed.code, (e) => {
        if (e) throw e;
        output(file);
      });
    });
  });
};

const handleHTML = (file, options) => {
  new Promise(() => {
    HTMLTerser.minify(fs.readFileSync(file, 'utf8'), options).then(
      (processed) => {
        fs.writeFile(file, processed, (e) => {
          if (e) throw e;
          output(file);
        });
      }
    );
  });
};

const output = (handled) => console.log(`✅ ${handled}`);

const pathfinder = (directory, exception, metadata) => {
  const isExist = check(directory);
  if (!isExist) return 0;
  const files = fs.readdirSync(directory);
  for (let i = 0; i < files.length; i++) {
    const pathname = path.join(directory, files[i]);
    const status = fs.lstatSync(pathname);
    if (status.isDirectory()) pathfinder(pathname, exception, metadata);
    if (pathname.includes(exception)) continue;
    processing(pathname, metadata);
  }
};

const check = (path) => {
  const result = fs.existsSync(path);
  if (result === false) console.log(`❗️ Path "${path}" not found! \n`);
  return result;
};

const processing = (filepath, metadata) => {
  const ext = path.extname(filepath);
  const scenario = SCHEMA[ext];
  const format = ext.slice(1).toUpperCase();
  const instruction = metadata[format];
  handler(filepath, scenario, instruction);
};

const handler = (file, intention, options) => {
  const type = typeof intention;
  if (type === 'function') {
    const serializer = TYPES[type];
    serializer([intention, file, options], (intention) =>
      handler(file, intention, options)
    );
  }
};

const TYPES = {
  object: ([obj], callback) => callback(JSON.stringify(obj)),
  undefined: (callback) => callback('not found'),
  function: ([fn, filepath, options], callback) =>
    callback(JSON.stringify(fn(filepath, options))),
};

const start = () => {
  const title = 'FRONTEND OPTIMIZING...';
  process.stdout.write('\x1Bc');
  console.log('\x1b[1;33m');
  console.log(title);
  console.log('\x1b[0m');
};

const { ROOT, IGNORE, OPTIONS } = CONFIGURATIONS;

start();
pathfinder(ROOT, IGNORE, OPTIONS);
