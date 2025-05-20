const { getConnection } = require('../salesforce');

class EventRegistrationService {
  // 🔎 Helper om Salesforce ID op te halen via uid__c
  static async getSalesforceId(objectType, uid) {
    const conn = await getConnection();
    const result = await conn.query(`
      SELECT Id FROM ${objectType} WHERE uid__c = '${uid}' LIMIT 1
    `);
    return result.records[0]?.Id || null;
  }

  // 📌 Create an event registration (via uid)
  static async createRegistration(data) {
    try {
      const conn = await getConnection();

      const userId = data.user__c; // Gebruik de meegegeven user ID
      const eventId = data.Event_crm__c; // Gebruik de meegegeven event ID

      if (!userId || !eventId) {
        throw new Error('❌ User or Event ID missing in data'); // Verbeterde foutmelding
      }

      const result = await conn.sobject('Event_Registration__c').create({
        user__c: userId,
        Event_crm__c: eventId
      });

      console.log('✅ Event registration created:', result);
      return result;
    } catch (error) {
      console.error('❌ Error creating event registration:', error);
      throw error;
    }
  }

  // 📌 Get registration by user_uid and event_uid
  static async getRegistrationByUserAndEvent(userUid, eventUid) {
    try {
      const conn = await getConnection();

      const userId = await this.getSalesforceId('Users_CRM__c', userUid);
      const eventId = await this.getSalesforceId('Eventcrm__c', eventUid);

      if (!userId || !eventId) return null;

      const result = await conn.query(`
        SELECT Id, user__c, Event_crm__c
        FROM Event_Registration__c 
        WHERE user__c = '${userId}' AND Event_crm__c = '${eventId}'
        LIMIT 1
      `);

      return result.records[0] || null;
    } catch (error) {
      console.error('❌ Error fetching event registration:', error);
      throw error;
    }
  }

  // 📌 Update a registration using UID
  static async updateRegistration(data) {
    try {
      const conn = await getConnection();

      const existing = await this.getRegistrationByUserAndEvent(data.user_uid, data.event_uid);
      if (!existing) {
        return { success: false, message: 'Registration not found' };
      }

      const updateData = {
        Id: existing.Id
      };

      const result = await conn.sobject('Event_Registration__c').update(updateData);
      console.log('✅ Event registration updated:', result);
      return result;
    } catch (error) {
      console.error('❌ Error updating event registration:', error);
      throw error;
    }
  }

  // 📌 Delete a registration using UID
  static async deleteRegistration(userUid, eventUid) {
    try {
      const conn = await getConnection();

      const existing = await this.getRegistrationByUserAndEvent(userUid, eventUid);
      if (!existing) {
        return { success: false, message: 'Registration not found' };
      }

      const result = await conn.sobject('Event_Registration__c').destroy(existing.Id);
      console.log(`✅ Event registration with ID ${existing.Id} deleted.`);
      return result;
    } catch (error) {
      console.error('❌ Error deleting event registration:', error);
      throw error;
    }
  }
}

module.exports = EventRegistrationService;