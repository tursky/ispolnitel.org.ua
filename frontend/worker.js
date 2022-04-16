'use strict';

/**
 * Title: Frontend worker
 * Code scenario: can navigate the project tree and compress its sources
 * Designer: S.Tursky
 * Essence of research: metaprogramming */

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
  RALEY = {
    EXTNAME: ['.css', '.html', '.js'],
    CSS: true,
    HTML: true,
    JS: true,
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
 * UI, CONSOLE OUTPUT */

const CLI /** FEATURES */ = {
  UITypography: {
    clear: '\x1Bc',
    reset: '\x1b[0m',
    boldfont: '\x1b[1m',
    dim: '\x1b[2m',
    white: '\x1b[37m',
    blue: '\x1b[34m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    blueBG: '\x1b[44m',
    newline: '\n',
    indent: '\v',
  },

  preprint(matrix) {
    return [...matrix].flat().join('');
  },

  CLIStart(data, cli = this.UITypography) {
    const [title] = [...data];
    return this.preprint([
      [cli.clear, cli.boldfont, cli.white, cli.blueBG],
      [' '.repeat(5), ' '.repeat(title.length), ' '.repeat(5), cli.newline],
      [' '.repeat(5), title, ' '.repeat(5), cli.newline],
      [' '.repeat(5), ' '.repeat(title.length), ' '.repeat(5), cli.newline],
      [cli.reset, cli.indent.repeat(2)],
    ]);
  },

  CLISuccess(data, cli = this.UITypography) {
    const [srcname] = [...data];
    return this.preprint([
      [cli.cyan, '[ok]'],
      [cli.blue, cli.dim, ' - ', cli.reset],
      [cli.blue, srcname, cli.newline, cli.reset],
    ]);
  },

  CLIError(data, cli = this.UITypography) {
    const [srcname, err] = [...data];
    return this.preprint([
      [cli.red, '[ok]'],
      [cli.blue, cli.dim, ' - ', cli.reset],
      [cli.blue, srcname, cli.newline, cli.indent],
      [cli.red, err.stack, cli.newline, cli.indent, cli.reset],
    ]);
  },

  CLIFailure(data, cli = this.UITypography) {
    const [msg] = [...data];
    return this.preprint([
      [cli.blue],
      ['- Failure❗️', cli.newline],
      ['- ', msg, cli.newline],
      ['- Process completed...', cli.newline],
      [cli.reset],
    ]);
  },

  CLITimer(data, cli = this.UITypography) {
    const [timer] = [...data];
    return this.preprint([
      [cli.newline, cli.cyan],
      [`Time spent: ${new Date() - timer} ms`],
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
 * AI, IMPORT SUBSTITUTION COMPONENT */

const ISAlgorithm = (
  data,
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
        contains: (s, v) => s.includes(v),
        starts: (s, v) => s.startsWith(v),
        ends: (s, v) => s.endsWith(v),
        not: (s, v) => !check(s, v),
        length: (s, v) => s.length >= v[0] && s.length <= v[1],
      });
      return dataset.filter((s) => check(s, conditions));
    },
    preprocess = (filename) => path.extname(filename).slice(1).toUpperCase(),
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
      const output = `\x1b[1;37m${note} ${msg} \x1b[0m \n`;
      process.stdout.write(output);
    }
  },
  tryImplement = () => {
    const unbuffer = v8.deserialize(data);
    const { dataset } = unbuffer;
    const [FILENAME, ERROR, FILESOURCE] = dataset;

    let aiData = AI(__filename, FILENAME); // data science analytics
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
    CLI.Renderer('error', file, err);
    if (err instanceof TypeError || err instanceof ReferenceError) {
      const PACKAGE = v8.serialize({
        dataset: [file, err, code],
      });
      result = ISAlgorithm(PACKAGE); // run import substitution algorithm
    }
  } finally {
    if (result === 'Successfully!') {
      CLI.Renderer('success', file);
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

const sleep = (msec) =>
  new Promise((resolve) => {
    setTimeout(resolve, msec);
  });

const launcher = async (file, config) => {
  await sleep(15);
  preprocess(file, config);
};

const launchProcess = async (srcmap, metadata) => {
  for (const [format, files] of srcmap) {
    if (RALEY[format]) {
      for (const file of files) {
        await launcher(file, metadata);
      }
    }
  }
};

const pathfinder = async (root) => {
  const sources = await readDirectoryContent(root);
  const src = await Promise.all(
    sources.map(async (source) => {
      const sourcepath = path.join(root, source);
      source = await readSourceDetails(sourcepath);
      return source.isDirectory() ? pathfinder(sourcepath) : sourcepath;
    })
  );
  return src.reduce((acc, file) => acc.concat(file), []);
};

const isCheckException = (path, filter) =>
  filter.find((exception) => path.includes(exception));

const isCheckInsertion = (path, s) => path.includes(s);

const getDataset = async (src, fltr) => {
  const srcmap = new Map();
  let stack = new Array();
  for (const name of RALEY.EXTNAME) {
    for (const source of src) {
      if (isCheckException(source, fltr)) {
        continue;
      }
      if (isCheckInsertion(source, name)) {
        stack.push(source);
      }
    }
    const extname = name.slice(1).toUpperCase();
    srcmap.set(extname, stack);
    stack = [];
  }
  return srcmap;
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

const verifyRootExists = (path) =>
  new Promise((resolve, reject) => {
    fs.access(path, (error) => {
      error
        ? reject(`Directory not found, wrong path: ${path}`)
        : resolve(true);
    });
  });

const main = async (...args) => {
  const [rootpath, exceptions, metadata] = args;
  CLI.Renderer('start', application);
  try {
    await verifyRootExists(rootpath);
    const sources = await pathfinder(rootpath);
    const dataset = await getDataset(sources, exceptions);
    await launchProcess(dataset, metadata);
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
  const outcome = await main(
    settings.root,
    settings.ignore,
    settings.options,
    settings.formats
  );
  if (outcome === EXIT.FAILURE) {
    const data = getExitInformation();
    CLI.Renderer('failure', data);
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
  worker.on('exit', () => CLI.Renderer('timer', statistics.TIMER));
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
