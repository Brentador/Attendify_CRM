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
                if (operation == 'create' || operation == 'update' || operation == 'delete') {
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
                            speaker_name__c: session.speaker?.name || null,
                            speaker_bio__c: session.speaker?.bio || null,
                    };
                } else if (operation == 'register' || operation == 'unregister') {
                    const sessionRegister = parsedData.attendify.session_attendee;
                    console.log('Parsed XML data:', sessionRegister);
                    sessionRegisterData = {
                        session_uid__c: sessionRegister.session_id,
                        user_uid__c: sessionRegister.uid
                    };
                } 
                if(parsedData.attendify.info.sender.toLowerCase() != "crm"){
                    if (operation === 'create') {
                        await SessionService.createSession(sessionData);
                    } else if (operation === 'update') {
                        await SessionService.updateSession(sessionData);
                    } else if (operation === 'delete') {
                        await SessionService.deleteSession(sessionData.uid__c);
                    } else if (operation === 'register') {
                        await SessionService.registerSession(sessionRegisterData);
                    } else if (operation === 'unregister') {
                        await SessionService.unregisterSession(sessionRegisterData);
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