const amqp = require('amqplib');
const { Builder } = require('xml2js');
const { getConnection } = require('../salesforce'); // Salesforce connection
const Faye = require('faye');


const INTEGRATION_USER_USERNAME = 'project.2crm@gmail.com'; // Integratie user
let integrationUserId = null; // Cache voor de ID van de integratie user

// Functie om Salesforce event data (nu van CDC) naar XML te mappen
function mapEventCDCToXML(payload, header, operation) {
    // Voor delete bevat de payload mogelijk niet alle velden, haal Name uit header indien nodig
    const eventName = payload.Name || (header.recordIds && header.recordIds.length > 0 ? 'ID:' + header.recordIds[0] : 'UNKNOWN'); // Fallback voor delete

    // Basis structuur
    const xmlObject = {
        attendify: {
            info: {
                sender: 'crm',
                operation: operation.toLowerCase(), // 'create', 'update', of 'delete'
            },
            event: {
                // Stuur het Auto Number (Name) mee - cruciaal voor identificatie
                // Probeer uit payload, fallback naar header recordId voor delete
                event_crm_id: payload.Name || null
            }
        }
    };

    // Voeg alleen andere velden toe voor create en update
    if (operation === 'CREATE' || operation === 'UPDATE') {
         // Voeg velden toe die bestaan in de payload
        if (payload.name_event__c !== undefined) xmlObject.attendify.event.name_event = payload.name_event__c;
        if (payload.Start_date__c !== undefined) xmlObject.attendify.event.start_date = payload.Start_date__c;
        if (payload.End_date__c !== undefined) xmlObject.attendify.event.end_date = payload.End_date__c;
        if (payload.Address__c !== undefined) xmlObject.attendify.event.address = payload.Address__c;
        if (payload.description__c !== undefined) xmlObject.attendify.event.description = payload.description__c;
        if (payload.max_attendees__c !== undefined) xmlObject.attendify.event.max_attendees = payload.max_attendees__c;
        // Voeg andere relevante velden toe...
    } else if (operation === 'DELETE') {
        // Voor delete hebben we alleen de identifier nodig
        // event_crm_id is al toegevoegd
         console.log(`Mapping XML for DELETE operation, using Name/ID: ${xmlObject.attendify.event.event_crm_id}`);
    }


    return xmlObject;
}


// Functie om de ID van de integratiegebruiker op te halen en te cachen
async function cacheIntegrationUserId(conn) {
    if (!integrationUserId) {
        try {
            console.log(`Querying for User ID of: ${INTEGRATION_USER_USERNAME}`);
            const result = await conn.query(`SELECT Id FROM User WHERE Username = '${INTEGRATION_USER_USERNAME}' LIMIT 1`);
            if (result.records && result.records.length > 0) {
                integrationUserId = result.records[0].Id;
                console.log(`Integration User ID cached: ${integrationUserId}`);
            } else {
                console.error(`ERROR: Could not find integration user with username: ${INTEGRATION_USER_USERNAME}`);
                // Stop het proces of gooi een harde fout, want de filtering werkt niet zonder ID
                throw new Error(`Integration user ${INTEGRATION_USER_USERNAME} not found.`);
            }
        } catch (error) {
            console.error('Error fetching integration user ID:', error);
            throw error; // Propagate error
        }
    }
}


// Hoofdfunctie voor de CDC Producer
async function startEventCDCProducer() {
    console.log("Starting Event CDC producer");
    let rabbitConnection;
    let fayeClient;

    try {
        // 1. Maak verbindingen
        const sfConn = await getConnection(); // Salesforce connection
        await cacheIntegrationUserId(sfConn); // Haal en cache de User ID
        rabbitConnection = await amqp.connect(process.env.RABBITMQ_URL); // RabbitMQ connection
        const channel = await rabbitConnection.createChannel();
        const exchangeName = 'event-management'; // Exchange voor events

        await channel.assertExchange(exchangeName, 'direct', { durable: true });
        console.log(`RabbitMQ Exchange '${exchangeName}' asserted.`);

        // 2. Setup Faye Client
        const instanceUrl = sfConn.instanceUrl;
        const accessToken = sfConn.accessToken;
        const cdcChannelName = '/data/Eventcrm__ChangeEvent'; // Het CDC kanaal!

        fayeClient = new Faye.Client(`${instanceUrl}/cometd/58.0`, { // Gebruik juiste API versie
            timeout: 120, // Verhoogde timeout
            retry: 5,
        });

        fayeClient.setHeader('Authorization', `Bearer ${accessToken}`);

        // 3. Subscribe op het CDC kanaal
        console.log(`Attempting to subscribe to CDC channel: ${cdcChannelName}`);
        const subscription = fayeClient.subscribe(cdcChannelName, async (message) => {
            console.log('Received CDC message:', JSON.stringify(message, null, 2));

            const payload = message.payload;
            const header = payload.ChangeEventHeader;

            if (!header) {
                console.error("ERROR: ChangeEventHeader missing in CDC message!");
                return;
            }

            // 4. Check of de wijziging door de integratie user is gedaan
            const commitUserId = header.commitUser;
            if (commitUserId === integrationUserId) {
                 console.log(`Change committed by integration user (${commitUserId}). Processing...`);

                const changeType = header.changeType; // CREATE, UPDATE, DELETE
                let routingKey = '';

                // Bepaal routing key
                switch (changeType) {
                    case 'CREATE':
                        routingKey = 'event.create';
                        break;
                    case 'UPDATE':
                        routingKey = 'event.update';
                        break;
                    case 'DELETE':
                        routingKey = 'event.delete';
                        break;
                    default:
                        console.log(`Ignoring unsupported change type: ${changeType}`);
                        return; // Negeer andere types zoals UNDELETE
                }

                 // 5. Map naar XML
                 const builder = new Builder({ rootName: 'attendify', headless: true }); // Aangepaste builder opties
                 const eventMessageXML = builder.buildObject(mapEventCDCToXML(payload, header, changeType));
                 console.log("Constructed XML:", eventMessageXML);


                 // 6. Publish naar RabbitMQ
                try {
                    channel.publish(exchangeName, routingKey, Buffer.from(eventMessageXML));
                    console.log(`Message sent via ${exchangeName} with key ${routingKey} for event change type ${changeType}, Record ID(s): ${header.recordIds.join(', ')}`);
                } catch (publishError) {
                     console.error(`Error publishing message to RabbitMQ for ${changeType}:`, publishError);
                }

            } else {
                console.log(`Change committed by other user (${commitUserId}). Ignoring.`);
            }
        });

        subscription.callback(() => {
            console.log(`Successfully subscribed to CDC channel: ${cdcChannelName}`);
        });

        subscription.errback((error) => {
            console.error(`Subscription to ${cdcChannelName} failed:`, error);
            // Implementeer robuustere foutafhandeling / herstartlogica
            if (rabbitConnection) rabbitConnection.close().catch(err => console.error("Error closing RabbitMQ connection on Faye error:", err));
            process.exit(1); // Stop het proces bij subscribe fout
        });

        fayeClient.on('transport:down', () => {
            console.error('Faye client transport down. CDC Connection lost.');
            // Probeer opnieuw te verbinden of geef een signaal af
            // Hier zou je reconnect logica kunnen implementeren
        });

        fayeClient.on('transport:up', () => {
            console.log('Faye client transport up. CDC Connection established/re-established.');
        });

    } catch (error) {
        console.error('FATAL Error in Event CDC producer:', error);
        if (rabbitConnection) {
            await rabbitConnection.close().catch(e => console.error("Error closing RabbitMQ on fatal error:", e));
        }
        // Gooi een fout of probeer opnieuw na een delay
         process.exit(1); // Stop het proces bij een fatale opstartfout
    }
}

module.exports = startEventCDCProducer;