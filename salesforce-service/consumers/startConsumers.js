const { startUserConsumer } = require('./consumerUser');
const startEventConsumer = require('./consumerEvent');
const startSessionConsumer = require('./consumerSession');
const startEventRegisterConsumer = require('./consumerEventRegister');
const { startCompanyConsumer } = require('./consumerCompany');
const { startEventPaymentConsumer } = require('./consumerEventPayment');

async function startConsumers(){
    try {
        console.log('Starting all consumers...');
        await startUserConsumer();
        await startEventConsumer();
        await startSessionConsumer();
        await startEventRegisterConsumer();
        await startCompanyConsumer();
        await startEventPaymentConsumer();

        console.log('All consumers started successfully.');
    } catch (error) {
        console.error('Error starting consumers:', error);
    }
}

module.exports = startConsumers;