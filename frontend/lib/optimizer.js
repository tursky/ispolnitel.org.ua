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
};

const start = () => {
  const console = {
    title: 'START FRONTEND OPTIMIZER',
    color: '\x1b[37m',
    bg: '\x1b[41m',
    reset: '\x1b[0m',
    clear: '\x1Bc',
    indent: '\n\n\n',
    empty: '   ',
  };
  process.stdout.write(
    console.clear +
      console.color +
      console.bg +
      console.empty +
      console.title +
      console.empty +
      console.indent +
      console.reset
  );
};

const output = (handled) => {
  const console = {
    file: handled,
    success: '[ok]',
    successColor: '\x1b[36m',
    fileColor: '\x1b[32m',
    colorReset: '\x1b[0m',
    empty: ' ',
    newline: '\n',
  };
  process.stdout.write(
    console.successColor +
      console.success +
      console.empty +
      console.fileColor +
      console.file +
      console.newline +
      console.colorReset
  );
};

const handleError = (f, e) => {
  const console = {
    message: 'PROCESS FAILED: ' + f,
    error: e.stack,
    red: '\x1b[31m',
    reset: '\x1b[0m',
    indent: '\n\n',
  };
  process.stdout.write(
    console.indent +
      console.message +
      console.indent +
      console.red +
      console.error +
      console.reset +
      console.indent
  );
  process.exit();
};

const handleCSS = async (file, config) => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const plugins = [...config];
    const processed = await postcss(plugins).process(content, {
      from: file,
      to: file,
    });
    fs.writeFileSync(file, processed.css);
  } catch (err) {
    handleError(file, err);
  }
  output(file);
};

const handleJS = async (file, config) => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const options = { ...config };
    const processed = await Terser.minify(content, options);
    fs.writeFileSync(file, processed.code);
  } catch (err) {
    handleError(file, err);
  }
  output(file);
};

const handleHTML = async (file, config) => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const options = { ...config };
    const processed = await HTMLTerser.minify(content, options);
    fs.writeFileSync(file, processed);
  } catch (err) {
    handleError(file, err);
  }
  output(file);
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

const preprocess = (filepath, metadata) => {
  const ext = path.extname(filepath);
  const scenario = schema[ext];
  const format = ext.slice(1).toUpperCase();
  const instruction = metadata[format];
  handler(filepath, scenario, instruction);
};

const checkExceptionExists = (path, filter) =>
  filter.find((exception) => path.includes(exception));

const checkDirectoryExists = (path) => {
  const check = fs.existsSync(path);
  if (check === false) {
    console.log(`❗️ Path "${path}" not found! \n`);
  }
  return check;
};

const pathfinder = (root, exceptions, metadata) => {
  if (checkDirectoryExists(root) === false) return 0;
  const source = fs.readdirSync(root);
  for (let i = 0; i < source.length; i++) {
    const pathname = path.join(root, source[i]);
    const status = fs.lstatSync(pathname);
    if (status.isDirectory()) {
      pathfinder(pathname, exceptions, metadata);
      continue;
    }
    if (checkExceptionExists(pathname, exceptions)) continue;
    preprocess(pathname, metadata);
  }
};

function main(args) {
  const { ROOT, IGNORE, OPTIONS, STDOUT } = args;
  start(STDOUT);
  pathfinder(ROOT, IGNORE, OPTIONS);
}

// Start programm
main(CONFIGURATIONS);
