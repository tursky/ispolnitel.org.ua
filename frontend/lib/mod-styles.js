// https://www.npmjs.com/package/postcss

'use strict';

const postcss = require('postcss');
const cssnano = require('cssnano');
const path = require('path');
const fs = require('fs');

console.log('\n-- Optimizing CSS --\n');

const source = {
  path: 'application/static/assets/css',
  ext: '.css',
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

function minifyScenario(filename) {
  new Promise(() => {
    fs.readFile(filename, (err, css) => {
      if (err) throw err;
      postcss([cssnano])
        .process(css, {
          from: filename,
          to: filename,
        })
        .then((result) => {
          fs.writeFile(filename, result.css, (e) => {
            if (e) throw e;
            console.log('-- minified: ', filename);
          });
        })
        .catch((err) => console.log(err));
    });
  });
}
