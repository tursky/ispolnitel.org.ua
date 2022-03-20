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

const render = (string) => process.stdout.write(string);
const preprint = (array) => array.join('');

const start = () => {
  const console = {
    title: 'START FRONTEND OPTIMIZER',
    titleColor: '\x1b[37m',
    titleBg: '\x1b[44m',
    resetColor: '\x1b[0m',
    clear: '\x1Bc',
    indent: '\n\n\n',
    tab: '   ',
  };
  process.stdout.write(
    console.clear +
      console.titleColor +
      console.titleBg +
      console.tab +
      console.title +
      console.tab +
      console.indent +
      console.resetColor
  );
};

const output = (handled) => {
  const console = {
    file: handled,
    success: '[ok]',
    successColor: '\x1b[34m',
    fileColor: '\x1b[36m',
    colorReset: '\x1b[0m',
    tab: ' ',
    newline: '\n',
  };
  process.stdout.write(
    console.successColor +
      console.success +
      console.tab +
      console.fileColor +
      console.file +
      console.newline +
      console.colorReset
  );
};

const handleError = (f, e) => {
  const console = {
    title: 'PROCESS FAILED',
    file: f,
    error: e.stack,
    errorColor: '\x1b[31m',
    titleColor: '\x1b[37m',
    titleBg: '\x1b[41m',
    fileColor: '\x1b[1;37m',
    resetColor: '\x1b[0m',
    indent: '\n\n',
    tab: '   ',
  };
  process.stdout.write(
    console.indent +
      console.titleColor +
      console.titleBg +
      console.tab +
      console.title +
      console.tab +
      console.resetColor +
      console.indent +
      console.tab +
      console.fileColor +
      console.file +
      console.resetColor +
      console.indent +
      console.errorColor +
      console.error +
      console.indent +
      console.resetColor
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

const pathfinder = (root, exceptions, metadata) => {
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

const EXIT = {
  SUCCESS: true,
  FAILURE: false,
};

const saveExitInformation = (
  data = 'NO TERMINATE INFO',
  obj = EXIT,
  field = 'INFO'
) => {
  Object.defineProperty(obj, field, { value: data });
};

const getExitInformation = (
  obj = EXIT,
  field = 'INFO',
  response = obj.hasOwnProperty.call(field) ? obj[field] : 'NO TERMINATE INFO'
) => response;

const verifyDirExists = (path) => fs.existsSync(path);

const main = (settings) => {
  const { ROOT, IGNORE, OPTIONS } = settings;
  start();
  if (verifyDirExists(ROOT) === false) {
    const info = `Path '${ROOT}' not found!`;
    saveExitInformation(info);
    return EXIT.FAILURE;
  }
  pathfinder(ROOT, IGNORE, OPTIONS);
  return EXIT.SUCCESS;
};

const reportFailure = (data) => {
  const console = {
    icon: '❗️',
    content: data,
    contentColor: '\x1b[1;37m',
    resetColor: '\x1b[0m',
    indent: '\n\n',
    tab: '  ',
  };
  process.stdout.write(
    console.icon +
      console.tab +
      console.contentColor +
      console.content +
      console.indent +
      console.resetColor
  );
};

// Start process
const fn = main(CONFIGURATIONS);

if (fn === EXIT.FAILURE) {
  const info = getExitInformation();
  reportFailure(info);
  process.exit();
}
