const amqp = require('amqplib');
const { Builder } = require('xml2js');
const { getConnection } = require('../salesforce');
const Faye = require('faye');


function startDeleteEventProducer() {
    console.log("Starting Delete Event producer");
    checkDeletedEvents();
}

async function checkDeletedEvents() {
    console.log('Checking for deleted events in Salesforce...');
    let rabbitConnection;
    try {
        const conn = await getConnection();
        rabbitConnection = await amqp.connect(process.env.RABBITMQ_URL);
        const channel = await rabbitConnection.createChannel();
        const exchangeName = 'event-management'; // Exchange voor events
        const routingKey = 'event.delete';     // Routing key voor delete

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
        // Dit event moet MINSTENS het 'Name' (Auto Number) veld bevatten.
        const subscription = client.subscribe('/event/Event_Deleted__e', async (message) => {
            console.log('Received Salesforce Event_Deleted__e message:', JSON.stringify(message, null, 2));

            const eventPayload = message.payload;
            const eventName = eventPayload.Name; // Haal Name op uit payload

            if (!eventName) {
                console.error("Received delete event, but 'Name' field is missing in payload:", eventPayload);
                return; // Kan geen bericht sturen zonder identifier
            }

            console.log(`Salesforce Event Deleted: Name ${eventName}`);

            const builder = new Builder();
            // Maak een minimale XML voor delete, alleen met de identifier
            const deleteMessageXML = builder.buildObject({
                attendify: {
                    info: {
                        sender: 'crm',
                        operation: 'delete',
                    },
                    event: {
                        event_crm_id: eventName // Stuur alleen de identifier (Name)
                    }
                }
            });

            channel.publish(exchangeName, routingKey, Buffer.from(deleteMessageXML));
            console.log(`Message sent via ${exchangeName} with key ${routingKey} for deleted event Name: ${eventName}`);
        });

         subscription.callback(() => {
           console.log('Subscription to /event/Event_Deleted__e successful');
         });

         subscription.errback((error) => {
           console.error('Subscription to /event/Event_Deleted__e failed:', error);
         });

          client.on('transport:down', () => {
            console.error('Faye client transport down. Connection lost.');
         });

         client.on('transport:up', () => {
            console.log('Faye client transport up. Connection established/re-established.');
         });


    } catch (error) {
        console.error('Error in Delete Event producer:', error);
        if (rabbitConnection) {
            await rabbitConnection.close();
            console.log("RabbitMQ connection closed due to error in Delete Event producer.")
        }
        // setTimeout(checkDeletedEvents, 5000); // Probeer opnieuw
    }
}

module.exports = startDeleteEventProducer;