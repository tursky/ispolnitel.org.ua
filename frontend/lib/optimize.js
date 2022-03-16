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
  OPTIONS: {
    JS: { compress: false },
    HTML: { collapseWhitespace: true, removeComments: true },
    CSS: [cssnano],
  },
  IGNORE: [
    'bundles',
    'images',
    'webfonts',
    'docs',
    'robots.txt',
    'sitemap.xml',
    'mail.php',
    'libs.zip',
  ],
  STDOUT: {
    text: 'FRONTEND OPTIMIZING',
    color: '\x1b[1;33m',
    newline: '\n\n',
    normal: '\x1b[0m',
    clear: '\x1Bc',
  },
};

const start = (console) =>
  process.stdout.write(
    console.clear +
      console.color +
      console.text +
      console.newline +
      console.normal
  );

const output = (handled) => console.log(`✅ ${handled}`);

const handleCSS = (file, options) => {
  new Promise(() => {
    fs.readFile(file, (err, css) => {
      if (err) throw err;
      postcss(options)
        .process(css, {
          from: file,
          to: file,
        })
        .then((result) => {
          fs.writeFile(file, result.css, (err) => {
            if (err) throw err;
          });
          output(file);
        });
    });
  });
};

const handleJS = (file, options) => {
  new Promise(() => {
    Terser.minify(fs.readFileSync(file, 'utf8'), options).then((processed) => {
      fs.writeFile(file, processed.code, (err) => {
        if (err) throw err;
      });
      output(file);
    });
  });
};

const handleHTML = (file, options) => {
  new Promise(() => {
    HTMLTerser.minify(fs.readFileSync(file, 'utf8'), options).then(
      (processed) => {
        fs.writeFile(file, processed, (err) => {
          if (err) throw err;
        });
        output(file);
      }
    );
  });
};

const schema = {
  '.js': (file, options) => handleJS(file, options),
  '.html': (file, options) => handleHTML(file, options),
  '.css': (file, options) => handleCSS(file, options),
};

const types = {
  object: ([obj], callback) => callback(JSON.stringify(obj)),
  undefined: (callback) => callback('not found'),
  function: ([fn, filepath, options], callback) =>
    callback(JSON.stringify(fn(filepath, options))),
};

const handler = (file, intention, options) => {
  const type = typeof intention;
  if (type === 'function') {
    const serializer = types[type];
    serializer([intention, file, options], (intention) =>
      handler(file, intention, options)
    );
  }
};

const processing = (filepath, metadata) => {
  const ext = path.extname(filepath);
  const scenario = schema[ext];
  const format = ext.slice(1).toUpperCase();
  const instruction = metadata[format];
  handler(filepath, scenario, instruction);
};

const pathcheck = (dir) => {
  if (fs.existsSync(dir)) return true;
  console.log(`❗️ Path "${dir}" not found! \n`);
  return false;
};

const pathignore = (path, filter) =>
  filter.find((exception) => path.includes(exception));

const pathfinder = (root, exceptions, metadata) => {
  const isExist = pathcheck(root);
  if (!isExist) return 0;
  const source = fs.readdirSync(root);
  for (let i = 0; i < source.length; i++) {
    const pathname = path.join(root, source[i]);
    const status = fs.lstatSync(pathname);
    if (status.isDirectory()) {
      pathfinder(pathname, exceptions, metadata);
      continue;
    }
    const isException = pathignore(pathname, exceptions);
    if (isException) continue;
    processing(pathname, metadata);
  }
};

const { ROOT, IGNORE, OPTIONS, STDOUT } = CONFIGURATIONS;

start(STDOUT);
pathfinder(ROOT, IGNORE, OPTIONS);
