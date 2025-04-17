const startUserConsumer = require('./consumerUser');

async function startConsumers(){
    try {
        console.log('Starting all consumers...');
        await startUserConsumer();

        console.log('All consumers started successfully.');
    } catch (error) {
        console.error('Error starting consumers:', error);
    }
}
startConsumers();