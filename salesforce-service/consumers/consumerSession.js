const SessionService = require('./SessionCRUD');
const { parseStringPromise } = require('xml2js');
const connectRabbitmq = require('../rabbitmq');

async function startSessionConsumer() {
    console.log('Starting consumer: Session');
    try {
        // Connect to RabbitMQ server
        const connection = await connectRabbitmq();
        const channel = await connection.createChannel();

        // Assert queue
        const queueName = "crm.session";

        // Consume message from the queue
        channel.consume(queueName, async (message) => {
            if (message !== null) {
                try {
                    // Get data from xml
                    const xmlData = message.content.toString();
                    console.log('Received session message (raw):', xmlData);

                    const parsedData = await parseStringPromise(xmlData, {
                        explicitArray: false,
                        ignoreAttrs: true,
                        emptyTag: null,
                    });

                    console.log('Parsed session XML data:', JSON.stringify(parsedData, null, 2));

                    // Extract data from XML
                    const operation = parsedData?.attendify?.info?.operation;
                    const sender = parsedData?.attendify?.info?.sender;
                    const session = parsedData?.attendify?.session;

                    if (!operation || !sender || !session) {
                        console.error('Invalid message structure received:', JSON.stringify(parsedData, null, 2));
                        channel.nack(message, false, false);
                        return;
                    }

                    // Map XML data to Salesforce fields
                    const sessionData = {
                        uid: session.uid || null,
                        event_id: session.event_id || null,
                        title: session.title || null,
                        description: session.description || null,
                        date: session.date || null,
                        start_time: session.start_time || null,
                        end_time: session.end_time || null,
                        location: session.location || null,
                        max_attendees: parseInt(session.max_attendees, 10) || null,
                        speaker: {
                            name: session.speaker?.name || null,
                            bio: session.speaker?.bio || null,
                        },
                    };

                    console.log('Mapped Session Data:', sessionData);

                    if (sender.toLowerCase() !== "crm") {
                        console.log(`Processing operation '${operation}' for session from sender '${sender}'`);
                        if (operation === 'create') {
                            await SessionService.createSession(sessionData);
                            console.log(`Session created for: ${sessionData.title}`);
                        } else if (operation === 'update') {
                            if (!sessionData.uid) {
                                console.error("Cannot update session: 'uid' missing in XML.");
                            } else {
                                await SessionService.updateSession(sessionData);
                                console.log(`Session updated for UID: ${sessionData.uid}`);
                            }
                        } else if (operation === 'delete') {
                            if (!sessionData.uid) {
                                console.error("Cannot delete session: 'uid' missing in XML.");
                            } else {
                                await SessionService.deleteSessionById(sessionData.uid);
                                console.log(`Session deleted for UID: ${sessionData.uid}`);
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
                    console.error('Error processing session message:', processingError);
                    channel.nack(message, false, false);
                }
            }
        }, {
            noAck: false
        });
    } catch (error) {
        console.error('Error starting Session Consumer:', error);
    }
}

module.exports = startSessionConsumer;