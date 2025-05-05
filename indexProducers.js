require('dotenv').config();
const startProducers = require('./salesforce-service/producers/startProducers.js');
const startHeartbeat = require('./salesforce-service/heartbeat.js');

async function startProducersContainer(){
    try {
        console.log('Starting producers heartbeat');
        await startHeartbeat("CRM_Producers");
        console.log('Starting all producers...');
        await startProducers();
        console.log('All producers started successfully.');
    } catch (error) {
        console.error('Error starting producers:', error);
    }
}

startProducersContainer();


console.log('Salesforce service started');
