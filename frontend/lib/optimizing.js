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
  const err = `❗️ Path "${path}" not found! \n`;
  if (result === false) console.log(err);
  return result;
};

const processing = (filepath, metadata) => {
  const ext = path.extname(filepath);
  const scenario = SCHEMA[ext];
  const format = ext.slice(1).toUpperCase();
  const options = metadata[format];
  handler(filepath, scenario, options);
};

const handler = (file, scenario, options) => {
  const type = typeof scenario;
  if (type === 'function') {
    const serializer = TYPES[type];
    serializer([scenario, file, options], (scenario) =>
      handler(file, scenario, options)
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
  process.stdout.write('\x1Bc');
  console.log('\x1b[1;33m');
  console.log('FRONTEND OPTIMIZING...');
  console.log('\x1b[0m');
};

const { ROOT, IGNORE, OPTIONS } = CONFIGURATIONS;

start();
pathfinder(ROOT, IGNORE, OPTIONS);
