const { getConnection } = require('../salesforce');

// async function startSessionConsumer() {
//     console.log('Starting Session consumer...');
//     try {
//         // Connect to RabbitMQ server
//         const connection = await connectRabbitmq();
//         console.log('Connected to RabbitMQ.');
//         const channel = await connection.createChannel();
//         console.log('RabbitMQ channel created for Session Consumer.');

//         // Queue name
//         const queueName = "crm.session";
//         console.log(`Session Consumer is listening on existing queue: ${queueName}`);

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
//                         uid__c: session.uid || null,
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


class SessionService {
    static async createSession(sessionData) {
      try {
        const conn = await getConnection();
        const userId = await this.getSalesforceId('Users_CRM__c', sessionData.uid);
        const eventId = await this.getSalesforceId('Eventvrm__c', sessionData.event_id);
          return await conn.sobject('Session__c').create({
            description__c: sessionData.description,
            end_time__c: sessionData.end_time,
            location__c: sessionData.location,
            max_attendees__c: sessionData.max_attendees,
            speaker_bio__c: sessionData.speaker_bio,
            speaker_name__c: sessionData.speaker_name,
            start_time__c: sessionData.start_time,
            date__c: sessionData.date,
            title__c: sessionData.title,
            event_uid__c: sessionData.event_id,
            uid__c: sessionData.uid,
            event__c: eventId,

        });
        
      } catch (error) {
          console.error('Error in creating session:', error);
          return;
      }
    }
    
    static async updateSession(sessionData) {
      try {
          const conn = await getConnection();
          
          const result = await conn.sobject('Session__c')
              .find({ uid__c: sessionData.uid__c })
              .execute();
          
          if (result) {
            const session = result[0];
            const sessionToUpdate = { uid: session.uid };
              for (const [key, value] of Object.entries(sessionData)) {
                if (value !== null) {
                    sessionToUpdate[key] = value;
                }
              }
              return await conn.sobject('Session__c').update(sessionToUpdate);
          } else {
              console.log(`No session found with uid: ${sessionData.uid}`);
              return { success: false, message: 'session not found' };
          }
      } catch (error) {
        console.error('Error in updating user:', error);
        return;
      } 
    }

    static async deleteSession(uid){
      try{
        const conn = await getConnection();
  
        const query = `SELECT Id FROM Session__c WHERE uid__c = '${uid}'`
        const result = await conn.query(query);
  
        if (result.records.length === 0){
          console.log(`No session found with uid: ${uid}`)
          return { success: false, message: 'Session not found' }
        }
  
        const sessionId = result.records[0].Id;
  
        await conn.sobject('Session__c').destroy(sessionId);
        console.log(`Session with uid ${uid} deleted successfully.`);
        return { success: true, message: 'Session deleted successfully' };
      }catch (error) {
        console.error(`Error deleting session with uid ${uid}:`, error);
        return { success: false, message: 'Error deleting session', error };
      }
    }
  }
   

module.exports = SessionService;