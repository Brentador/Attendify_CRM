const { getConnection } = require('../salesforce');

class EventService {
    static async getSalesforceId(objectType, uid) {
      const conn = await getConnection();
      const result = await conn.query(`
        SELECT Id FROM ${objectType} WHERE uid__c = '${uid}' LIMIT 1
      `);
      return result.records[0]?.Id || null;
    }

    static async createEvent(eventData) {
      try {
        const conn = await getConnection();
          return await conn.sobject('Eventcrm__c').create({
            description__c: eventData.description__c,
            End_date__c: eventData.End_date__c,
            end_time__c: eventData.end_time__c,
            Entrance_Fee__c: eventData.Entrance_Fee__c,
            gcid__c: eventData.gcid__c,
            location__c: eventData.location__c,
            max_attendees__c: eventData.max_attendees__c,
            Organizer_Name__c: eventData.Organizer_Name__c,
            Organizer_UID__c: eventData.Organizer_UID__c,
            Start_date__c: eventData.Start_date__c,
            start_time__c: eventData.start_time__c,
            title__c: eventData.title__c,
            uid__c: eventData.uid__c
        });
        
      } catch (error) {
          console.error('Error in creating event:', error);
          return;
      }
    }
    
    static async updateEvent(eventData) {
      try {
          const conn = await getConnection();
          
          const result = await conn.sobject('Eventcrm__c')
              .find({ uid__c: eventData.uid__c })
              .execute();
          
          if (result && result.length > 0) {
            const event = result[0];
            const eventToUpdate = { Id: event.Id };
              for (const [key, value] of Object.entries(eventData)) {
                if (value !== null) {
                    eventToUpdate[key] = value;
                }
              }
              return await conn.sobject('Eventcrm__c').update(eventToUpdate);
          } else {
              console.log(`No event found with uid: ${eventData.uid}`);
              return { success: false, message: 'event not found' };
          }
      } catch (error) {
        console.error('Error in updating event:', error);
        return;
      } 
    }

    static async deleteEvent(uid){
      try{
        const conn = await getConnection();
  
        const query = `SELECT Id FROM Eventcrm__c WHERE uid__c = '${uid}'`
        const result = await conn.query(query);
  
        if (result.records.length === 0){
          console.log(`No event found with uid: ${uid}`)
          return { success: false, message: 'Event not found' }
        }
  
        const eventId = result.records[0].Id;
  
        await conn.sobject('Eventcrm__c').destroy(eventId);
        console.log(`Event with uid ${uid} deleted successfully.`);
        return { success: true, message: 'Event deleted successfully' };
      }catch (error) {
        console.error(`Error deleting event with uid ${uid}:`, error);
        return { success: false, message: 'Error deleting event', error };
      }
    }

    static async registerEvent(eventRegisterData) {
        try {
            const conn = await getConnection();
            const userId = await this.getSalesforceId('Users_CRM__c', eventRegisterData.user_uid__c);
            const eventId = await this.getSalesforceId('Eventcrm__c', eventRegisterData.event_uid__c);

            const result = await conn.sobject('Event_registration__c').create({
                user_uid__c: eventRegisterData.user_uid__c,
                event_uid__c: eventRegisterData.event_uid__c,
                User__c: userId,
                Event_crm__c: eventId
            });
            console.log('Event registered successfully:', result);
            return result;
        } catch (error) {
            console.error('Error in registering event:', error);
            return null;
        }
    }

    static async unregisterEvent(eventRegisterData) {
        try {
            const conn = await getConnection();
            const recordId = await conn.sobject('Event_registration__c').findOne({
                user_uid__c: eventRegisterData.user_uid__c,
                event_uid__c: eventRegisterData.event_uid__c
            }, 'Id');

            await conn.sobject('Event_registration__c').destroy(recordId.Id);
        } catch (error) {
            console.error('Error in unregistering event:', error);
            return null;
        }
    }
  }

  
   

module.exports = EventService;