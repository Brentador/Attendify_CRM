const amqp = require('amqplib');
const { Builder } = require('xml2js');
const { getConnection } = require('../salesforce');
const Faye = require('faye');


function startUpdateEventProducer() {
    console.log("Starting Update Event producer");
    checkUpdatedEvents();
}

async function checkUpdatedEvents() {
    console.log('Checking for updated events in Salesforce...');
     let rabbitConnection;
    try {
        const conn = await getConnection();
        rabbitConnection = await amqp.connect(process.env.RABBITMQ_URL);
        const channel = await rabbitConnection.createChannel();
        const exchangeName = 'event-management'; // Exchange voor events
        const routingKey = 'event.update';     // Routing key voor update

        await channel.assertExchange(exchangeName, 'direct', { durable: true });
         console.log(`Exchange '${exchangeName}' asserted.`);

        const instanceUrl = conn.instanceUrl;
        const accessToken = conn.accessToken;

        const client = new Faye.Client(`${instanceUrl}/cometd/58.0`, { // Gebruik juiste API versie
             timeout: 120,
             retry: 5,
        });

        client.setHeader('Authorization', `Bearer ${accessToken}`);

        // !!!!! PAS DEZE NAAM AAN NAAR JE ECHTE PLATFORM EVENT !!!!!
        const subscription = client.subscribe('/event/Event_Updated__e', async (message) => {
             console.log('Received Salesforce Event_Updated__e message:', JSON.stringify(message, null, 2));
            const eventPayload = message.payload;

            // Controleer of het een echte update is (niet de creatie-trigger)
            // Dit vereist dat CreatedDate en LastModifiedDate in het Platform Event zitten
             if (eventPayload.LastModifiedDate && eventPayload.CreatedDate && eventPayload.LastModifiedDate !== eventPayload.CreatedDate) {
                 console.log(`Salesforce Event Updated: Name ${eventPayload.Name}`);

                 const builder = new Builder();
                 // Gebruik dezelfde map functie, maar geef 'update' mee
                 const eventMessageXML = builder.buildObject(mapEventToXML(eventPayload, 'update'));

                 channel.publish(exchangeName, routingKey, Buffer.from(eventMessageXML));
                 console.log(`Message sent via ${exchangeName} with key ${routingKey} for updated event Name: ${eventPayload.Name}`);
            } else {
                console.log(`Skipping update message for event Name ${eventPayload.Name}, likely creation event.`);
            }
        });

         subscription.callback(() => {
           console.log('Subscription to /event/Event_Updated__e successful');
         });

         subscription.errback((error) => {
           console.error('Subscription to /event/Event_Updated__e failed:', error);
         });

          client.on('transport:down', () => {
            console.error('Faye client transport down. Connection lost.');
         });

         client.on('transport:up', () => {
            console.log('Faye client transport up. Connection established/re-established.');
         });

    } catch (error) {
        console.error('Error in Update Event producer:', error);
        if (rabbitConnection) {
            await rabbitConnection.close();
            console.log("RabbitMQ connection closed due to error in Update Event producer.")
        }
        // setTimeout(checkUpdatedEvents, 5000); // Probeer opnieuw
    }
}

// Functie om Salesforce event data naar XML te mappen (dezelfde als in create)
function mapEventToXML(eventPayload, operation) {
     return {
        attendify: {
            info: {
                sender: 'crm',
                operation: operation, // 'create', 'update', of 'delete'
            },
            event: {
                event_crm_id: eventPayload.Name, // Stuur het Auto Number (Name) mee
                name_event: eventPayload.name_event__c,
                start_date: eventPayload.Start_date__c,
                end_date: eventPayload.End_date__c,
                address: eventPayload.Address__c,
                description: eventPayload.description__c,
                max_attendees: eventPayload.max_attendees__c
                // Voeg andere relevante velden toe die in het Platform Event zitten
            }
        }
    };
}

module.exports = startUpdateEventProducer;