/**
 * Console typography lib */

'use strict';

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

module.exports = { UITypography, render, preprint };
