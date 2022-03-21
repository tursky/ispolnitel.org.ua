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

 const getConsoleRenderPreferences = () => ({
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
     black: '\x1b[40m',
     red: '\x1b[41m',
     green: '\x1b[42m',
     yellow: '\x1b[43m',
     blue: '\x1b[44m',
     magenta: '\x1b[45m',
     cyan: '\x1b[46m',
     white: '\x1b[47m',
   },

   text: {
     boldfont: '\x1b[1m',
     hidden: '\x1b[8m',
     underline: '\x1b[4m',
     dim: '\x1b[2m',
     blink: '\x1b[5m',
     reverse: '\x1b[7m',
   },

   fn: {
     draw: (string) => string,
     newline: (n) => '\n'.repeat(n),
     space: (n) => ' '.repeat(n),
   },
 });

 const start = (app, cli = getConsoleRenderPreferences()) => {
   render(
     preprint([
       cli.display.clear,
       cli.text.boldfont,
       cli.color.white,
       cli.background.blue,
       cli.fn.draw(cli.fn.space(5) + cli.fn.space(app.length) + cli.fn.space(5)),
       cli.fn.newline(1),
       cli.fn.space(5),
       app,
       cli.fn.space(5),
       cli.fn.newline(1),
       cli.fn.draw(cli.fn.space(5) + cli.fn.space(app.length) + cli.fn.space(5)),
       cli.fn.newline(3),
       cli.display.reset,
     ])
   );
 };

 const output = (
   file,
   handled = '[ok]',
   cli = getConsoleRenderPreferences()
 ) => {
   render(
     preprint([
       cli.color.cyan,
       handled,
       cli.color.blue,
       cli.text.dim,
       cli.fn.draw(' - '),
       cli.display.reset,
       cli.color.blue,
       file,
       cli.fn.newline(1),
       cli.display.reset,
     ])
   );
 };

 const handleError = (
   file,
   err,
   unhandled = '[ok]',
   cli = getConsoleRenderPreferences()
 ) => {
   render(
     preprint([
       cli.color.red,
       unhandled,
       cli.color.blue,
       cli.text.dim,
       cli.fn.draw(' - '),
       cli.display.reset,
       cli.color.blue,
       file,
       cli.fn.newline(2),
       cli.color.red,
       err.stack,
       cli.fn.newline(2),
       cli.display.reset,
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

 const getDirectoryContent = (directory) => fs.readdirSync(directory);
 const getSourceDetails = (source) => fs.lstatSync(source);

 const isExclusionExists = (path, filter) =>
   filter.find((exclusion) => path.includes(exclusion));

 const pathfinder = (root, ignore, metadata) => {
   const src = getDirectoryContent(root);
   for (let i = 0; i < src.length; i++) {
     let source = src[i];
     const pathname = path.join(root, source);
     source = getSourceDetails(pathname);
     if (source.isDirectory()) {
       pathfinder(pathname, ignore, metadata);
       continue;
     }
     if (isExclusionExists(pathname, ignore)) continue;
     preprocess(pathname, metadata);
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
   Object.defineProperty(obj, field, { value: data });
 };

 const getExitInformation = (
   obj = EXIT,
   field = 'INFO',
   response = obj.hasOwnProperty.call(obj, field)
     ? obj[field]
     : 'Data is missing...'
 ) => response;

 const verifyDirExists = (path) => fs.existsSync(path);

 const main = (settings) => {
   const { ROOT, IGNORE, OPTIONS } = settings;
   start(application);
   if (verifyDirExists(ROOT) === false) {
     const data = `Target directory not found! Path incorrect: ${ROOT}`;
     saveExitInformation(data);
     return EXIT.FAILURE;
   }
   pathfinder(ROOT, IGNORE, OPTIONS);
   return EXIT.SUCCESS;
 };

 const reportFailure = (
   info,
   warning = 'Failure',
   cli = getConsoleRenderPreferences()
 ) => {
   render(
     preprint([
       cli.text.boldfont,
       cli.color.blue,
       cli.fn.draw('- '),
       warning,
       cli.fn.draw('❗️'),
       cli.fn.newline(1),
       cli.fn.draw('- '),
       info,
       cli.fn.newline(3),
       cli.display.reset,
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
