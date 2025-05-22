// const SessionService = require('./SessionCRUD');
// const { parseStringPromise } = require('xml2js');
// const connectRabbitmq = require('../rabbitmq');

// async function startSessionConsumer() {
//     console.log('Starting Session consumer...');
//     try {
//         // Connect to RabbitMQ server
//         const connection = await connectRabbitmq();
//         console.log('Connected to RabbitMQ.');
//         const channel = await connection.createChannel();
//         console.log('RabbitMQ channel created for Session Consumer.');

//         // Assert queue
//         const queueName = "crm.session";
//         await channel.assertQueue(queueName, { durable: true });
//         console.log(`Session Consumer is listening on queue: ${queueName}`);

//         // Consume message from the queue
//         channel.consume(queueName, async (message) => {
//             if (message !== null) {
//                 try {
//                     // Get data from xml
//                     const xmlData = message.content.toString();
//                     console.log('Received session message (raw):', xmlData);

//                     const parsedData = await parseStringPromise(xmlData, {
//                         explicitArray: false,
//                         ignoreAttrs: true,
//                         emptyTag: null,
//                     });

//                     console.log('Parsed session XML data:', JSON.stringify(parsedData, null, 2));

//                     // Extract data from XML
//                     const operation = parsedData?.attendify?.info?.operation;
//                     const sender = parsedData?.attendify?.info?.sender;
//                     const session = parsedData?.attendify?.session;

//                     if (!operation || !sender || !session) {
//                         console.error('Invalid message structure received:', JSON.stringify(parsedData, null, 2));
//                         channel.nack(message, false, false);
//                         return;
//                     }

//                     // Map XML data to Salesforce fields
//                     const sessionData = {
//                         uid: session.uid || null,
//                         event_id: session.event_id || null,
//                         title: session.title || null,
//                         description: session.description || null,
//                         date: session.date || null,
//                         start_time: session.start_time || null,
//                         end_time: session.end_time || null,
//                         location: session.location || null,
//                         max_attendees: parseInt(session.max_attendees, 10) || null,
//                         speaker: {
//                             name: session.speaker?.name || null,
//                             bio: session.speaker?.bio || null,
//                         },
//                     };

//                     console.log('Mapped Session Data:', sessionData);

//                     if (sender.toLowerCase() !== "crm") {
//                         console.log(`Processing operation '${operation}' for session from sender '${sender}'`);
//                         if (operation === 'create') {
//                             await SessionService.createSession(sessionData);
//                             console.log(`Session created for: ${sessionData.title}`);
//                         } else if (operation === 'update') {
//                             if (!sessionData.uid) {
//                                 console.error("Cannot update session: 'uid' missing in XML.");
//                             } else {
//                                 await SessionService.updateSession(sessionData);
//                                 console.log(`Session updated for UID: ${sessionData.uid}`);
//                             }
//                         } else if (operation === 'delete') {
//                             if (!sessionData.uid) {
//                                 console.error("Cannot delete session: 'uid' missing in XML.");
//                             } else {
//                                 await SessionService.deleteSessionById(sessionData.uid);
//                                 console.log(`Session deleted for UID: ${sessionData.uid}`);
//                             }
//                         } else {
//                             console.log(`Invalid operation received: ${operation}`);
//                         }
//                     } else {
//                         console.log("Ignoring message from sender 'crm'.");
//                     }

//                     channel.ack(message);
//                     console.log("Message acknowledged.");

//                 } catch (processingError) {
//                     console.error('Error processing session message:', processingError);
//                     channel.nack(message, false, false);
//                 }
//             }
//         }, {
//             noAck: false
//         });
//     } catch (error) {
//         console.error('Error starting Session Consumer:', error);
//     }
// }

// module.exports = startSessionConsumer;

const SessionService = require('./SessionCRUD');
const { parseStringPromise } = require('xml2js');
const connectRabbitmq = require('../rabbitmq');

async function startSessionConsumer() {
    console.log('Starting consumer...');
    try{
        const connection = await connectRabbitmq();
        console.log('Connected to RabbitMQ.');
        const channel =  await connection.createChannel();
        console.log('Connected to RabbitMQ2.');


        channel.consume(
            "crm.session",
            async (message) => {
                try {
                const xmlData = message.content.toString();
                const parsedData = await parseStringPromise(xmlData, { explicitArray: false });
                console.log('Parsed XML data:', parsedData);


                let sessionData;
                const operation = parsedData.attendify.info.operation;

                    const session = parsedData.attendify.session;
                    console.log('Parsed XML data:', session);
                    sessionData = {
                            uid__c: session.uid,
                            event_uid__c: session.event_id,
                            title__c: session.title,
                            description__c: session.description,
                            date__c: session.date,
                            start_time__c: session.start_time,
                            end_time__c: session.end_time,
                            location__c: session.location,
                            max_attendees__c: session.max_attendees,
                            speaker_name__c: session.speaker.name,
                            speaker_bio__c: session.speaker.bio,

                    };
                if(parsedData.attendify.info.sender.toLowerCase() != "crm"){
                    if (operation === 'create') {
                        await SessionService.createSession(sessionData);
                    } else if (operation === 'update') {
                        await SessionService.updateSession(sessionData);
                    } else if (operation === 'delete') {
                        await SessionService.deleteSession(sessionData.uid__c);
                    } else {
                        console.log('Invalid operation');
                    }
                }
            } catch (error) {
                console.error('Error processing message:', error);
            } finally {
                channel.ack(message);
            }
            }
        )
    }catch(error){
        console.error('Error starting consumer:', error);
    }
}


module.exports =  startSessionConsumer;