'use strict';

/**
 * DEPENDENCIES */

const path = require('path');
const fs = require('fs');

/**
 * 3rd-party software components */

const VENDOR = {
  JSTerser: require('terser'),
  HTMLTerser: require('html-minifier-terser'),
  PostCSS: require('postcss'),
  cssnano: require('cssnano'),

  // https://www.npmjs.com/package/html-minifier-terser

  componentHTMLTerser(
    src,
    config,
    html = async (result = this.HTMLTerser.minify(src, config)) => await result
  ) {
    return html();
  },

  // https://www.npmjs.com/package/terser

  componentJSTerser(
    src,
    config,
    js = async (result = this.JSTerser.minify(src, config)) => {
      const processed = await result;
      return processed.code;
    }
  ) {
    return js();
  },

  // https://www.npmjs.com/package/postcss
  // https://www.npmjs.com/package/cssnano

  componentPostCSS(
    src,
    config,
    plugins = () => {
      const deps = { cssnano: this.cssnano };
      return config.map((plugin) => deps[plugin]);
    },
    css = async (
      result = this.PostCSS(plugins()).process(src, {
        from: src,
        to: src,
      })
    ) => {
      const processed = await result;
      return processed.css;
    }
  ) {
    return css();
  },
};

/**
 * CONFIG */

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
    '.xml',
    '.php',
    'libs.zip',
  ],
};

const application = 'FRONTEND WORKER';

/**
 * CONSOLE UI */

const render = (output) => process.stdout.write(output);
const preprint = (...array) => array.join('');

const UITypography = {
  text: {
    boldfont: '\x1b[1m',
    hidden: '\x1b[8m',
    underline: '\x1b[4m',
    dim: '\x1b[2m',
    blink: '\x1b[5m',
    reverse: '\x1b[7m',
  },

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

  fn: {
    draw: (struct) => struct,
    newline: (n) => '\n'.repeat(n),
    space: (n) => ' '.repeat(n),
  },
};

/**
 * OUTPUT */

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
      cli.fn.draw('- Work completed...'),
      cli.fn.newline(1),
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
};

const reportSpentTime = (timer, cli = UITypography) => {
  render(
    preprint(
      cli.fn.newline(1),
      cli.color.cyan,
      cli.fn.draw(`Time spent: ${new Date() - timer} ms`),
      cli.fn.newline(2),
      cli.display.reset
    )
  );
};

/**
 * BUSINESS LOGIC */

const readFile = (filepath) =>
  new Promise((resolve, reject) => {
    fs.readFile(filepath, 'utf8', (error, buffer) => {
      error ? reject(error) : resolve(buffer);
    });
  });

const writeFile = (filepath, data) =>
  new Promise((resolve, reject) => {
    fs.writeFile(filepath, data, (error) => {
      error ? reject(error) : resolve('Successfully!');
    });
  });

const handleCSS = async (file, options) => {
  try {
    const code = await readFile(file);
    const processed = await VENDOR.componentPostCSS(code, options);
    await writeFile(file, processed);
  } catch (err) {
    reportError(file, err);
  }
  reportSuccess(file);
};

const handleJS = async (file, options) => {
  try {
    const code = await readFile(file);
    const processed = await VENDOR.componentJSTerser(code, options);
    await writeFile(file, processed);
  } catch (err) {
    reportError(file, err);
  }
  reportSuccess(file);
};

const handleHTML = async (file, options) => {
  try {
    const code = await readFile(file);
    const processed = await VENDOR.componentHTMLTerser(code, options);
    await writeFile(file, processed);
  } catch (err) {
    reportError(file, err);
  }
  reportSuccess(file);
};

const metacomponent = async (file, options, process) => {
  try {
    const code = await readFile(file);
    const processed = await process(code, options);
    await writeFile(file, processed);
  } catch (err) {
    reportError(file, err);
  }
  reportSuccess(file);
};

/**
 * MAIN */

const metaprocess = {
  1: (data, metadata) => VENDOR.componentJSTerser(data, metadata),
  2: (data, metadata) => VENDOR.componentHTMLTerser(data, metadata),
  3: (data, metadata) => VENDOR.componentPostCSS(data, metadata),
};

const metaschema = {
  λ: (x, y) => metaprocess[1](x, y),
  β: (x, y) => metaprocess[2](x, y),
  ς: (x, y) => metaprocess[3](x, y),
};

const metamodel = {
  JS: (x, y, fn = (x, y) => metaschema['λ'](x, y)) => metacomponent(x, y, fn),
  HTML: (x, y, fn = (x, y) => metaschema['β'](x, y)) => metacomponent(x, y, fn),
  CSS: (x, y, fn = (x, y) => metaschema['ς'](x, y)) => metacomponent(x, y, fn),
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

const readDirectoryContent = (pathname) =>
  new Promise((resolve, reject) => {
    fs.readdir(pathname, (error, data) => {
      error ? reject(error) : resolve(data);
    });
  });

const readSourceDetails = (pathname) =>
  new Promise((resolve, reject) => {
    fs.lstat(pathname, (error, data) => {
      error ? reject(error) : resolve(data);
    });
  });

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
) => Reflect.set(obj, field, data);

const getExitInformation = (
  obj = EXIT,
  field = 'INFO',
  response = Reflect.has(obj, field) ? obj[field] : 'Data is missing...'
) => response;

const verifyDirectoryExists = (path) =>
  new Promise((resolve, reject) => {
    fs.access(path, (error) => {
      error
        ? reject(`Directory not found, wrong path: ${path}`)
        : resolve(true);
    });
  });

const main = async (...args) => {
  const [dir, filter, config] = args;
  try {
    start(application);
    await verifyDirectoryExists(dir);
    pathfinder(dir, filter, config);
  } catch (error) {
    saveExitInformation(error);
    return EXIT.FAILURE;
  }
  return EXIT.SUCCESS;
};

const run = async (settings) => {
  const outcome = await main(settings.ROOT, settings.IGNORE, settings.OPTIONS);
  if (outcome === EXIT.FAILURE) {
    const info = getExitInformation();
    reportFailure(info);
  }
  return outcome;
};

/**
 * MULTITHREADING */

const threads = require('worker_threads');
const { Worker, workerData, isMainThread } = threads;

if (isMainThread) {
  const worker = new Worker(__filename, {
    workerData: {
      msg: 'Data to Worker',
      config: JSON.stringify(CONFIGURATIONS),
      threadStart: '',
    },
  });

  const STATISTICS = {
    TIMER: 0,
  };

  worker.on('message', (msg) => Reflect.set(STATISTICS, 'TIMER', msg));
  worker.on('exit', () => reportSpentTime(STATISTICS.TIMER));
  worker.on('error', (err) => console.log(err.stack));
} else {
  // console.dir({ worker: threads });

  Reflect.set(workerData, 'threadStart', new Date());
  const data = Reflect.get(workerData, 'threadStart');
  threads.parentPort.postMessage(data);

  const config = Reflect.get(workerData, 'config');
  const fn = JSON.parse(config);
  run(fn);
}
