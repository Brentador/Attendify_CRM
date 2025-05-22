// const { getConnection } = require('../salesforce');

// class SessionRegistrationService {
//   // 🔎 Helper to get Salesforce ID from UID
//   static async getSalesforceId(objectType, uid) {
//     const conn = await getConnection();
//     const result = await conn.query(`
//       SELECT Id FROM ${objectType} WHERE uid__c = '${uid}' LIMIT 1
//     `);
//     return result.records[0]?.Id || null;
//   }

//   // 📌 Create a session registration 
//   static async createRegistration(data) {
//     try {
//       const conn = await getConnection();

//       const userId = await this.getSalesforceId('Users_CRM__c', data.user_uid);
//       const sessionId = await this.getSalesforceId('Session__c', data.session_uid);

//       if (!userId || !sessionId) {
//         throw new Error('❌ User or session not found using uid__c');
//       }

//       const result = await conn.sobject('Session_Registration__c').create({
//         user__c: userId,
//         session__c: sessionId
//       });

//       console.log('✅ Registration created:', result);
//       return result;
//     } catch (error) {
//       console.error('❌ Error creating session registration:', error);
//       throw error;
//     }
//   }

//   // 📌 Read (retrieve) a registration by UID
//   static async getRegistrationByUserAndSession(userUid, sessionUid) {
//     try {
//       const conn = await getConnection();

//       const userId = await this.getSalesforceId('Users_CRM__c', userUid);
//       const sessionId = await this.getSalesforceId('Session__c', sessionUid);

//       if (!userId || !sessionId) return null;

//       const result = await conn.query(`
//         SELECT Id, user__c, session__c
//         FROM Session_Registration__c 
//         WHERE user__c = '${userId}' AND session__c = '${sessionId}'
//         LIMIT 1
//       `);

//       return result.records[0] || null;
//     } catch (error) {
//       console.error('❌ Error fetching session registration:', error);
//       throw error;
//     }
//   }

//   // 📌 Update a registration by UID
//   static async updateRegistration(data) {
//     try {
//       const conn = await getConnection();

//       const existing = await this.getRegistrationByUserAndSession(data.user_uid, data.session_uid);
//       if (!existing) {
//         return { success: false, message: 'Registration not found' };
//       }

//       const updateData = {
//         Id: existing.Id
//       };

//       const result = await conn.sobject('Session_Registration__c').update(updateData);
//       console.log('✅ Registration updated:', result);
//       return result;
//     } catch (error) {
//       console.error('❌ Error updating session registration:', error);
//       throw error;
//     }
//   }

//   // 📌 Delete a registration by UID
//   static async deleteRegistration(userUid, sessionUid) {
//     try {
//       const conn = await getConnection();

//       const existing = await this.getRegistrationByUserAndSession(userUid, sessionUid);
//       if (!existing) {
//         return { success: false, message: 'Registration not found' };
//       }

//       const result = await conn.sobject('Session_Registration__c').destroy(existing.Id);
//       console.log(`✅ Registration with ID ${existing.Id} deleted.`);
//       return result;
//     } catch (error) {
//       console.error('❌ Error deleting session registration:', error);
//       throw error;
//     }
//   }
// }

// module.exports = SessionRegistrationService;