// https://www.npmjs.com/package/basic-ftp

'use strict';

const ftp = require('basic-ftp');
const config = require('../access.json');

const { HOST, USER, PASSWORD, SERVER, SOURCE } = config;

deploy();

async function deploy() {
  const client = new ftp.Client();
  client.ftp.verbose = true;
  try {
    await client.access({
      host: HOST,
      user: USER,
      password: PASSWORD,
      secure: true,
    });
    await client.ensureDir(SERVER);
    console.log(await client.list());
    await client.uploadFromDir(SOURCE);
  } catch (err) {
    console.log(err);
  }
  client.close();
}
