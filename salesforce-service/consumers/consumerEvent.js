const amqp = require('amqplib');
const EventService = require('./EventCRUD'); 
const { parseStringPromise } = require('xml2js');
const connectRabbitmq = require('../rabbitmq');


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
                        const parsedData = await parseStringPromise(xmlData, { explicitArray: false, ignoreAttrs : true, emptyTag: null });
                        console.log('Parsed event XML data:', JSON.stringify(parsedData, null, 2));

                        // Extract data from xml
                        const operation = parsedData?.attendify?.info?.operation;
                        const sender = parsedData?.attendify?.info?.sender;
                        const event = parsedData?.attendify?.event; 

                        if (!operation || !sender || !event) {
                             console.error('Invalid message structure received:', JSON.stringify(parsedData, null, 2));
                             channel.nack(message, false, false); 
                             return;
                        }

                         // Map XML data naar Salesforce veldnamen
                        const eventData = {
                            // Name (Auto Number) alleen relevant voor update/delete identificatie vanuit XML
                            Name: event?.event_crm_id || null, 
                            Address__c: event.address || null,
                            description__c: event.description || null,
                            End_date__c: event.end_date || null, // Zorg voor correct Date/Time formaat
                            max_attendees__c: event.max_attendees || null,
                            name_event__c: event.name_event || null,
                            Start_date__c: event.start_date || null, // Zorg voor correct Date/Time formaat
                            
                        };
                        console.log('Mapped Event Data:', eventData);


                        if (sender.toLowerCase() !== "crm") {
                            console.log(`Processing operation '${operation}' for event from sender '${sender}'`);
                            if (operation === 'create') {
                                
                                const createData = { ...eventData };
                                delete createData.Name; 
                                await EventService.createEvent(createData);
                                console.log(`Event created based on message for: ${eventData.name_event__c}`);
                            } else if (operation === 'update') {
                                if (!eventData.Name) {
                                    console.error("Cannot update event: 'event_crm_id' (Name) missing in XML.");
                                } else {
                                    await EventService.updateEvent(eventData); 
                                     console.log(`Event updated based on message for Name: ${eventData.Name}`);
                                }
                            } else if (operation === 'delete') {
                                 if (!eventData.Name) {
                                    console.error("Cannot delete event: 'event_crm_id' (Name) missing in XML.");
                                } else {
                                    await EventService.deleteEvent(eventData.Name); 
                                    console.log(`Event deleted based on message for Name: ${eventData.Name}`);
                                }
                            } else {
                                console.log(`Invalid operation received: ${operation}`);
                            }
                        } else {
                             console.log("Ignoring message from sender 'crm'.");
                        }

                        
                        channel.ack(message);
                        console.log("Message acknowledged.");

                    } catch (processingError) {
                        console.error('Error processing event message:', processingError);
                        
                        channel.nack(message, false, false);
                    }
                }
            },
            {
                noAck: false 
            }
        );
    } catch (error) {
        console.error('Error starting Event Consumer:', error);
        
        if (connection) {
           await connection.close();
           console.log("RabbitMQ connection closed due to error.")
        }
        
    }
}

module.exports = startEventConsumer;