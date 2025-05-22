require('dotenv').config();
const startConsumers = require('./salesforce-service/consumers/startConsumers.js');
const startHeartbeat = require('./salesforce-service/heartbeat.js');

async function startConsumersContainer(){
    try {
        console.log('Starting consumers heartbeat');
        await startHeartbeat("CRM_Consumers");
        await startConsumers();
    } catch (error) {
        console.error('Error starting consumers:', error);
    }
}

startConsumersContainer();

console.log('Salesforce service started');
