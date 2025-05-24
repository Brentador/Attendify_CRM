const SessionService = require('../crud/SessionCRUD');
const { parseStringPromise } = require('xml2js');
const connectRabbitmq = require('../rabbitmq');
const logToMonitoring = require('../logging');

async function startSessionConsumer() {
    console.log('Starting session consumer');
    let channel;
    try {
        const connection = await connectRabbitmq();
        channel = await connection.createChannel();

        await channel.consume(
            "crm.session",
            async (message) => {
                try {
                    const xmlData = message.content.toString();
                    const parsedData = await parseStringPromise(xmlData, { explicitArray: false });
                    console.log('Parsed XML data:', parsedData);


                    const operation = parsedData.attendify.info.operation;
                    let sessionData;
                    let sessionRegisterData;
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
                    if (parsedData.attendify.info.sender.toLowerCase() != "crm") {
                        let success = false;
                        let message = "";

                        switch (operation) {
                            case 'create':
                                success = await SessionService.createSession(sessionData);
                                message = success ? 'Session created successfully' : 'Failed to create session';
                                logToMonitoring(message, 'session', channel);
                                break;
                            case 'update':
                                success = await SessionService.updateSession(sessionData);
                                message = success ? 'Session updated successfully' : 'Failed to update session';
                                logToMonitoring(message, 'session', channel);
                                break;
                            case 'delete':
                                success = await SessionService.deleteSession(sessionData.uid__c);
                                message = success ? 'Session deleted successfully' : 'Failed to delete session';
                                logToMonitoring(message, 'session', channel);
                                break;
                            case 'register':
                                success = await SessionService.registerSession(sessionRegisterData);
                                message = success ? 'Session registered successfully' : 'Failed to register session';
                                logToMonitoring(message, 'session', channel);
                                break;
                            case 'unregister':
                                success = await SessionService.unregisterSession(sessionRegisterData);
                                message = success ? 'Session unregistered successfully' : 'Failed to unregister session';
                                logToMonitoring(message, 'session', channel);
                                break;
                            default:
                                logToMonitoring(`Unknown operation: ${operation}`, 'session', channel);
                                return;
                        }
                    }
                } catch (error) {
                    logToMonitoring(`Error processing session message: ${error}`, 'session', channel);
                } finally {
                    channel.ack(message);
                }
            }
        )
    } catch (error) {
        logToMonitoring(`Error starting session consumer: ${error}`, 'session', channel);
    }
}


module.exports = startSessionConsumer;