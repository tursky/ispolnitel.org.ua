// https://www.npmjs.com/package/terser

'use strict';

const { minify } = require('terser');
const path = require('path');
const fs = require('fs');

console.log('\n-- Optimizing JS --\n');

const source = {
  path: 'application/static/assets/js',
  ext: '.js',
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

function minifyScenario(filename, options = { compress: false }) {
  new Promise(() => {
    minify(fs.readFileSync(filename, 'utf8'), options)
      .then((minified) => {
        fs.writeFile(filename, minified.code, (e) => {
          if (e) throw e;
          console.log('-- minified: ', filename);
        });
      })
      .catch((err) => console.log(err));
  });
}
