require('dotenv').config();
const startConsumersContainers = require('./salesforce-service/consumers/startConsumers.js');
const startHeartbeat = require('./salesforce-service/heartbeat.js');

async function startConsumers(){
    try {
        console.log('Starting consumers heartbeat');
        await startHeartbeat("CRM_Consumers");
        console.log('Starting all consumers...');
        await startConsumersContainers();
        console.log('All consumers started successfully.');
    } catch (error) {
        console.error('Error starting consumers:', error);
    }
}

startConsumers();

console.log('Salesforce service started');
