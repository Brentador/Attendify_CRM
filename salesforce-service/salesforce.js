const jsforce = require('jsforce');
require('dotenv').config({ path: '../.env' });

let conn = null;

async function getConnection() {
  try {  
    if (!conn || !conn.instanceUrl || !conn.accessToken) {
          console.log('Creating new Salesforce connection...');
          conn = new jsforce.Connection({
              loginUrl: process.env.SF_LOGIN_URL,
          });
          await conn.login(
              process.env.SF_USERNAME,
              process.env.SF_PASSWORD + process.env.SF_SECURITY_TOKEN
          );
          console.log('Connected to Salesforce');
      } else {
          console.log('Reusing existing Salesforce connection...');
      }
      return conn;
  } catch (error) {
    console.error('Error connecting to Salesforce:', error);
    conn = null;
    throw error;
  }
} 

module.exports = { getConnection };
