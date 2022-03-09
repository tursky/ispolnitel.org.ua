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

 const config = {
   ROOT: 'application/static',
   IGNORE: 'bundles',
 };

 const options = {
   JS: { compress: false },
   CSS: [cssnano],
   HTML: { collapseWhitespace: true, removeComments: true },
 };

 const schema = {
   '.css': (file) => handleCSS(file, options.CSS),
   '.js': (file) => handleJS(file, options.JS),
   '.html': (file) => handleHTML(file, options.HTML),
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
             printHandlered(file);
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
         printHandlered(file);
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
           printHandlered(file);
         });
       }
     );
   });
 };

 const check = (directory) => {
   const result = fs.existsSync(directory);
   if (result === false) console.table([{ ERROR: `${directory} not found!` }]);
   return result;
 };

 const pathfinder = (dir, exception) => {
   const isExist = check(dir);
   if (!isExist) return 0;

   const files = fs.readdirSync(dir);

   for (let i = 0; i < files.length; i++) {
     const pathname = path.join(dir, files[i]);
     const status = fs.lstatSync(pathname);
     if (status.isDirectory()) pathfinder(pathname, exception);
     if (pathname.includes(exception)) continue;
     handler(pathname);
   }
 };

 const handler = (file) => {
   const ext = path.extname(file);
   const scenario = schema[ext];
   processing(file, scenario);
 };

 const processing = (filepath, handler) => {
   const type = typeof handler;
   if (type === 'function') {
     const serializer = types[type];
     serializer([handler, filepath], (handler) => processing(filepath, handler));
   }
 };

 const types = {
   object: ([todo], callback) => callback(JSON.stringify(todo)),
   undefined: (callback) => callback('not found'),
   function: ([fn, filepath], callback) =>
     callback(JSON.stringify(fn(filepath))),
 };

 const printHandlered = (file) => console.log(`✅ ${file}`);

 const ROOT = config.ROOT;
 const IGNORE = config.IGNORE;

 process.stdout.write('\x1Bc');
 console.log('\x1b[1;33m' + 'FRONTEND OPTIMIZING...' + '\x1b[0m' + '\n');

 pathfinder(ROOT, IGNORE);
