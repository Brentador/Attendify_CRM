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
                name_event__c: eventData.name_event__c,
                Start_date__c: eventData.Start_date__c, // Moet een geldig Date/Time formaat zijn
                Organizer_Name__c: eventData.Organizer_Name__c,
                Organizer_UID__c: eventData.Organizer_UID__c,
                Entrance_Fee__c: eventData.Entrance_Fee__c,
                Uid__c: eventData.Uid__c

            };

            if (eventData.max_attendees__c) {
                dataToCreate.max_attendees__c = parseInt(eventData.max_attendees__c, 10); // Ensure it's an integer
            }

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
     * Updates an existing Event record in Salesforce based on its Uid__c.
     * @param {object} eventData - Object containing the event data to update.
     * MUST include the 'Uid__c' field to identify the record.
     * Other fields to update: Address__c, description__c, End_date__c, max_attendees__c, name_event__c, Start_date__c
     * @returns {Promise<object>} - The result of the update operation.
     */
    static async updateEvent(eventData) {
        if (!eventData.Uid__c) {
            throw new Error("Event 'Uid__c' is required to update.");
        }

        try {
            const conn = await getConnection();

            // 1. Find the record ID based on the Uid__c
            const query = `SELECT Id FROM Eventcrm__c WHERE Uid__c = '${eventData.Uid__c}' LIMIT 1`;
            const result = await conn.query(query);

            if (!result || result.records.length === 0) {
                console.log(`No event found with Uid__c: ${eventData.Uid__c}`);
                return { success: false, message: 'Event not found' };
            }

            const eventId = result.records[0].Id;

            // 2. Prepare the update data
            const eventToUpdate = { Id: eventId };
            const allowedUpdateFields = [
                'Address__c', 'description__c', 'End_date__c', 'max_attendees__c',
                'name_event__c', 'Start_date__c', 'Organizer_Name__c', 'Organizer_UID__c', 'Entrance_Fee__c'
            ];

            for (const [key, value] of Object.entries(eventData)) {
                // Update only allowed fields and skip null/undefined values
                if (allowedUpdateFields.includes(key) && value !== null && value !== undefined) {
                    eventToUpdate[key] = value;
                }
            }

            if (eventData.max_attendees__c) {
                eventToUpdate.max_attendees__c = parseInt(eventData.max_attendees__c, 10); // Ensure it's an integer
            }


            // Check if there is actually something to update (besides the Id)
            if (Object.keys(eventToUpdate).length <= 1) {
                console.log(`No updateable fields provided for event with Uid__c: ${eventData.Uid__c}`);
                return { success: true, message: 'No fields to update provided', id: eventId };
            }

            console.log(`Attempting to update Eventcrm__c (Id: ${eventId}) with data:`, eventToUpdate);
            // 3. Execute the update
            return await conn.sobject('Eventcrm__c').update(eventToUpdate);

        } catch (error) {
            console.error(`Error in updating event with Uid__c ${eventData.Uid__c}:`, error?.message || error);
            if (error.errorCode && error.fields) {
                console.error(`Salesforce Error Code: ${error.errorCode}, Fields: ${error.fields.join(', ')}`);
            }
            throw error;
        }
    }

    /**
     * Deletes an Event record from Salesforce based on its Uid__c.
     * @param {string} eventUid - The unique Uid__c value of the event to delete.
     * @returns {Promise<object>} - An object indicating success or failure.
     */
    static async deleteEvent(eventUid) {
        if (!eventUid) {
            return { success: false, message: 'Event Uid__c is required for deletion.' };
        }
        try {
            const conn = await getConnection();

            // Find the record ID based on the Uid__c
            const query = `SELECT Id FROM Eventcrm__c WHERE Uid__c = '${eventUid}'`;
            const result = await conn.query(query);

            if (result.records.length === 0) {
                console.log(`No event found with Uid__c: ${eventUid}`);
                return { success: false, message: 'Event not found' };
            }

            const eventId = result.records[0].Id;

            await conn.sobject('Eventcrm__c').destroy(eventId);
            console.log(`Event with Uid__c ${eventUid} (Id: ${eventId}) deleted successfully.`);
            return { success: true, message: 'Event deleted successfully' };

        } catch (error) {
            console.error(`Error deleting event with Uid__c ${eventUid}:`, error?.message || error);
            return { success: false, message: 'Error deleting event', error: error?.message || error };
        }
    }
}

module.exports = EventService;