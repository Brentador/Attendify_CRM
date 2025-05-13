const { getConnection } = require('../salesforce'); 

class EventService {
    /**
     * Creates a new Event record in Salesforce.
     * @param {object} eventData - Object containing the event data.
     * Expected fields: Address__c, description__c, End_date__c, max_attendees__c, name_event__c, Start_date__c
     * @returns {Promise<object>} - The result of the creation operation.
     */
    static async createEvent(eventData) {
      try {
          const conn = await getConnection();
          const dataToCreate = {
            Address__c: eventData.Address__c,
            description__c: eventData.description__c,
            End_date__c: eventData.End_date__c, // Moet een geldig Date/Time formaat zijn
            max_attendees__c: eventData.max_attendees__c, // Moet een Number zijn
            name_event__c: eventData.name_event__c,
            Start_date__c: eventData.Start_date__c // Moet een geldig Date/Time formaat zijn
          };

          // Verwijder eventuele undefined of null properties om fouten te voorkomen
          Object.keys(dataToCreate).forEach(key => {
            if (dataToCreate[key] === undefined || dataToCreate[key] === null) {
                delete dataToCreate[key];
            }
          });


          console.log("Attempting to create Event_CRM__c with data:", dataToCreate);
          return await conn.sobject('Eventcrm__c').create(dataToCreate);

      } catch (error) {
          console.error('Error in creating event:', error?.message || error);
          if (error.errorCode && error.fields) {
              console.error(`Salesforce Error Code: ${error.errorCode}, Fields: ${error.fields.join(', ')}`);
          }
          throw error;
      }
    }

    /**
     * Updates an existing Event record in Salesforce based on its Name (Auto Number).
     * @param {object} eventData - Object containing the event data to update.
     * MUST include the 'Name' field (e.g., "E-0001") to identify the record.
     * Other fields to update: Address__c, description__c, End_date__c, max_attendees__c, name_event__c, Start_date__c
     * @returns {Promise<object>} - The result of the update operation.
     */
    static async updateEvent(eventData) {
        
        if (!eventData.Name) {
            throw new Error("Event 'Name' (Auto Number field value) is required to update.");
        }

        try {
            const conn = await getConnection();

            // 1. Vind de record ID op basis van de unieke Name (Auto Number)
            const query = `SELECT Id FROM Eventcrm__c WHERE Name = '${eventData.Name}' LIMIT 1`;
            const result = await conn.query(query);

            if (!result || result.records.length === 0) {
                console.log(`No event found with Name: ${eventData.Name}`);
                // Je kunt hier null retourneren, een fout gooien, of een specifieke status teruggeven
                return { success: false, message: 'Event not found' };
            }

            const eventId = result.records[0].Id;

            // 2. Bereid de update data voor
            const eventToUpdate = { Id: eventId };
            const allowedUpdateFields = [
                'Address__c', 'description__c', 'End_date__c',
                'max_attendees__c', 'name_event__c', 'Start_date__c'
            ];

            for (const [key, value] of Object.entries(eventData)) {
                // Update alleen toegestane velden en sla null/undefined waarden over
                // Sla ook de 'Name' en 'Id' zelf over voor de update payload
                if (allowedUpdateFields.includes(key) && value !== null && value !== undefined) {
                    eventToUpdate[key] = value;
                }
            }

            // Controleer of er daadwerkelijk iets te updaten is (behalve de Id)
            if (Object.keys(eventToUpdate).length <= 1) {
                console.log(`No updateable fields provided for event with Name: ${eventData.Name}`);
                // Retourneer succes omdat de record bestaat, maar er is niets gewijzigd
                return { success: true, message: 'No fields to update provided', id: eventId };
            }

            console.log(`Attempting to update Eventcrm__c (Id: ${eventId}) with data:`, eventToUpdate);
            // 3. Voer de update uit
            return await conn.sobject('Eventcrm__c').update(eventToUpdate);

        } catch (error) {
            console.error(`Error in updating event with Name ${eventData.Name}:`, error?.message || error);
            if (error.errorCode && error.fields) {
                console.error(`Salesforce Error Code: ${error.errorCode}, Fields: ${error.fields.join(', ')}`);
            }
            throw error;
        }
    }

    /**
     * Deletes an Event record from Salesforce based on its Name (Auto Number).
     * @param {string} eventRecordName - The unique Name (Auto Number value, e.g., "E-0001") of the event to delete.
     * @returns {Promise<object>} - An object indicating success or failure.
     */
    static async deleteEvent(eventRecordName){
      if (!eventRecordName) {
        return { success: false, message: 'Event Name (Auto Number) is required for deletion.' };
      }
      try{
        const conn = await getConnection();

        // Vind de record ID op basis van de unieke Name (Auto Number)
        const query = `SELECT Id FROM Eventcrm__c WHERE Name = '${eventRecordName}'`;
        const result = await conn.query(query);

        if (result.records.length === 0){
          console.log(`No event found with Name: ${eventRecordName}`);
          return { success: false, message: 'Event not found' };
        }

        const eventId = result.records[0].Id;

        
        await conn.sobject('Eventcrm__c').destroy(eventId);
        console.log(`Event with Name ${eventRecordName} (Id: ${eventId}) deleted successfully.`);
        return { success: true, message: 'Event deleted successfully' };

      } catch (error) {
        console.error(`Error deleting event with Name ${eventRecordName}:`, error?.message || error);
        return { success: false, message: 'Error deleting event', error: error?.message || error };
      }
    }
}

module.exports = EventService; 