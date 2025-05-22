const jsforce = require('jsforce');
require('dotenv').config({ path: '../.env' });

let conn = null;

console.log("SF_USERNAME from env:", process.env.SF_USERNAME);
console.log("SF_PASSWORD from env is set:", !!process.env.SF_PASSWORD); // Log of het gezet is, niet de waarde
console.log("SF_SECURITY_TOKEN from env is set:", !!process.env.SF_SECURITY_TOKEN); 

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
    return;
  }
}


module.exports = { 
  getConnection, 
};