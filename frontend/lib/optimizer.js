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

const application = 'FRONTEND OPTIMIZER';

const render = (string) => process.stdout.write(string);
const preprint = (array) => array.join('');

const getConsoleRenderSettings = () => ({

  display: {
		clear: '\x1Bc',
		reset: '\x1b[0m',
	},

	color: {
		black: '\x1b[30m',
		red: '\x1b[31m',
		green: '\x1b[32m',
		yellow: '\x1b[33m',
		blue: '\x1b[34m',
		magenta: '\x1b[35m',
		cyan: '\x1b[36m',
		white: '\x1b[37m',
	},

	background: {
		blackBG: '\x1b[40m',
		redBG: '\x1b[41m',
		greenBG: '\x1b[42m',
		yellowBG: '\x1b[43m',
		blueBG: '\x1b[44m',
		magentaBG: '\x1b[45m',
		cyanBG: '\x1b[46m',
		whiteBG: '\x1b[47m',
	},

	text: {
		boldfont: '\x1b[1m',
		hidden: '\x1b[8m',
		underline: '\x1b[4m',
		dim: '\x1b[2m',
		blink: '\x1b[5m',
		reverse: '\x1b[7m',
	},

	fn: {},

  /**
   * CONSOLE TYPOGRAPHY
   */
  clear: '\x1Bc',
  reset: '\x1b[0m',
  boldfont: '\x1b[1m',
  hidden: '\x1b[8m',
  underline: '\x1b[4m',
  dim: '\x1b[2m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',

  /**
   * CONSOLE COLORS
   */
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',

  /**
   * CONSOLE BACKGROUNDS
   */
  blackBG: '\x1b[40m',
  redBG: '\x1b[41m',
  greenBG: '\x1b[42m',
  yellowBG: '\x1b[43m',
  blueBG: '\x1b[44m',
  magentaBG: '\x1b[45m',
  cyanBG: '\x1b[46m',
  whiteBG: '\x1b[47m',

  /**
   * CONSOLE FUNCTIONALITY
   */
  draw: (symbol) => symbol,
  newline: (n = 1, str = '\n') => str.repeat(n),
  space: (n = 1, str = ' ') => str.repeat(n),
});

const start = (app, stdout = getConsoleRenderSettings()) => {
  render(
    preprint([
      stdout.clear,
      stdout.white,
      stdout.boldfont,
      stdout.blueBG,
      stdout.space(3),
      app,
      stdout.space(3),
      stdout.newline(3),
      stdout.reset,
    ])
  );
};

const output = (
  file,
  handled = '[ok]',
  stdout = getConsoleRenderSettings()
) => {
  render(
    preprint([
      stdout.green,
      handled,
      stdout.dim,
      stdout.draw(' - '),
      stdout.reset,
      stdout.white,
      stdout.boldfont,
      file,
      stdout.newline(1),
      stdout.reset,
    ])
  );
};

const handleError = (
  file,
  err,
  unhandled = '[ok]',
  stdout = getConsoleRenderSettings()
) => {
  render(
    preprint([
      stdout.red,
      unhandled,
      stdout.dim,
      stdout.draw(' - '),
      stdout.reset,
      stdout.white,
      stdout.boldfont,
      file,
      stdout.reset,
      stdout.newline(2),
      stdout.red,
      err.stack,
      stdout.newline(2),
      stdout.reset,
    ])
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
  data = 'Something went wrong! There is no exit data.',
  obj = EXIT,
  field = 'INFO'
) => {
  Object.defineProperty(obj, field, { value: data });
};

const getExitInformation = (
  obj = EXIT,
  field = 'INFO',
  response = obj.hasOwnProperty.call(obj, field)
    ? obj[field]
    : 'Sorry, there is no exit info!'
) => response;

const verifyDirExists = (path) => fs.existsSync(path);

const main = (settings) => {
  const { ROOT, IGNORE, OPTIONS } = settings;
  start(application);
  if (verifyDirExists(ROOT) === false) {
    const data = `Destination directory not found! Incorrect path: ${ROOT}`;
    saveExitInformation(data);
    return EXIT.FAILURE;
  }
  pathfinder(ROOT, IGNORE, OPTIONS);
  return EXIT.SUCCESS;
};

const reportFailure = (
  info,
  warning = 'Failure',
  stdout = getConsoleRenderSettings()
) => {
  render(
    preprint([
      stdout.yellow,
      stdout.boldfont,
      warning,
      stdout.draw(': '),
      stdout.reset,
      stdout.white,
      stdout.boldfont,
      info,
      stdout.newline(3),
      stdout.reset,
    ])
  );
};

// Start process
const fn = main(CONFIGURATIONS);

if (fn === EXIT.FAILURE) {
  const info = getExitInformation();
  reportFailure(info);
  process.exit();
}
