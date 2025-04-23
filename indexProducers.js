require('dotenv').config();
const createdUser = require('./salesforce-service/producers/producerCreateUser.js');
const updatedUser = require('./salesforce-service/producers/producerUpdateUser.js');
const deletedUser = require('./salesforce-service/producers/producerDeleteUser.js');
const startHeartbeat = require('./salesforce-service/heartbeat.js');

async function startProducers(){
    try {
        console.log('Starting producers heartbeat');
        void startHeartbeat("CRM_Producers");
        console.log('Starting all producers...');
        await createdUser();
        await updatedUser();
        await deletedUser();
        console.log('All producers started successfully.');
    } catch (error) {
        console.error('Error starting producers:', error);
    }
}

startProducers();


console.log('Salesforce service started');
