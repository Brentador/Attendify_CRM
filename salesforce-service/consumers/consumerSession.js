const amqp = require('amqplib');
const SessionService = require('../SessionService'); // Import SessionService
const { parseStringPromise } = require('xml2js');

async function startSessionConsumer() {
    console.log('Starting Session consumer...');
    let connection;
    try {
        connection = await amqp.connect(process.env.RABBITMQ_URL);
        console.log('Connected to RabbitMQ for Session Consumer.');
        const channel = await connection.createChannel();
        console.log('RabbitMQ channel created for Session Consumer.');

        const queueName = "crm.session";
        await channel.assertQueue(queueName, { durable: true });
        console.log(`Session Consumer is listening on queue: ${queueName}`);

        channel.consume(
            queueName,
            async (message) => {
                if (message !== null) {
                    try {
                        const xmlData = message.content.toString();
                        console.log('Received session message (raw):', xmlData);
                        const parsedData = await parseStringPromise(xmlData, { explicitArray: false, ignoreAttrs: true, emptyTag: null });
                        console.log('Parsed session XML data:', JSON.stringify(parsedData, null, 2));

                        const operation = parsedData?.attendify?.info?.operation;
                        const sender = parsedData?.attendify?.info?.sender;
                        const session = parsedData?.attendify?.session;

                        if (!operation || !sender || !session) {
                            console.error('Invalid message structure received:', JSON.stringify(parsedData, null, 2));
                            channel.nack(message, false, false);
                            return;
                        }

                        const sessionData = {
                            Name: session?.session_crm_id || null,
                            speaker__c: session.speaker || null,
                            uid_event__c: session.uid_event || null,
                            description__c: session.description || null,
                            location__c: session.location || null,
                            start_date__c: session.start_date || null,
                            end_date__c: session.end_date || null,
                        };
                        console.log('Mapped Session Data:', sessionData);

                        if (sender.toLowerCase() !== "crm") {
                            console.log(`Processing operation '${operation}' for session from sender '${sender}'`);
                            if (operation === 'create') {
                                const createData = { ...sessionData };
                                delete createData.Name;
                                await SessionService.createSession(createData);
                                console.log(`Session created based on message for UID Event: ${sessionData.uid_event__c}`);
                            } else if (operation === 'update') {
                                if (!sessionData.Name) {
                                    console.error("Cannot update session: 'session_crm_id' (Name) missing in XML.");
                                } else {
                                    await SessionService.updateSession(sessionData);
                                    console.log(`Session updated based on message for Name: ${sessionData.Name}`);
                                }
                            } else if (operation === 'delete') {
                                if (!sessionData.Name) {
                                    console.error("Cannot delete session: 'session_crm_id' (Name) missing in XML.");
                                } else {
                                    await SessionService.deleteSessionById(sessionData.Name);
                                    console.log(`Session deleted based on message for Name: ${sessionData.Name}`);
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
            },
            {
                noAck: false
            }
        );
    } catch (error) {
        console.error('Error starting Session Consumer:', error);

        if (connection) {
            await connection.close();
            console.log("RabbitMQ connection closed due to error.");
        }
    }
}

module.exports = startSessionConsumer;