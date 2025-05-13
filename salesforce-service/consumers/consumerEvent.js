const amqp = require('amqplib');
const EventService = require('./EventCRUD'); // Import EventService
const { parseStringPromise } = require('xml2js');
const connectRabbitmq = require('../rabbitmq'); // Adjust the path as necessary

async function startEventConsumer() {
    console.log('Starting Event consumer...');
    let connection;
    try {
        // Connect to RabbitMQ server
        const connection = await connectRabbitmq();
        console.log('Connected to RabbitMQ3.');
        const channel =  await connection.createChannel();
        console.log('Connected to RabbitMQ4.');

        //assert queue
        channel.assertQueue("crm.event", { durable: true });
        console.log(`Consumer is listening on queue: crm.event`);

        // Consume message from the queue
        channel.consume(
            "crm.event",
            async (message) => {
                if (message !== null) {
                    try {
                        // Get data from xml
                        const xmlData = message.content.toString();
                        console.log('Received event message (raw):', xmlData);

                        // Parse XML
                        // The new XML is flat, so parsedData will directly contain uid, title, etc.
                        const parsedData = await parseStringPromise(xmlData, {
                            explicitArray: false,
                            ignoreAttrs: true,
                            emptyTag: null,
                            trim: true // Good for values like <gcid> 151515213 </gcid>
                        });
                        console.log('Parsed event XML data:', JSON.stringify(parsedData, null, 2));

                        // Extract operation and sender from message properties (headers)
                        // Fallback to default values if not present
                        const operation = message.properties.headers?.operation || 'create'; // e.g., 'create', 'update', 'delete'
                        const sender = message.properties.headers?.sender || 'external_system'; // e.g., 'your_external_system_name'

                        // --- Validate essential data from XML ---
                        // The root element of your XML is not defined in the example,
                        // so xml2js will create an object with keys being the top-level tags.
                        // If your XML was wrapped in <event>...</event>, it would be parsedData.event.uid
                        // Given the example, it's directly parsedData.uid, parsedData.title etc.
                        const eventUid = parsedData.uid; // This is your primary identifier
                        const eventTitle = parsedData.title;

                        if (!eventUid || !eventTitle) {
                            console.error('Invalid message structure or missing essential fields (uid, title):', JSON.stringify(parsedData, null, 2));
                            channel.nack(message, false, false); // Reject and don't requeue
                            return;
                        }

                        // --- Map XML data to Salesforce field names ---
                        // Combine date and time for Salesforce DateTime fields
                        let startDateSalesforce = null;
                        if (parsedData.start_date && parsedData.start_time) {
                            // Ensure time has seconds for full ISO8601, or that Salesforce can handle HH:mm
                            startDateSalesforce = new Date(`${parsedData.start_date}T${parsedData.start_time}:00`).toISOString();
                        }

                        let endDateSalesforce = null;
                        if (parsedData.end_date && parsedData.end_time) {
                            endDateSalesforce = new Date(`${parsedData.end_date}T${parsedData.end_time}:00`).toISOString();
                        }

                        const eventData = {
                            // Assuming you have an External_ID__c field in Salesforce to store 'uid'
                            Uid__c: eventUid, // XML uid -> Salesforce Uid__c (External ID)
                            name_event__c: eventTitle, // XML title -> Salesforce name_event__c
                            Address__c: eventDetails.location || null,
                            description__c: eventDetails.description || null,
                            Start_date__c: startDateSalesforce,
                            End_date__c: endDateSalesforce,
                            Organizer_Name__c: eventDetails.organizer_name || null,
                            Organizer_UID__c: eventDetails.organizer_uid || null,
                            Entrance_Fee__c: eventDetails.entrance_fee || null, // Assuming Entrance_Fee__c
                            // max_attendees__c: not present in the new XML, so it will be null or handled by EventService
                        };
                        console.log('Mapped Event Data:', JSON.stringify(eventData, null, 2));


                        // --- Process based on operation ---
                        // The original code ignored messages from 'crm'. Adapt if needed.
                        if (sender.toLowerCase() !== "crm") {
                            console.log(`Processing operation '${operation}' for event with UID '${eventUid}' from sender '${sender}'`);

                            if (operation === 'create') {
                                // For create, EventService.createEvent should handle the data.
                                // It typically shouldn't receive an existing Salesforce ID (like 'Name' auto-number)
                                // External_ID__c is good to pass for creation to link it.
                                await EventService.createEvent(eventData);
                                console.log(`Event created based on message for UID: ${eventUid}, Title: ${eventData.name_event__c}`);
                            } else if (operation === 'update') {
                                // For update, EventService.updateEvent needs to know how to find the record.
                                // It could use External_ID__c. The EventService.updateEvent method
                                // might need to be adapted to accept an object containing the External_ID__c
                                // or take the external ID as a separate parameter.
                                // Let's assume EventService.updateEvent can find by External_ID__c if it's in the payload.
                                await EventService.updateEvent(eventData);
                                console.log(`Event updated based on message for UID: ${eventUid}`);
                            } else if (operation === 'delete') {
                                // For delete, EventService.deleteEvent needs the identifier.
                                // The original used 'Name' (Salesforce Auto Number).
                                // Now, we should use the external identifier 'uid'.
                                // EventService.deleteEvent will need to be able to delete by this external ID.
                                await EventService.deleteEvent(eventUid); // Pass the UID for deletion
                                console.log(`Event deleted based on message for UID: ${eventUid}`);
                            } else {
                                console.warn(`Invalid operation received: ${operation}. Message will be nacked.`);
                                channel.nack(message, false, false); // Invalid operation, nack
                                return; // Important to return after nack
                            }
                        } else {
                            console.log(`Ignoring message from sender 'crm' for event UID '${eventUid}'.`);
                        }

                        channel.ack(message);
                        console.log("Message acknowledged.");

                    } catch (processingError) {
                        console.error('Error processing event message:', processingError);
                        // Nack the message, false for requeue means it might go to a DLQ or be discarded
                        channel.nack(message, false, false);
                    }
                }
            },
            {
                noAck: false // We will manually acknowledge
            }
        );
    } catch (error) {
        console.error('Error starting Event Consumer:', error);
        if (connection) {
            try {
                await connection.close();
                console.log("RabbitMQ connection closed due to startup error.");
            } catch (closeError) {
                console.error("Error closing RabbitMQ connection:", closeError);
            }
        }
        // Consider re-throwing or exiting if consumer cannot start
        // process.exit(1); // Or implement a retry mechanism
    }
}

module.exports = startEventConsumer;

// --- Important considerations for your EventService ---
// 1. EventService.createEvent(data):
//    - Should map `data.External_ID__c` to the correct Salesforce external ID field.
//    - Should map other fields accordingly.
//
// 2. EventService.updateEvent(data):
//    - Must be able to find the Salesforce record using `data.External_ID__c`.
//    - Then, update the found record with the other fields in `data`.
//    - Alternatively, change signature to `EventService.updateEvent(externalId, dataToUpdate)`.
//
// 3. EventService.deleteEvent(externalId):
//    - Must be able to find and delete the Salesforce record using the provided `externalId` (which is `eventUid`).
//
// Ensure your Salesforce object for Events has custom fields like:
// - External_ID__c (Text, Unique, External ID) for `uid`
// - GCID__c (Text or Number) for `gcid`
// - name_event__c (Text) for `title`
// - description__c (Long Text Area) for `description`
// - Address__c (Text or Address Compound Field) for `location`
// - Start_date__c (DateTime) for combined `start_date` and `start_time`
// - End_date__c (DateTime) for combined `end_date` and `end_time`
// - Organizer_Name__c (Text) for `organizer_name`
// - Organizer_UID__c (Text, potentially Lookup if Organizers are also synced) for `organizer_uid`
// - Entrance_Fee__c (Currency or Number) for `entrance_fee`
//
// --- How to send messages with headers (example using amqplib for publisher) ---
/*
async function publishEventMessage(channel, queueName, xmlPayload, operationType, senderSystem) {
    channel.sendToQueue(queueName, Buffer.from(xmlPayload), {
        persistent: true,
        headers: {
            operation: operationType, // 'create', 'update', or 'delete'
            sender: senderSystem     // e.g., 'myApp'
        }
    });
}
*/