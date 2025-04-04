require('dotenv').config();
const startUserConsumer = require('./salesforce-service/consumers/consumerUser.js');
const startHeartbeat = require('./salesforce-service/heartbeat.js');

async function startConsumers(){
    try {
        console.log('Starting consumers heartbeat');
        startHeartbeat("CRM_Consumers");
        console.log('Starting all consumers...');
        await startUserConsumer();
        console.log('All consumers started successfully.');
    } catch (error) {
        console.error('Error starting consumers:', error);
    }
}

startConsumers();

console.log('Salesforce service started');
