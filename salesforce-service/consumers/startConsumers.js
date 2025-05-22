const { startUserConsumer } = require('../crud/consumerUser');
const startEventConsumer = require('../crud/consumerEvent');
const startSessionConsumer = require('../crud/consumerSession');
const { startCompanyConsumer } = require('../crud/consumerCompany');
const { startPaymentConsumer } = require('../crud/PaymentCRUDD');

async function startConsumers(){
    try {
        console.log('Starting all consumers...');
        await startUserConsumer();
        await startEventConsumer();
        await startSessionConsumer();
        await startCompanyConsumer();
        await startPaymentConsumer();
        console.log('All consumers started successfully.');
    } catch (error) {
        console.error('Error starting consumers:', error);
    }
}

module.exports = startConsumers;