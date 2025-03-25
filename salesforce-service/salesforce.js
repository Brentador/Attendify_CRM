const jsforce = require('jsforce');
require('dotenv').config();

let conn = null;

async function getConnection() {
  if (!conn) {
    conn = new jsforce.Connection({
      loginUrl: process.env.SF_LOGIN_URL
    });
    
    await conn.login(
      process.env.SF_USERNAME,
      process.env.SF_PASSWORD + process.env.SF_SECURITY_TOKEN
    );
  }
  return conn;
}

module.exports = { getConnection };
