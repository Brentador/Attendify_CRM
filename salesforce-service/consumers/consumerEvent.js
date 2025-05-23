const EventService = require('../crud/EventCRUD');
const { parseStringPromise } = require('xml2js');
const connectRabbitmq = require('../rabbitmq');
const logToMonitoring = require('../logging');

async function startEventConsumer() {
    console.log('Starting event consumer');
    let channel;
    try {
        const connection = await connectRabbitmq();
        channel = await connection.createChannel();

        await channel.consume(
            "crm.event",
            async (message) => {
                try {
                    const xmlData = message.content.toString();
                    const parsedData = await parseStringPromise(xmlData, { explicitArray: false });
                    console.log('Parsed XML data:', parsedData);


                    let eventData;
                    let eventRegisterData;
                    const operation = parsedData.attendify.info.operation;
                    if (operation == 'create' || operation == 'update' || operation == 'delete') {
                        const event = parsedData.attendify.event;
                        console.log('Parsed XML data:', event);
                        eventData = {
                            description__c: event.description,
                            End_date__c: event.end_date,
                            end_time__c: event.end_time,
                            Entrance_Fee__c: event.entrance_fee,
                            gcid__c: event.gcid,
                            location__c: event.location,
                            max_attendees__c: event.max_attendees,
                            Organizer_Name__c: event.organizer_name,
                            Organizer_UID__c: event.organizer_uid,
                            Start_date__c: event.start_date,
                            start_time__c: event.start_time,
                            title__c: event.title,
                            uid__c: event.uid
                        };
                    } else if (operation == 'register' || operation == 'unregister') {
                        const eventRegister = parsedData.attendify.event_attendee;
                        console.log('Parsed XML data:', eventRegister);
                        eventRegisterData = {
                            event_uid__c: eventRegister.event_id,
                            user_uid__c: eventRegister.uid
                        };
                    }
                    if (parsedData.attendify.info.sender.toLowerCase() != "crm") {
                        let success = false;
                        let message = "";

                        switch (operation) {
                            case 'create':
                                success = await EventService.createEvent(eventData);
                                message = success ? 'Event created successfully' : 'Failed to create event';
                                logToMonitoring(message, 'event', channel);
                                break;
                            case 'update':
                                success = await EventService.updateEvent(eventData);
                                message = success ? 'Event updated successfully' : 'Failed to update event';
                                logToMonitoring(message, 'event', channel);
                                break;
                            case 'delete':
                                success = await EventService.deleteEvent(eventData.uid__c);
                                message = success ? 'Event deleted successfully' : 'Failed to delete event';
                                logToMonitoring(message, 'event', channel);
                                break;
                            case 'register':
                                success = await EventService.registerEvent(eventRegisterData);
                                message = success ? 'Event registered successfully' : 'Failed to register event';
                                logToMonitoring(message, 'event', channel);
                                break;
                            case 'unregister':
                                success = await EventService.unregisterEvent(eventRegisterData);
                                message = success ? 'Event unregistered successfully' : 'Failed to unregister event';
                                logToMonitoring(message, 'event', channel);
                                break;
                            default:
                                logToMonitoring(`Unknown operation: ${operation}`, 'company', channel);
                                return;
                        }
                    }
                } catch (error) {
                    logToMonitoring(`Error processing event message: ${error}`, 'event', channel);
                } finally {
                    channel.ack(message);
                }
            }
        )
    } catch (error) {
        logToMonitoring(`Error starting event consumer: ${error}`, 'event', channel);
    }
}


module.exports = startEventConsumer;