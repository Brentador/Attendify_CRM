const amqp = require('amqplib');
const EventService = require('../EventCRUD'); // Import EventService
const { parseStringPromise } = require('xml2js');


async function startEventConsumer() {
    console.log('Starting Event consumer...');
    let connection;
    try {
        // Connect to RabbitMQ server
        connection = await amqp.connect(process.env.RABBITMQ_URL);
        console.log('Connected to RabbitMQ for Event Consumer.');
        const channel = await connection.createChannel();
        console.log('RabbitMQ channel created for Event Consumer.');

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
                        // Get data from xml
                        const xmlData = message.content.toString();
                        console.log('Received event message (raw):', xmlData);
                        const parsedData = await parseStringPromise(xmlData, { explicitArray: false, ignoreAttrs : true, emptyTag: null });
                        console.log('Parsed event XML data:', JSON.stringify(parsedData, null, 2));

                        // Extract data from xml
                        const operation = parsedData?.attendify?.info?.operation;
                        const sender = parsedData?.attendify?.info?.sender;
                        const event = parsedData?.attendify?.event; // Kijk naar 'event' node

                        if (!operation || !sender || !event) {
                             console.error('Invalid message structure received:', JSON.stringify(parsedData, null, 2));
                             channel.nack(message, false, false); // Verwerp bericht als ongeldig
                             return;
                        }

                         // Map XML data naar Salesforce veldnamen
                        const eventData = {
                            // Name (Auto Number) alleen relevant voor update/delete identificatie vanuit XML
                            Name: event?.event_crm_id || null, // Verwacht event_crm_id in XML voor Name
                            Address__c: event.address || null,
                            description__c: event.description || null,
                            End_date__c: event.end_date || null, // Zorg voor correct Date/Time formaat
                            max_attendees__c: event.max_attendees || null,
                            name_event__c: event.name_event || null,
                            Start_date__c: event.start_date || null, // Zorg voor correct Date/Time formaat
                            // Voeg andere velden toe indien nodig
                        };
                        console.log('Mapped Event Data:', eventData);


                        if (sender.toLowerCase() !== "crm") {
                            console.log(`Processing operation '${operation}' for event from sender '${sender}'`);
                            if (operation === 'create') {
                                // Voor create gebruiken we niet de Name uit XML
                                const createData = { ...eventData };
                                delete createData.Name; // Verwijder Name voor create call
                                await EventService.createEvent(createData);
                                console.log(`Event created based on message for: ${eventData.name_event__c}`);
                            } else if (operation === 'update') {
                                if (!eventData.Name) {
                                    console.error("Cannot update event: 'event_crm_id' (Name) missing in XML.");
                                } else {
                                    await EventService.updateEvent(eventData); // updateEvent verwacht Name
                                     console.log(`Event updated based on message for Name: ${eventData.Name}`);
                                }
                            } else if (operation === 'delete') {
                                 if (!eventData.Name) {
                                    console.error("Cannot delete event: 'event_crm_id' (Name) missing in XML.");
                                } else {
                                    await EventService.deleteEvent(eventData.Name); // deleteEvent verwacht Name
                                    console.log(`Event deleted based on message for Name: ${eventData.Name}`);
                                }
                            } else {
                                console.log(`Invalid operation received: ${operation}`);
                            }
                        } else {
                             console.log("Ignoring message from sender 'crm'.");
                        }

                        // Acknowledge message
                        channel.ack(message);
                        console.log("Message acknowledged.");

                    } catch (processingError) {
                        console.error('Error processing event message:', processingError);
                        // Overweeg nack (requeue=false) bij verwerkingsfouten om oneindige loops te voorkomen
                        channel.nack(message, false, false);
                    }
                }
            },
            {
                noAck: false // Zorg ervoor dat we handmatig acknowledgen
            }
        );
    } catch (error) {
        console.error('Error starting Event Consumer:', error);
        // Implementeer reconnect logica indien nodig
        if (connection) {
           await connection.close();
           console.log("RabbitMQ connection closed due to error.")
        }
        // setTimeout(startEventConsumer, 5000); // Probeer opnieuw te verbinden na 5 sec
    }
}

module.exports = startEventConsumer;