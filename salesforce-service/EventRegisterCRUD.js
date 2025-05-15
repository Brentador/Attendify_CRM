const { getConnection } = require('./salesforce'); // Pas pad aan indien nodig

class EventRegistrationService {
  // 📌 Create an event registration
  static async createRegistration(data) {
    try {
      const conn = await getConnection();

      const result = await conn.sobject('Event_Registration__c').create({
        user__c: data.user_id,
        Event_crm__c: data.event_id
      });

      console.log('✅ Event registration created:', result);
      return result;
    } catch (error) {
      console.error('❌ Error creating event registration:', error);
      throw error;
    }
  }

  // 📌 Read a registration by user + event combo
  static async getRegistrationByUserAndEvent(userId, eventId) {
    try {
      const conn = await getConnection();

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

  // 📌 Update a registration
  static async updateRegistration(data) {
    try {
      const conn = await getConnection();

      const existing = await this.getRegistrationByUserAndEvent(data.user_id, data.event_id);
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

  // 📌 Delete a registration
  static async deleteRegistration(userId, eventId) {
    try {
      const conn = await getConnection();

      const existing = await this.getRegistrationByUserAndEvent(userId, eventId);
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