const EventService = require('./EventCRUD');
const { parseStringPromise } = require('xml2js');
const connectRabbitmq = require('../rabbitmq');

async function startEventConsumer() {
    console.log('Starting consumer...');
    try{
        const connection = await connectRabbitmq();
        console.log('Connected to RabbitMQ.');
        const channel =  await connection.createChannel();
        console.log('Connected to RabbitMQ2.');

        channel.consume(
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
                if(parsedData.attendify.info.sender.toLowerCase() != "crm"){
                    if (operation === 'create') {
                        await EventService.createEvent(eventData);
                    } else if (operation === 'update') {
                        await EventService.updateEvent(eventData);
                    } else if (operation === 'delete') {
                        await EventService.deleteEvent(eventData.uid__c);
                    } else if (operation === 'register') {
                        await EventService.registerEvent(eventRegisterData);
                    } else if (operation === 'unregister') {
                        await EventService.unregisterEvent(eventRegisterData);
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


module.exports =  startEventConsumer;