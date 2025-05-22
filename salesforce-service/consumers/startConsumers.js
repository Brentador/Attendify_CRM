const { startUserConsumer } = require('./consumerUser');
const startEventConsumer = require('./consumerEvent');
const startSessionConsumer = require('./consumerSession');
const startEventRegisterConsumer = require('./consumerEventRegister');
const startSessionRegisterConsumer = require('./consumerSessionRegister');
const { startCompanyConsumer } = require('./consumerCompany');
const { startEventPaymentConsumer } = require('./consumerEventPayment');

async function startConsumers(){
    try {
        await startUserConsumer();
        await startEventConsumer();
        await startSessionConsumer();
        await startEventRegisterConsumer();
        await startSessionRegisterConsumer();
        await startCompanyConsumer();
        await startEventPaymentConsumer();
    } catch (error) {
        console.error('Error starting consumers:', error);
    }
}

module.exports = startConsumers;