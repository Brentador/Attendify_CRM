const EventService = require('./EventCRUD'); // Import EventService
const { parseStringPromise } = require('xml2js');
const connectRabbitmq = require('../rabbitmq'); // Adjust the path as necessary

async function startEventConsumer() {
    console.log('Starting Event consumer...');
    // Jouw RabbitMQ connectie logica:
    let connection; // Behoud 'connection' in bredere scope voor sluiten in catch
    try {
        // Connect to RabbitMQ server
        connection = await connectRabbitmq(); // Gebruik jouw helper
        const channel = await connection.createChannel();

        // Assert queue
        const queueName = "crm.event"; // Queue voor events
        await channel.assertQueue(queueName, { durable: true });
        console.log(`Event Consumer is listening on queue: ${queueName}`);

        // Consume message from the queue
        channel.consume(
            queueName,
            async (message) => {
                if (message !== null) {
                    try {
                        const xmlData = message.content.toString();
                        console.log('Received event message (raw):', xmlData);

                        const parsedData = await parseStringPromise(xmlData, {
                            explicitArray: false,
                            ignoreAttrs: true,
                            emptyTag: null,
                            trim: true
                        });
                        console.log('Parsed event XML data:', JSON.stringify(parsedData, null, 2));

                        // --- Extract data from the NESTED XML structure ---
                        const operation = parsedData?.attendify?.info?.operation;
                        const sender = parsedData?.attendify?.info?.sender;
                        const eventDetails = parsedData?.attendify?.event; // Haal het hele event object op

                        // Valideer essentiële delen van de structuur
                        if (!operation || !sender || !eventDetails) {
                            console.error('Invalid message structure: Missing attendify.info or attendify.event. Parsed:', JSON.stringify(parsedData, null, 2));
                            channel.nack(message, false, false);
                            return;
                        }

                        // --- Extract key identifiers FROM eventDetails ---
                        // BELANGRIJK: De XML MOET <uid> en <title> binnen <event> bevatten
                        const eventUid = eventDetails.uid;
                        const eventTitle = eventDetails.title;

                        if (!eventUid || !eventTitle) {
                            console.error('Invalid event data: Missing uid or title within attendify.event. Event Details:', JSON.stringify(eventDetails, null, 2));
                            channel.nack(message, false, false);
                            return;
                        }

                        // --- Map XML data naar Salesforce veldnamen ---
                        let startDateSalesforce = null;
                        if (eventDetails.start_date && eventDetails.start_time) {
                            const timeParts = eventDetails.start_time.split(':');
                            const startTimeFormatted = `${timeParts[0]}:${timeParts[1]}:${timeParts[2] || '00'}`;
                            startDateSalesforce = new Date(`${eventDetails.start_date}T${startTimeFormatted}`).toISOString();
                        }

                        let endDateSalesforce = null;
                        if (eventDetails.end_date && eventDetails.end_time) {
                            const timeParts = eventDetails.end_time.split(':');
                            const endTimeFormatted = `${timeParts[0]}:${timeParts[1]}:${timeParts[2] || '00'}`;
                            endDateSalesforce = new Date(`${eventDetails.end_date}T${endTimeFormatted}`).toISOString();
                        }

                        const salesforceData = {
                            Uid__c: eventUid, // Van eventDetails.uid
                            name_event__c: eventTitle, // Van eventDetails.title
                            Address__c: eventDetails.location || null,
                            description__c: eventDetails.description || null,
                            Start_date__c: startDateSalesforce,
                            End_date__c: endDateSalesforce,
                            Organizer_Name__c: eventDetails.organizer_name || null,
                            Organizer_UID__c: eventDetails.organizer_uid || null,
                            Entrance_Fee__c: eventDetails.entrance_fee || null,
                            // Als GCID__c bestaat in Salesforce en je wilt het mappen:
                            // GCID__c: eventDetails.gcid || null,
                            // Als max_attendees__c bestaat en je wilt het mappen:
                            // max_attendees__c: eventDetails.max_attendees ? parseInt(eventDetails.max_attendees, 10) : null,
                        };
                        console.log('Mapped Salesforce Data:', JSON.stringify(salesforceData, null, 2));

                        // --- Process based on operation ---
                        if (sender.toLowerCase() !== "crm") {
                            console.log(`Processing operation '${operation}' for event UID '${eventUid}' from sender '${sender}'`);

                            if (operation === 'create') {
                                await EventService.createEvent(salesforceData);
                                console.log(`Event created for UID: ${eventUid}, Title: ${salesforceData.name_event__c}`);
                            } else if (operation === 'update') {
                                await EventService.updateEvent(salesforceData); // Moet Uid__c gebruiken voor lookup
                                console.log(`Event updated for UID: ${eventUid}`);
                            } else if (operation === 'delete') {
                                await EventService.deleteEvent(eventUid); // eventUid is de waarde van Uid__c
                                console.log(`Event deleted for UID: ${eventUid}`);
                            } else {
                                console.warn(`Invalid operation received: '${operation}'. Message will be nacked.`);
                                channel.nack(message, false, false);
                                return;
                            }
                        } else {
                            console.log(`Ignoring message from sender 'crm' for event UID '${eventUid}'.`);
                        }

                        channel.ack(message);
                        console.log("Message acknowledged.");

                    } catch (processingError) {
                        console.error('Error processing event message:', processingError);
                        if (channel && message) { // Zorg ervoor dat channel bestaat voordat je nack probeert
                            channel.nack(message, false, false);
                            console.log("Message nacked due to processing error.");
                        }
                    }
                }
            },
            {
                noAck: false // Handmatig acknowledgen
            }
        );
    } catch (error) {
        console.error('Error starting Event Consumer or during RabbitMQ setup:', error); // Aangepaste error message
        if (connection) { // Als de connectie was gemaakt voor de error
            try {
                await connection.close();
                console.log("RabbitMQ connection closed due to error in consumer setup or processing."); // Aangepaste error message
            } catch (closeError) {
                console.error("Error closing RabbitMQ connection during error handling:", closeError);
            }
        }
    }
}

module.exports = startEventConsumer;