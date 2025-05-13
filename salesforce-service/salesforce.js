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

// async function getSpeakerId(userName) {
//   try {
//     const conn = await getConnection();
//     const result = await conn.query(`SELECT Id FROM Users_CRM__c WHERE Name = '${userName}'`);
//     if (result.records.length > 0) {
//       return result.records[0].Id; // Return the Salesforce User ID
//     } else {
//       throw new Error(`No user found with Name = ${userName}`);
//     }
//   } catch (error) {
//     console.error('Error fetching speaker ID:', error);
//     throw error;
//   }
// }

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

// async function getSessionId(sessionId) {
//   try {
//     const conn = await getConnection();
//     const result = await conn.query(`SELECT Id FROM Session__c WHERE Name = '${sessionId}'`);
//     if (result.records.length > 0) {
//       return result.records[0].Id; // Return the Salesforce User ID
//     } else {
//       throw new Error(`No session found with Name = ${sessionId}`);
//     }
//   } catch (error) {
//     console.error('Error fetching session ID:', error);
//     throw error;
//   }
// }

// module.exports = { getConnection, getSpeakerId, getEventId, getSessionId };
module.exports = { getConnection, getEventId };