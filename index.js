require('dotenv').config();
const startConsumer = require('./salesforce-service/consumers/consumerUser.js');
const startCreateUserProducer = require('./salesforce-service/producers/producerCreateUser.js');
const startUpdateUserProducer = require('./salesforce-service/producers/producerUpdateUser.js');
const startDeleteUserProducer = require('./salesforce-service/producers/producerDeleteUser.js');


// Start the consumer and producer

async function startServices() {
  try {
    await startConsumer();
    console.log('Consumer service started');
  } catch (error) {
    console.error('Error starting consumer service:', error);
  }
  // try {
  //   await startCreateUserProducer();
  //   console.log('Producer service started');
  // } catch (error) {
  //   console.error('Error starting producer service:', error);
  // }
  // try {
  //   await startUpdateUserProducer();
  //   console.log('Producer service started');
  // } catch (error) {
  //   console.error('Error starting producer service:', error);
  // }
  // try {
  //   await startDeleteUserProducer();
  //   console.log('Producer service started');
  // } catch (error) {
  //   console.error('Error starting producer service:', error);
  // }
}
startServices();


console.log('Salesforce service started');
