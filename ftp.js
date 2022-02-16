// https://www.npmjs.com/package/basic-ftp

'use strict';

const ftp = require('basic-ftp');
const client = require('../access.json');

const access = {
  HOST: client.HOST,
  USER: client.USER,
  PASSWORD: client.PASSWORD,
  SERVER: client.SERVER,
  UPLOAD: client.UPLOAD,
};

deploy();

async function deploy() {
  const client = new ftp.Client();
  client.ftp.verbose = true;
  try {
    await client.access({
      host: access.HOST,
      user: access.USER,
      password: access.PASSWORD,
      secure: true,
    });
    await client.ensureDir(access.SERVER);
    console.log(await client.list());
    await client.uploadFromDir(access.UPLOAD);
  } catch (err) {
    console.log(err);
  }
  client.close();
}
