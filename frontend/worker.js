'use strict';

/**
 * Title: Frontend worker
 * Code scenario: can navigate the project tree and compress its sources
 * Designer: S.Tursky
 * Essence of research: metaprogramming */

/**
 * CONFIGURATIONS */

const config = {
  APPLICATION: 'FRONTEND WORKER',
  ROOT: 'frontend/src',
  DIST: 'application/static',
  OPTIONS: {
    JS: { compress: false },
    HTML: { collapseWhitespace: true, removeComments: true },
    CSS: ['cssnano'],
  },
  FILTER: [
    'bundles',
    'images',
    'icons',
    'webfonts',
    'docs',
    'robots.txt',
    '.xml',
    '.php',
    'libs.zip',
  ],
};

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
 * LIB */

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

const readDirectory = (sourcepath) =>
  new Promise((resolve, reject) => {
    fs.readdir(sourcepath, (error, data) => {
      error ? reject(error) : resolve(data);
    });
  });

const readDetails = (sourcepath) =>
  new Promise((resolve, reject) => {
    fs.lstat(sourcepath, (error, data) => {
      error ? reject(error) : resolve(data);
    });
  });

const clearDirectory = (directory) =>
  new Promise((resolve, reject) => {
    fs.rm(directory, { recursive: true, force: true }, (error) => {
      error ? reject(error) : resolve('OK');
    });
  });

const copyDirectory = (path, destination) =>
  new Promise((resolve, reject) => {
    // experimental feature of the standard lib
    fs.cp(path, destination, { recursive: true }, (error) => {
      error ? reject(error) : resolve('OK');
    });
  });

const verifyDirectory = (path) =>
  new Promise((resolve, reject) => {
    fs.access(path, (error) => {
      const msg = `Target directory not found, wrong ROOT > ${path}`;
      error ? reject(new Error(msg)) : resolve(true);
    });
  });

const sleep = (msec) =>
  new Promise((resolve) => {
    setTimeout(resolve, msec);
  });

/**
 * UI */

const CLI = {
  UITypography: {
    boldfont: '\x1b[1m',
    clear: '\x1Bc',
    dim: '\x1b[2m',
    reset: '\x1b[0m',
    newline: '\n',
    indent: '\v',
    white: '\x1b[37m',
    blue: '\x1b[34m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    blueBG: '\x1b[44m',
  },

  preprint(matrix) {
    return [...matrix].flat().join('');
  },

  CLIStart([app], cli = this.UITypography) {
    return this.preprint([
      [cli.clear, cli.boldfont, cli.white, cli.blueBG],
      [' '.repeat(5), ' '.repeat(app.length), ' '.repeat(5), cli.newline],
      [' '.repeat(5), app, ' '.repeat(5), cli.newline],
      [' '.repeat(5), ' '.repeat(app.length), ' '.repeat(5), cli.newline],
      [cli.reset, cli.indent.repeat(2)],
    ]);
  },

  CLISuccess([msg], cli = this.UITypography) {
    return this.preprint([
      [cli.cyan, '[ok]', cli.blue, cli.dim, ' - ', cli.reset],
      [cli.blue, [msg], cli.newline, cli.reset],
    ]);
  },

  CLIError([msg, err], cli = this.UITypography) {
    return this.preprint([
      [cli.red, '[ok]', cli.blue, cli.dim, ' - ', cli.reset],
      [cli.blue, msg, cli.newline, cli.indent],
      [cli.red, err.stack, cli.newline, cli.indent, cli.reset],
    ]);
  },

  CLIFailure([msg], cli = this.UITypography) {
    return this.preprint([
      [cli.blue, '- Failure❗️', cli.newline],
      ['- ', msg, cli.newline, cli.indent, cli.reset],
    ]);
  },

  CLITimer([start], cli = this.UITypography) {
    return this.preprint([
      [cli.newline, cli.cyan, `Time spent: ${new Date() - start} ms`],
      [cli.newline, cli.indent, cli.reset],
    ]);
  },

  Router(route, args) {
    return {
      start: (param) => this.CLIStart(param),
      success: (param) => this.CLISuccess(param),
      error: (param) => this.CLIError(param),
      failure: (param) => this.CLIFailure(param),
      timer: (param) => this.CLITimer(param),
    }[route](args);
  },

  FRONTController(request, data, response = () => this.Router(request, data)) {
    return response();
  },

  Renderer(status, ...args) {
    const view = this.FRONTController(status, args);
    return process.stdout.write(view);
  },
};

/**
 * IMPORT SUBSTITUTION SOFTWARE COMPONENT, AI */

const ISAlgorithm = (
  buffer,
  AI = (
    src,
    srcname,
    read = (f) => fs.readFileSync(f, 'utf-8'),
    parse = (content) => {
      const pattern = /schema = {\s[^;]*/gm;
      const [struct] = [...new Set(content.match(pattern))];
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
    preprocess = (srcname) => path.extname(srcname).slice(1).toUpperCase(),
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
    const binaries = read(src);

    // Parse binaries
    const data = parse(binaries);

    // Prepare data
    const dataset = prepare(data);

    // Preprocess filename
    const srcformat = preprocess(srcname);

    // Get filtered struct
    const structure = filter(dataset, {
      contains: srcformat,
    });

    // Compose analytical summaries
    const summary = analize(structure);

    return summary;
  },
  research = (AIdata, error) => {
    const [data] = [...Object.values(AIdata)];
    const stacktrace = JSON.stringify(error.stack);
    return stacktrace.includes(data);
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
  qr = (f) => path.extname(f).slice(1).toUpperCase(),
  support = (
    source,
    file,
    algorithm,
    rehandle = (λ = algorithm) => λ(source),
    outcome = (code = rehandle()) => {
      fs.writeFileSync(file, code);
      return 'OK';
    }
  ) => outcome(),
  rethink = (AIdata, schema) => {
    const field = Object.keys(AIdata);
    const [value] = Object.values(AIdata);
    return Reflect.set(schema, field, value);
  },
  compile = (file, processing) => {
    if (processing === 'CONFIRMED') {
      const note = 'Import-substituting algorithm has been succeeded!';
      const msg = `${file} processing is done by native software.`;
      process.stdout.write(
        [
          ['\x1b[36m', '[er]', '\x1b[34m', '\x1b[2m', ' - ', '\x1b[0m'],
          ['\x1b[1;37m', note, ' ', msg, '\n', '\x1b[0m'],
        ]
          .flat()
          .join('')
      );
    } else {
      const note = 'Import-substituting algorithm has been declined!';
      const msg = `${file} files have been excluded from processing.`;
      process.stdout.write(
        [
          [],
          ['\x1b[31m', '[..]', '\x1b[34m', '\x1b[2m', ' - ', '\x1b[0m'],
          ['\x1b[1;37m', note, ' ', msg, '\n', '\x1b[0m'],
        ]
          .flat()
          .join('')
      );
    }
  },
  tryImplement = () => {
    const { PACKAGE } = v8.deserialize(buffer);
    const [FILENAME, ERROR, FILESOURCE] = PACKAGE;
    const SCHEMA = require(__filename).schema;

    let aiData = AI(__filename, FILENAME); // data science analytics
    let confirm = research(aiData, ERROR);

    let result = null,
      end = null;

    if (confirm)
      try {
        confirm = software(qr(FILENAME));
        result = support(FILESOURCE, FILENAME, confirm);
      } catch (err) {
        if (err) return;
      } finally {
        const property = Object.keys(aiData);

        if (result === 'OK') {
          aiData = Object.defineProperty(aiData, property, {
            value: confirm,
          });

          confirm = rethink(aiData, SCHEMA);

          if (confirm) {
            compile(qr(FILENAME), 'CONFIRMED');
            end = true;
          }
        } else {
          delete SCHEMA[property];
          compile(qr(FILENAME), 'DECLINED');
        }
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

const RALEY = {
  EXTNAME: ['.css', '.html', '.js'],
  CSS: true,
  HTML: true,
  JS: true,
};

/**
 * MAIN */

const metacomponent = async (file, options, process) => {
  let result = null,
    code = null;

  if (typeof process === 'function')
    try {
      code = await readFile(file);
      const processed = await process(code, options);
      result = await writeFile(file, processed);
    } catch (err) {
      CLI.Renderer('error', file, err);
      if (err instanceof TypeError || err instanceof ReferenceError) {
        const data = v8.serialize({
          PACKAGE: [file, err, code],
        });
        result = ISAlgorithm(data); // run import substitution algorithm
      }
    } finally {
      if (result === 'Successfully!') {
        CLI.Renderer('success', file);
      }
    }
};

const commutator = (ζ) => schema[ζ];

const metamodel = (
  ζ,
  λ = () =>
    (χ, ϒ, φ = commutator(ζ)) =>
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

const launchCompress = async (srcmap, metadata) => {
  for (const [format, files] of srcmap) {
    if (RALEY[format]) {
      for (const file of files) {
        await sleep(20);
        preprocess(file, metadata);
      }
    }
  }
};

const confirmExcept = (path, fltr) =>
  fltr.find((exception) => path.includes(exception));

const confirmInsert = (path, insertion) => path.includes(insertion);

const prepareDataset = async (src, filter) => {
  const srcmap = new Map();
  let stack = new Array();
  for (const name of RALEY.EXTNAME) {
    for (const source of src) {
      if (confirmExcept(source, filter)) continue;
      if (confirmInsert(source, name)) {
        stack.push(source);
      }
    }
    const extname = name.slice(1).toUpperCase();
    srcmap.set(extname, stack);
    stack = [];
  }
  return srcmap;
};

const normilize = async (matrix) => matrix.flat();

const pathfinder = async (root) => {
  const content = await readDirectory(root);
  const arr = await Promise.all(
    content.map(async (source) => {
      const srcpath = path.join(root, source);
      source = await readDetails(srcpath);
      if (source.isDirectory()) return await pathfinder(srcpath);
      else return srcpath;
    })
  );
  return await normilize(arr);
};

/**
 * DATABASE */

const DB = {
  saveExitInfo(
    data = 'Exit information may be missing...',
    obj = DB,
    field = this.INFO
  ) {
    return Reflect.set(obj, field, data);
  },

  getExitInfo(
    obj = DB,
    field = this.INFO,
    response = Reflect.has(obj, field) ? obj[field] : 'Data is missing...'
  ) {
    return response;
  },
};

/**
 * RUN */

const compress = async ({ DIST, OPTIONS, FILTER }) => {
  try {
    const src = await pathfinder(DIST);
    const dataset = await prepareDataset(src, FILTER);
    await launchCompress(dataset, OPTIONS);
    await sleep(20);
  } catch (err) {
    CLI.Renderer('error', 'COMPRESSION STOPPED', err);
    throw new Error('Compress fn failed...');
  }
  return 0;
};

const build = async ({ ROOT, DIST }) => {
  try {
    await clearDirectory(DIST);
    const status = await copyDirectory(ROOT, DIST);
    if (status === 'OK') CLI.Renderer('success', `BUILD IS READY > ${DIST}`);
  } catch (err) {
    CLI.Renderer('error', 'BUILD IS NOT READY', err);
    throw new Error('Build fn failed...');
  }
  return 0;
};

const check = async ({ ROOT }) => {
  try {
    await verifyDirectory(ROOT);
  } catch (err) {
    CLI.Renderer('failure', err.message);
    throw new Error('Check fn failed...');
  }
  return 0;
};

const start = async ({ APPLICATION }) => {
  try {
    CLI.Renderer('start', APPLICATION);
  } catch (err) {
    throw new Error('Start fn failed...');
  }
  return 0;
};

const EXIT = {
  SUCCESS: 0,
  FAILURE: 1,
};

const launch = async (software, instruction) => {
  for (const component of software) {
    try {
      const outcome = await component(instruction);
      if (outcome instanceof Error) throw new Error('Launch fn failed...');
    } catch (err) {
      DB.saveExitInfo(err);
      return EXIT.FAILURE;
    }
  }
  return EXIT.SUCCESS;
};

const API = {
  start: [start],
  run: [start, check, build, compress],
  build: [build],
  compress: [compress],
  check: [check],
  default: 'run',

  parseFirst(commandline) {
    const [argument] = commandline.filter((el, i) => i > 1);
    return argument;
  },

  parse(argv) {
    let command = this.default;
    if (argv.length > 2) command = this.parseFirst(argv);
    return API[command];
  },
};

const node = async (...args) => {
  const [commandline, prerequisites] = args;
  const scenario = API.parse(commandline);
  return await launch(scenario, prerequisites);
};

/**
 * MULTITHREADING ENVIRONMENT */

const threads = require('worker_threads');
const { Worker, workerData, isMainThread } = threads;

if (isMainThread) {
  const worker = new Worker(__filename, {
    workerData: {
      msg: 'Data to Worker',
      configuration: JSON.stringify(config),
      commands: process.argv,
    },
  });

  const statistics = {
    TIMER: 0,
  };

  worker.on('message', async (msg) => {
    if (msg instanceof Date) Reflect.set(statistics, 'TIMER', msg);
    if (msg instanceof Error) {
      setTimeout(() => {
        Reflect.set(statistics, 'STACK', msg);
        worker.terminate();
      }, 0);
    }
  });

  worker.on('exit', (code) => {
    if (code === 1) CLI.Renderer('error', '🤷', statistics.STACK);
    if (code === 0) CLI.Renderer('timer', statistics.TIMER);
  });

  worker.on('error', (err) => {
    console.log(err.stack);
  });
} else {
  // console.dir({ worker: threads });

  const now = new Date();
  threads.parentPort.postMessage(now);

  const data = Reflect.get(workerData, 'configuration');
  const settings = JSON.parse(data);
  const argv = Reflect.get(workerData, 'commands');

  setTimeout(async () => {
    const sensor = await node(argv, settings);
    if (sensor === 1) {
      const critical = DB.getExitInfo();
      threads.parentPort.postMessage(critical);
    }
  }, 0);
}

module.exports = { schema };
