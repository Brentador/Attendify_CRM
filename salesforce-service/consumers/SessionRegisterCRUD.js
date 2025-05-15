const { getConnection } = require('../salesforce'); // Pas pad aan indien nodig

class SessionRegistrationService {
  // 📌 Create a session registration
  static async createRegistration(data) {
    try {
      const conn = await getConnection();

      const result = await conn.sobject('Session_Registration__c').create({
        user__c: data.user_id,
        session__c: data.session_id
      });

      console.log('✅ Registration created:', result);
      return result;
    } catch (error) {
      console.error('❌ Error creating session registration:', error);
      throw error;
    }
  }

  // 📌 Read (retrieve) a registration by UID (custom)
  static async getRegistrationByUserAndSession(userId, sessionId) {
    try {
      const conn = await getConnection();

      const result = await conn.query(`
        SELECT Id, user__c, session__c
        FROM Session_Registration__c 
        WHERE user__c = '${userId}' AND session__c = '${sessionId}'
        LIMIT 1
      `);

      return result.records[0] || null;
    } catch (error) {
      console.error('❌ Error fetching session registration:', error);
      throw error;
    }
  }

  // 📌 Update a registration
  static async updateRegistration(data) {
    try {
      const conn = await getConnection();

      const existing = await this.getRegistrationByUserAndSession(data.user_id, data.session_id);
      if (!existing) {
        return { success: false, message: 'Registration not found' };
      }

      const updateData = {
        Id: existing.Id
      };

      const result = await conn.sobject('Session_Registration__c').update(updateData);
      console.log('✅ Registration updated:', result);
      return result;
    } catch (error) {
      console.error('❌ Error updating session registration:', error);
      throw error;
    }
  }

  // 📌 Delete a registration
  static async deleteRegistration(userId, sessionId) {
    try {
      const conn = await getConnection();

      const existing = await this.getRegistrationByUserAndSession(userId, sessionId);
      if (!existing) {
        return { success: false, message: 'Registration not found' };
      }

      const result = await conn.sobject('Session_Registration__c').destroy(existing.Id);
      console.log(`✅ Registration with ID ${existing.Id} deleted.`);
      return result;
    } catch (error) {
      console.error('❌ Error deleting session registration:', error);
      throw error;
    }
  }
}

module.exports = SessionRegistrationService;