const startUserConsumer = require('./consumerUser');
// const startEventConsumer = require('./consumerEvent');

async function startConsumers(){
    try {
        console.log('Starting all consumers...');
        await startUserConsumer();
        // await startEventConsumer();

        console.log('All consumers started successfully.');
    } catch (error) {
        console.error('Error starting consumers:', error);
    }
}
startConsumers();