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

async function getEventId(eventId) {
  try {
    const conn = await getConnection();
    const result = await conn.query(`SELECT Id FROM Eventcrm__c WHERE Name = '${eventId}'`);
    if (result.records.length > 0) {
      return result.records[0].Id; // Return the Salesforce User ID
    } else {
      throw new Error(`No event found with Name = ${eventId}`);
    }
  } catch (error) {
    console.error('Error fetching event ID:', error);
    throw error;
  }
}

async function getEventId(eventUid) {
  try {
    const conn = await getConnection();
    const query = `SELECT Id FROM Eventcrm__c WHERE uid__c = '${eventUid}' LIMIT 1`; // Zoek op uid__c
    console.log("Executing Event Query:", query); // Log de query
    const result = await conn.query(query);
    if (result.records.length > 0) {
      return result.records[0].Id;
    } else {
      throw new Error(`No event found with uid__c = ${eventUid}`); // Correcte foutmelding
    }
  } catch (error) {
    console.error("Error fetching event ID:", error);
    throw error;
  }
}

// Zoek een Session op basis van Name (bijv. 'GC1747123804524')
async function getSessionId(sessionName) {
  try {
    const conn = await getConnection();
    const result = await conn.query(
      `SELECT Id FROM Session__c WHERE Name = '${sessionName}'`
    );
    if (result.records.length > 0) {
      return result.records[0].Id;
    } else {
      throw new Error(`❌ No session found with Name = '${sessionName}'`);
    }
  } catch (error) {
    console.error('Error fetching session ID:', error);
    throw error;
  }
}

module.exports = { 
  getConnection, 
  getEventId,
  getUserId,
  getSessionId 
};