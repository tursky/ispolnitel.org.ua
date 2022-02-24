// https://www.npmjs.com/package/html-minifier-terser

'use strict';

const { minify } = require('html-minifier-terser');
const path = require('path');
const fs = require('fs');

console.log('\n-- Optimizing HTML --\n');

const source = {
  path: 'application/static',
  ext: '.html',
};

fromDir(source.path, source.ext);

async function fromDir(source, extname) {
  if (!fs.existsSync(source)) {
    console.log(`The path "${source}" is not found.\n`);
    return 0;
  }

  const files = fs.readdirSync(source);
  const filter = extname;

  for (let i = 0; i < files.length; i++) {
    const filename = path.join(source, files[i]);
    const status = fs.lstatSync(filename);

    if (status.isDirectory()) {
      fromDir(filename, filter);
    } else if (filename.indexOf(filter) >= 0) {
      minifyScenario(filename);
    }
  }
}

function minifyScenario(
  filename,
  options = { collapseWhitespace: true, removeComments: true }
) {
  new Promise(() => {
    minify(fs.readFileSync(filename, 'utf8'), options)
      .then((minified) => {
        fs.writeFile(filename, minified, (e) => {
          if (e) throw e;
          console.log('-- minified: ', filename);
        });
      })
      .catch((err) => console.log(err));
  });
}
