require('dotenv').config();
const startProducersContainers = require('./salesforce-service/producers/startProducers.js');
const startHeartbeat = require('./salesforce-service/heartbeat.js');

async function startProducers(){
    try {
        console.log('Starting producers heartbeat');
        await startHeartbeat("CRM_Producers");
        console.log('Starting all producers...');
        await startProducersContainers();
        console.log('All producers started successfully.');
    } catch (error) {
        console.error('Error starting producers:', error);
    }
}

startProducers();


console.log('Salesforce service started');
