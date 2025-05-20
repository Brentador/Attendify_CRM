const EventRegistrationService = require('./EventRegisterCRUD');
const { getUserId, getEventId } = require('../salesforce');
const { parseStringPromise } = require('xml2js');
const connectRabbitmq = require('../rabbitmq');

async function startEventRegistrationConsumer() {
  console.log('Starting Event Registration consumer...');
  try {
    const connection = await connectRabbitmq();
    const channel = await connection.createChannel();

    const queueName = "crm.event.register";

    console.log(`Listening on existing queue: ${queueName}`);

    channel.consume(queueName, async (message) => {
      if (!message) return;

      try {
        const xml = message.content.toString();
        console.log('📨 Received XML message:', xml);

        const parsed = await parseStringPromise(xml, {
          explicitArray: false,
          ignoreAttrs: true,
          emptyTag: null,
        });

        const operation = parsed?.attendify?.info?.operation;
        const sender = parsed?.attendify?.info?.sender;
        const registration = parsed?.attendify?.registration;

        if (!operation || !sender || !registration) {
          console.error('❌ Invalid structure in message');
          channel.nack(message, false, false);
          return;
        }

        const userUid = registration.user_uid;
        const eventUid = registration.event_uid;

        const userId = await getUserId(userUid);
        const eventId = await getEventId(eventUid);

        if (!userId || !eventId) {
          console.error(`❌ User or Event not found. userUid: ${userUid}, eventUid: ${eventUid}`);
          channel.nack(message, false, false);
          return;
        }

        const regData = {
          user_id: userId,
          event_id: eventId
        };

        if (sender.toLowerCase() !== 'crm') {
          console.log(`➡️ Processing '${operation}' for Event Registration...`);
          if (operation === 'create') {
            await EventRegistrationService.createRegistration(regData);
          } else if (operation === 'update') {
            await EventRegistrationService.updateRegistration(regData);
          } else if (operation === 'delete') {
            await EventRegistrationService.deleteRegistration(userId, eventId);
          } else {
            console.warn(`❓ Unknown operation: ${operation}`);
          }
        }

        channel.ack(message);
        console.log('✅ Message acknowledged');
      } catch (err) {
        console.error('❌ Error handling message:', err);
        channel.nack(message, false, false);
      }
    }, { noAck: false });

  } catch (err) {
    console.error('❌ Failed to start Event Registration Consumer:', err);
  }
}

module.exports = startEventRegistrationConsumer;