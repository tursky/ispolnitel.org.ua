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
      result = PostCSS(plugins()).process(src, {
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
 * CONFIGURATIONS */

const application = 'FRONTEND WORKER',
  config = {
    root: 'application/static',
    options: {
      JS: { compress: false },
      HTML: { collapseWhitespace: true, removeComments: true },
      CSS: ['cssnano'],
    },
    ignore: [
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

/**
 * CLI FEATURES, UI */

const render = (output) => process.stdout.write(output);
const preprint = (...arr) => arr.join('');

const CLITypography = {
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
 * CONSOLE OUTPUT */

const start = (app, ui = CLITypography) => {
  render(
    preprint(
      ui.display.clear,
      ui.text.boldfont,
      ui.color.white,
      ui.background.blue,

      ui.fn.draw(ui.fn.space(5) + ui.fn.space(app.length) + ui.fn.space(5)),
      ui.fn.newline(1),
      ui.fn.draw(ui.fn.space(5) + app + ui.fn.space(5)),
      ui.fn.newline(1),
      ui.fn.draw(ui.fn.space(5) + ui.fn.space(app.length) + ui.fn.space(5)),

      ui.fn.newline(3),
      ui.display.reset
    )
  );
};

const informSuccess = (data, ui = CLITypography) => {
  render(
    preprint(
      ui.color.cyan,
      ui.fn.draw('[ok]'),
      ui.color.blue,
      ui.text.dim,
      ui.fn.draw(' - '),
      ui.display.reset,
      ui.color.blue,
      ui.fn.draw(data),
      ui.fn.newline(1),
      ui.display.reset
    )
  );
  return true;
};

const informFailure = (data, ui = CLITypography) => {
  render(
    preprint(
      ui.color.blue,
      ui.fn.draw('- Failure❗️'),
      ui.fn.newline(1),
      ui.fn.draw(`- ${data}`),
      ui.fn.newline(1),
      ui.fn.draw('- Process completed...'),
      ui.fn.newline(1),
      ui.display.reset
    )
  );
};

const reportError = (data, err, ui = CLITypography) => {
  render(
    preprint(
      ui.color.red,
      ui.fn.draw('[ok]'),
      ui.color.blue,
      ui.text.dim,
      ui.fn.draw(' - '),
      ui.display.reset,
      ui.color.blue,
      ui.fn.draw(data),
      ui.fn.newline(2),
      ui.color.red,
      ui.fn.draw(err.stack),
      ui.fn.newline(2),
      ui.display.reset
    )
  );
};

const printSpentTime = (timer, ui = CLITypography) => {
  render(
    preprint(
      ui.fn.newline(1),
      ui.color.cyan,
      ui.fn.draw(`Time spent: ${new Date() - timer} ms`),
      ui.fn.newline(2),
      ui.display.reset
    )
  );
};

/**
 * BUSINESS LOGIC */

const readFile = (sourcepath) =>
  new Promise((resolve, reject) => {
    fs.readFile(sourcepath, 'utf8', (error, buffer) => {
      error ? reject(error) : resolve(buffer);
    });
  });

const writeFile = (sourcepath, data) =>
  new Promise((resolve, reject) => {
    fs.writeFile(sourcepath, data, (error) => {
      error ? reject(error) : resolve('Successfully!');
    });
  });

const metacomponent = async (file, options, process) => {
  let result = null;
  let code = null;
  let processed = null;

  try {
    code = await readFile(file);
    processed = await process(code, options);
    result = await writeFile(file, processed);
  } catch (e) {
    reportError(file, e);

    if (e instanceof ReferenceError) {
      const list = ['JSTerser', 'HTMLTerser', 'PostCSS', 'cssnano'];
      const err = JSON.stringify(e.stack);
      const data = list.find((cause) => err.includes(cause));

      const qrdecode = {
        JSTerser: α,
        HTMLTerser: β,
        PostCSS: ς,
        cssnano: ς,
      };

      const algorithm = qrdecode[data];

      const source = {
        C: (code) => code.split('\n').reduce((acc, line) => acc + line.trim()),
      };

      const rehandle = source[algorithm];
      Reflect.set(schema, algorithm, source[algorithm]);
      result = await writeFile(file, rehandle(code));

      if (result === 'Successfully!') {
        const srcformat = path.extname(file).slice(1).toUpperCase();
        console.log(
          `\x1b[1;37m[er] - Successfully! Import substitution completed. An alternative ${srcformat} processing scenario running.\x1b[0m`
        );
      }
    }
  } finally {
    if (result === 'Successfully!') {
      informSuccess(file);
    }
  }
};

/**
 * MAIN */

const αλφάβητο = {
  α: 'A',
  β: 'B',
  ς: 'C',
  ϒ: VENDOR,
};

const { α, β, ς, ϒ } = αλφάβητο;

const schema = {
  A: (data, metadata) => ϒ.componentJSTerser(data, metadata),
  B: (data, metadata) => ϒ.componentHTMLTerser(data, metadata),
  C: (data, metadata) => ϒ.componentPostCSS(data, metadata),
};

const commutator = (x, y, ζ) => schema[ζ](x, y);

const metamodel = (
  ζ,
  λ = () =>
    (χ, ϒ, φ = (χ, ϒ) => commutator(χ, ϒ, ζ)) =>
      metacomponent(χ, ϒ, φ)
) => λ();

const encode = (ζ) => ({ JS: α, HTML: β, CSS: ς }[ζ]);

const types = {
  object: ([obj], callback) => callback(JSON.stringify(obj)),
  undefined: (callback) => callback('not found'),
  function: ([fn, src, config], callback) =>
    callback(JSON.stringify(fn(src, config))),
};

const metahandler = (data, metadata, intention) => {
  const type = typeof intention;
  if (type === 'function') {
    const serializer = types[type];
    serializer([intention, data, metadata], (intention) =>
      metahandler(data, metadata, intention)
    );
  }
};

const preprocess = (sourcepath, config) => {
  const ext = path.extname(sourcepath);
  const srcformat = ext.slice(1).toUpperCase();
  const options = config[srcformat];
  const file = sourcepath;
  const qr = encode(srcformat);
  const scenario = metamodel(qr);
  metahandler(file, options, scenario);
};

const readDirectoryContent = (sourcepath) =>
  new Promise((resolve, reject) => {
    fs.readdir(sourcepath, (error, data) => {
      error ? reject(error) : resolve(data);
    });
  });

const readSourceDetails = (sourcepath) =>
  new Promise((resolve, reject) => {
    fs.lstat(sourcepath, (error, data) => {
      error ? reject(error) : resolve(data);
    });
  });

const verifySourceExclusion = (path, filter) =>
  filter.find((exclusion) => path.includes(exclusion));

const pathfinder = async (root, filter, metadata) => {
  const src = await readDirectoryContent(root);
  for (let source of src) {
    const sourcepath = path.join(root, source);
    if (verifySourceExclusion(sourcepath, filter)) continue;
    source = await readSourceDetails(sourcepath);
    if (source.isFile()) {
      preprocess(sourcepath, metadata);
      continue;
    }
    pathfinder(sourcepath, filter, metadata);
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
  const [directory, exclusions, configurations] = args;
  try {
    start(application);
    await verifyDirectoryExists(directory);
    pathfinder(directory, exclusions, configurations);
  } catch (error) {
    saveExitInformation(error);
    return EXIT.FAILURE;
  }
  return EXIT.SUCCESS;
};

const run = async (settings) => {
  const outcome = await main(settings.root, settings.ignore, settings.options);
  if (outcome === EXIT.FAILURE) {
    const data = getExitInformation();
    informFailure(data);
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
      config: JSON.stringify(config),
      threadStart: '',
    },
  });

  const statistics = {
    TIMER: 0,
  };

  worker.on('message', (msg) => Reflect.set(statistics, 'TIMER', msg));
  worker.on('exit', () => printSpentTime(statistics.TIMER));
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
