const amqp = require('amqplib');
const { Builder } = require('xml2js');
const { getConnection } = require('../salesforce');
const Faye = require('faye');


function startCreateEventProducer() {
    console.log("Starting Create Event producer");
    checkNewEvents();
}

async function checkNewEvents() {
    console.log('Checking for new events in Salesforce...');
    let rabbitConnection;
    try {
        const conn = await getConnection(); // Salesforce connection
        rabbitConnection = await amqp.connect(process.env.RABBITMQ_URL); // RabbitMQ connection
        const channel = await rabbitConnection.createChannel();
        const exchangeName = 'event-management'; // Exchange voor events
        const routingKey = 'event.create';     // Routing key voor create

        await channel.assertExchange(exchangeName, 'direct', { durable: true });
        console.log(`Exchange '${exchangeName}' asserted.`);

        const instanceUrl = conn.instanceUrl;
        const accessToken = conn.accessToken;

        const client = new Faye.Client(`${instanceUrl}/cometd/58.0`, { // Gebruik juiste API versie
            timeout: 120, // Langere timeout kan nuttig zijn
            retry: 5,
        });

        client.setHeader('Authorization', `Bearer ${accessToken}`);

        // !!!!! PAS DEZE NAAM AAN NAAR JE ECHTE PLATFORM EVENT !!!!!
        const subscription = client.subscribe('/event/Event_Created__e', async (message) => {
            console.log('Received Salesforce Event_Created__e message:', JSON.stringify(message, null, 2));

            const eventPayload = message.payload; // Salesforce record data zit in payload
             console.log(`Salesforce Event Created: Name ${eventPayload.Name}`); // Name is het Auto Number

            const builder = new Builder();
            const eventMessageXML = builder.buildObject(mapEventToXML(eventPayload, 'create'));

            channel.publish(exchangeName, routingKey, Buffer.from(eventMessageXML));
            console.log(`Message sent via ${exchangeName} with key ${routingKey} for new event Name: ${eventPayload.Name}`);
        });

         subscription.callback(() => {
           console.log('Subscription to /event/Event_Created__e successful');
         });

         subscription.errback((error) => {
           console.error('Subscription to /event/Event_Created__e failed:', error);
           // Probeer opnieuw te verbinden of stop proces
         });


         client.on('transport:down', () => {
            console.error('Faye client transport down. Connection lost.');
            // Implementeer reconnect logica
         });

         client.on('transport:up', () => {
            console.log('Faye client transport up. Connection established/re-established.');
         });


    } catch (error) {
        console.error('Error in Create Event producer:', error);
         if (rabbitConnection) {
            await rabbitConnection.close();
            console.log("RabbitMQ connection closed due to error in Create Event producer.")
        }
         //setTimeout(checkNewEvents, 5000); // Probeer opnieuw na 5 sec
    }
}

// Functie om Salesforce event data naar XML te mappen
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

module.exports = startCreateEventProducer;