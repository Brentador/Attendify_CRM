const SessionRegistrationService = require('./SessionRegisterCRUD');
const { getUserId, getSessionId } = require('../salesforce');
const { parseStringPromise } = require('xml2js');
const connectRabbitmq = require('../rabbitmq');

async function startSessionRegistrationConsumer() {
  console.log('Starting Session Registration consumer...');
  try {
    const connection = await connectRabbitmq();
    const channel = await connection.createChannel();

    const queueName = "crm.session.register";
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
        const sessionUid = registration.session_uid;

        const userId = await getUserId(userUid);
        const sessionId = await getSessionId(sessionUid);

        if (!userId || !sessionId) {
          console.error(`❌ User or Session not found. userUid: ${userUid}, sessionUid: ${sessionUid}`);
          channel.nack(message, false, false);
          return;
        }

        const regData = {
          user_id: userId,
          session_id: sessionId
        };

        if (sender.toLowerCase() !== 'crm') {
          console.log(`➡️ Processing '${operation}' for Session Registration...`);
          if (operation === 'create') {
            await SessionRegistrationService.createRegistration(regData);
          } else if (operation === 'update') {
            await SessionRegistrationService.updateRegistration(regData);
          } else if (operation === 'delete') {
            await SessionRegistrationService.deleteRegistration(userId, sessionId);
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
    console.error('❌ Failed to start Session Registration Consumer:', err);
  }
}

module.exports = startSessionRegistrationConsumer;