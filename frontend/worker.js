'use strict';

/**
 * Name: Frontend worker
 * Description: this code scenario can traverse the project tree and compress its sources
 * Designer: S.Tursky
 * Essence of research: metaprogramming
 */

/**
 * CONFIGURATIONS */

const config = {
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
  },
  application = 'FRONTEND WORKER';

/**
 * DEPENDENCIES */

const v8 = require('v8');
const path = require('path');
const fs = require('fs');

const VENDOR = {
  // 3rd-party software components

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
 * LIB */

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
 * AI, IMPORT SUBSTITUTION COMPONENT */

const ISAlgorithm = (
  data,
  AI = (
    data,
    metadata,
    read = (data) => fs.readFileSync(data, 'utf-8'),
    parse = (data) => {
      const pattern = /schema = {\s[^;]*/gm;
      const [struct] = [...new Set(data.match(pattern))];
      return struct;
    },
    prepare = (data) => {
      const dataset = data.split('\n');
      dataset.shift();
      dataset.pop();
      return dataset.map((line) => line.replace('  ', ''));
    },
    filter = (dataset, conditions) => {
      const operations = {};
      const check = (s, conditions) => {
        let valid = true;
        for (const key in conditions) {
          valid = valid && operations[key](s, conditions[key]);
        }
        return valid;
      };
      Object.assign(operations, {
        length: (s, v) => s.length >= v[0] && s.length <= v[1],
        contains: (s, v) => s.includes(v),
        starts: (s, v) => s.startsWith(v),
        ends: (s, v) => s.endsWith(v),
        not: (s, v) => !check(s, v),
      });
      return dataset.filter((s) => check(s, conditions));
    },
    preprocess = (data) => path.extname(data).slice(1).toUpperCase(),
    analize = (data) => {
      const [str] = [...data];
      const rx = /component[a-zA-Z]+/g;
      const [fieldName] = [...new Set(str.substring(0, 1))];
      const [value] = [...new Set(str.match(rx))];
      const obj = {
        [fieldName]: value,
      };
      return obj;
    }
  ) => {
    // Read binary file
    const binary = read(data);

    // Parse binary content
    const content = parse(binary);

    // Prepare content
    const dataset = prepare(content);

    // Preprocess metadata
    const srcformat = preprocess(metadata);

    // Get filtered struct
    const struct = filter(dataset, {
      contains: srcformat,
    });

    // Generates analytical summaries
    const summary = analize(struct);

    return summary;
  },
  research = (AIdata, error) => {
    const [data] = [...Object.values(AIdata)];
    const err = JSON.stringify(error.stack);
    return err.includes(data);
  },
  db = (
    request,
    response = () =>
      ({
        JS: () => undefined,
        HTML: () => undefined,
        CSS: (source) =>
          source
            .split('\n')
            .reduce((processed, line) => processed + line.trim()),
      }[request])
  ) => response(),
  software = (component, confirm = () => db(component)) => confirm(),
  qr = (file) => path.extname(file).slice(1).toUpperCase(),
  support = (
    source,
    file,
    algorithm,
    rehandle = (process = algorithm) => process(source),
    outcome = (code = rehandle()) => {
      fs.writeFileSync(file, code);
      return 'OK';
    }
  ) => outcome(),
  rethink = (AIdata, struct) => {
    const field = Object.keys(AIdata);
    const [value] = Object.values(AIdata);
    return Reflect.set(struct, field, value);
  },
  compile = (file, processing) => {
    if (processing === 'OK') {
      const note = '[er] - Import substitution completed successfully!';
      const msg = `${file} processing is done by native software.`;
      const output = String('');
      output.concat('\x1b[1;37m', note, ' ', msg, '\n', '\x1b[0m');
      process.stdout.write(output);
    }
  },
  tryImplement = () => {
    const unbuffer = v8.deserialize(data);
    const { dataset } = unbuffer;
    const [FILENAME, ERROR, FILESOURCE] = dataset;

    // Data science
    let aiData = AI(__filename, FILENAME);
    let confirm = research(aiData, ERROR);

    let result = null,
      end = null;

    if (confirm)
      try {
        confirm = software(qr(FILENAME));
        result = support(FILESOURCE, FILENAME, confirm);
      } catch (e) {
        if (e) throw e;
      } finally {
        if (result === 'OK') {
          aiData = Object.defineProperty(aiData, Object.keys(aiData), {
            value: confirm,
          });
        }
      }

    if (rethink(aiData, require(__filename).schema)) {
      compile(qr(FILENAME), result);
      end = true;
    }

    return end ? 'Successfully!' : false;
  }
) => tryImplement();

/**
 * BUSINESS LOGIC */

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

/**
 * MAIN */

const metacomponent = async (file, options, process) => {
  let result = null,
    code = null;

  try {
    code = await readFile(file);
    const processed = await process(code, options);
    result = await writeFile(file, processed);
  } catch (err) {
    reportError(file, err);
    if (err instanceof TypeError || err instanceof ReferenceError) {
      const PACKAGE = v8.serialize({
        dataset: [file, err, code],
      });
      result = ISAlgorithm(PACKAGE); // run import substitution algorithm
    }
  } finally {
    if (result === 'Successfully!') {
      informSuccess(file);
    }
  }
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

/**
 * RUN, MULTITHREADING */

const threads = require('worker_threads');
const { Worker, workerData, isMainThread } = threads;

const run = async (settings) => {
  const outcome = await main(settings.root, settings.ignore, settings.options);
  if (outcome === EXIT.FAILURE) {
    const data = getExitInformation();
    informFailure(data);
  }
  return outcome;
};

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

module.exports = { schema };
