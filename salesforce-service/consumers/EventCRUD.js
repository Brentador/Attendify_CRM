// const { getConnection } = require('../salesforce');

// class EventService {
//     /**
//      * Creates a new Event record in Salesforce.
//      * @param {object} eventData - Object containing the event data.
//      * Expected fields: Address__c, description__c, End_date__c, max_attendees__c, name_event__c, Start_date__c
//      * @returns {Promise<object>} - The result of the creation operation.
//      */
//     static async createEvent(eventData) {
//         try {
//             const conn = await getConnection();
//             const dataToCreate = {
//                 Address__c: eventData.Address__c,
//                 description__c: eventData.description__c,
//                 End_date__c: eventData.End_date__c, // Moet een geldig Date/Time formaat zijn
//                 name_event__c: eventData.name_event__c,
//                 Start_date__c: eventData.Start_date__c, // Moet een geldig Date/Time formaat zijn
//                 Organizer_Name__c: eventData.Organizer_Name__c,
//                 Organizer_UID__c: eventData.Organizer_UID__c,
//                 Entrance_Fee__c: eventData.Entrance_Fee__c,
//                 uid__c: eventData.Uid__c

//             };

//             if (eventData.max_attendees__c) {
//                 dataToCreate.max_attendees__c = parseInt(eventData.max_attendees__c, 10); // Ensure it's an integer
//             }

//             // Verwijder eventuele undefined of null properties om fouten te voorkomen
//             Object.keys(dataToCreate).forEach(key => {
//                 if (dataToCreate[key] === undefined || dataToCreate[key] === null) {
//                     delete dataToCreate[key];
//                 }
//             });

//             console.log("Attempting to create Event_CRM__c with data:", dataToCreate);
//             return await conn.sobject('Eventcrm__c').create(dataToCreate);

//         } catch (error) {
//             console.error('Error in creating event:', error?.message || error);
//             if (error.errorCode && error.fields) {
//                 console.error(`Salesforce Error Code: ${error.errorCode}, Fields: ${error.fields.join(', ')}`);
//             }
//             throw error;
//         }
//     }

//     /**
//      * Updates an existing Event record in Salesforce based on its Uid__c.
//      * @param {object} eventData - Object containing the event data to update.
//      * MUST include the 'Uid__c' field to identify the record.
//      * Other fields to update: Address__c, description__c, End_date__c, max_attendees__c, name_event__c, Start_date__c
//      * @returns {Promise<object>} - The result of the update operation.
//      */
//     static async updateEvent(eventData) {
//         if (!eventData.Uid__c) {
//             throw new Error("Event 'Uid__c' is required to update.");
//         }

//         try {
//             const conn = await getConnection();

//             // 1. Find the record ID based on the Uid__c
//             const query = `SELECT Id FROM Eventcrm__c WHERE uid__c = '${eventData.Uid__c}' LIMIT 1`;
//             const result = await conn.query(query);

//             if (!result || result.records.length === 0) {
//                 console.log(`No event found with uid__c: ${eventData.Uid__c}`);
//                 return { success: false, message: 'Event not found' };
//             }

//             const eventId = result.records[0].Id;

//             // 2. Prepare the update data
//             const eventToUpdate = { Id: eventId };
//             const allowedUpdateFields = [
//                 'Address__c', 'description__c', 'End_date__c', 'max_attendees__c',
//                 'name_event__c', 'Start_date__c', 'Organizer_Name__c', 'Organizer_UID__c', 'Entrance_Fee__c'
//             ];

//             for (const [key, value] of Object.entries(eventData)) {
//                 // Update only allowed fields and skip null/undefined values
//                 if (allowedUpdateFields.includes(key) && value !== null && value !== undefined) {
//                     eventToUpdate[key] = value;
//                 }
//             }

//             if (eventData.max_attendees__c) {
//                 eventToUpdate.max_attendees__c = parseInt(eventData.max_attendees__c, 10); // Ensure it's an integer
//             }


//             // Check if there is actually something to update (besides the Id)
//             if (Object.keys(eventToUpdate).length <= 1) {
//                 console.log(`No updateable fields provided for event with uid__c: ${eventData.Uid__c}`);
//                 return { success: true, message: 'No fields to update provided', id: eventId };
//             }

//             console.log(`Attempting to update Eventcrm__c (Id: ${eventId}) with data:`, eventToUpdate);
//             // 3. Execute the update
//             return await conn.sobject('Eventcrm__c').update(eventToUpdate);

//         } catch (error) {
//             console.error(`Error in updating event with uid__c ${eventData.Uid__c}:`, error?.message || error);
//             if (error.errorCode && error.fields) {
//                 console.error(`Salesforce Error Code: ${error.errorCode}, Fields: ${error.fields.join(', ')}`);
//             }
//             throw error;
//         }
//     }

//     /**
//      * Deletes an Event record from Salesforce based on its Uid__c.
//      * @param {string} eventUid - The unique Uid__c value of the event to delete.
//      * @returns {Promise<object>} - An object indicating success or failure.
//      */
//     static async deleteEvent(eventUid) {
//         if (!eventUid) {
//             return { success: false, message: 'Event uid__c is required for deletion.' };
//         }
//         try {
//             const conn = await getConnection();

//             // Find the record ID based on the Uid__c
//             const query = `SELECT Id FROM Eventcrm__c WHERE uid__c = '${eventUid}'`;
//             const result = await conn.query(query);

//             if (result.records.length === 0) {
//                 console.log(`No event found with uid__c: ${eventUid}`);
//                 return { success: false, message: 'Event not found' };
//             }

//             const eventId = result.records[0].Id;

//             await conn.sobject('Eventcrm__c').destroy(eventId);
//             console.log(`Event with uid__c ${eventUid} (Id: ${eventId}) deleted successfully.`);
//             return { success: true, message: 'Event deleted successfully' };

//         } catch (error) {
//             console.error(`Error deleting event with uid__c ${eventUid}:`, error?.message || error);
//             return { success: false, message: 'Error deleting event', error: error?.message || error };
//         }
//     }
// }

// module.exports = EventService;

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
            console.log('recordId:', recordId)

            await conn.sobject('Event_registration__c').destroy(recordId.Id);
        } catch (error) {
            console.error('Error in unregistering event:', error);
            return null;
        }
    }
  }

  
   

module.exports = EventService;