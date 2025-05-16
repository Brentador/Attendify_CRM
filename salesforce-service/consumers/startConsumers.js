const startUserConsumer = require('./consumerUser');
const startEventConsumer = require('./consumerEvent');
const startSessionConsumer = require('./consumerSession');
const startEventRegisterConsumer = require('./consumerEventRegister');
const startSessionRegisterConsumer = require('./consumerSessionRegister');
const startCompanyConsumer = require('./consumerCompany');

async function startConsumers(){
    try {
        console.log('Starting all consumers...');
        await startUserConsumer();
        await startEventConsumer();
        await startSessionConsumer();
        // await startEventRegisterConsumer();
        // await startSessionRegisterConsumer();
        await startCompanyConsumer();

        console.log('All consumers started successfully.');
    } catch (error) {
        console.error('Error starting consumers:', error);
    }
}

module.exports = startConsumers;