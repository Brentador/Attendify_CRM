const { startUserConsumer } = require('./consumerUser');
const startEventConsumer = require('./consumerEvent');
const startSessionConsumer = require('./consumerSession');
const { startCompanyConsumer } = require('./consumerCompany');
const { startPaymentConsumer } = require('./consumerPayment');

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