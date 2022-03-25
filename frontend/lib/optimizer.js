/**
 * https://www.npmjs.com/package/html-minifier-terser
 * https://www.npmjs.com/package/terser
 * https://www.npmjs.com/package/postcss
 */

'use strict';

const HTMLTerser = require('html-minifier-terser');
const Terser = require('terser');
const postcss = require('postcss');
const path = require('path');
const fs = require('fs');
const { UITypography, render, preprint } = require('./ui');

const CONFIGURATIONS = {
  ROOT: 'application/static',
  OPTIONS: {
    JS: { compress: false },
    HTML: { collapseWhitespace: true, removeComments: true },
    CSS: ['cssnano'],
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

const start = (app, cli = UITypography) => {
  render(
    preprint(
      cli.display.clear,
      cli.text.boldfont,
      cli.color.white,
      cli.background.blue,
      cli.fn.draw(cli.fn.space(5) + cli.fn.space(app.length) + cli.fn.space(5)),
      cli.fn.newline(1),
      cli.fn.draw(cli.fn.space(5) + app + cli.fn.space(5)),
      cli.fn.newline(1),
      cli.fn.draw(cli.fn.space(5) + cli.fn.space(app.length) + cli.fn.space(5)),
      cli.fn.newline(3),
      cli.display.reset
    )
  );
};

const reportSuccess = (file, cli = UITypography) => {
  render(
    preprint(
      cli.color.cyan,
      cli.fn.draw('[ok]'),
      cli.color.blue,
      cli.text.dim,
      cli.fn.draw(' - '),
      cli.display.reset,
      cli.color.blue,
      cli.fn.draw(file),
      cli.fn.newline(1),
      cli.display.reset
    )
  );
};

const reportFailure = (data, cli = UITypography) => {
  render(
    preprint(
      cli.color.blue,
      cli.fn.draw('- Failure❗️'),
      cli.fn.newline(1),
      cli.fn.draw(`- ${data}`),
      cli.fn.newline(1),
      cli.fn.draw('- Process end...'),
      cli.fn.newline(2),
      cli.display.reset
    )
  );
};

const reportError = (file, err, cli = UITypography) => {
  render(
    preprint(
      cli.color.red,
      cli.fn.draw('[ok]'),
      cli.color.blue,
      cli.text.dim,
      cli.fn.draw(' - '),
      cli.display.reset,
      cli.color.blue,
      cli.fn.draw(file),
      cli.fn.newline(2),
      cli.color.red,
      cli.fn.draw(err.stack),
      cli.fn.newline(2),
      cli.display.reset
    )
  );
  process.exit();
};

const readFile = (filepath) =>
  new Promise((res, rej) =>
    fs.readFile(filepath, 'utf8', (err, buffer) =>
      err ? rej(err) : res(buffer)
    )
  );

const writeFile = (filepath, data) =>
  new Promise((res, rej) =>
    fs.writeFile(filepath, data, (err) =>
      err ? rej(err) : res('Successfully!')
    )
  );

const handleCSS = async (file, options) => {
  try {
    const dependencies = {
      cssnano: require('cssnano'),
    };
    const plugins = options.map((plugin) => dependencies[plugin]);
    const content = await readFile(file);
    const processed = await postcss(plugins).process(content, {
      from: file,
      to: file,
    });
    await writeFile(file, processed.css);
  } catch (err) {
    reportError(file, err);
  }
  reportSuccess(file);
};

const handleJS = async (file, options) => {
  try {
    const content = await readFile(file);
    const processed = await Terser.minify(content, options);
    await writeFile(file, processed.code);
  } catch (err) {
    reportError(file, err);
  }
  reportSuccess(file);
};

const handleHTML = async (file, options) => {
  try {
    const content = await readFile(file);
    const processed = await HTMLTerser.minify(content, options);
    await writeFile(file, processed);
  } catch (err) {
    reportError(file, err);
  }
  reportSuccess(file);
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

const readDirectoryContent = async (path) =>
  await new Promise((res, rej) =>
    fs.readdir(path, async (err, data) => (err ? rej(err) : res(data)))
  );

const readSourceDetails = async (path) =>
  await new Promise((res, rej) =>
    fs.lstat(path, (err, data) => (err ? rej(err) : res(data)))
  );

const getDirectoryContent = (directory) => fs.readdirSync(directory);
const getSourceDetails = (source) => fs.lstatSync(source);

const verifySourceExclusion = (path, filter) =>
  filter.find((exclusion) => path.includes(exclusion));

const pathfinder = async (root, exclusions, metadata) => {
  const src = await readDirectoryContent(root);
  for (let source of src) {
    const sourcepath = path.join(root, source);
    if (verifySourceExclusion(sourcepath, exclusions)) continue;
    source = await readSourceDetails(sourcepath);
    if (source.isFile()) {
      preprocess(sourcepath, metadata);
      continue;
    }
    pathfinder(sourcepath, exclusions, metadata);
  }
};

const EXIT = {
  SUCCESS: true,
  FAILURE: false,
};

const saveExitInformation = (
  data = 'Exit info is missing...',
  obj = EXIT,
  field = 'INFO'
) => {
  Reflect.set(obj, field, data);
};

const getExitInformation = (
  obj = EXIT,
  field = 'INFO',
  response = Reflect.has(obj, field) ? obj[field] : 'Data is missing...'
) => response;

const verifyDirExists = (path) => fs.existsSync(path);

const main = (...args) => {
  const [root, ignore, options] = args;
  start(application);
  if (verifyDirExists(root) === false) {
    const data = `Target directory not found! Path incorrect: ${root}`;
    saveExitInformation(data);
    return EXIT.FAILURE;
  }
  pathfinder(root, ignore, options);
  return EXIT.SUCCESS;
};

const run = (args = CONFIGURATIONS) => {
  const outcome = main(args.ROOT, args.IGNORE, args.OPTIONS);
  if (outcome === EXIT.FAILURE) {
    const info = getExitInformation();
    reportFailure(info);
  }
  return outcome;
};

run();
