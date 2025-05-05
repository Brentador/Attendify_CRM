const createdUser = require('./producerCreateUser');
// const updatedUser = require('./producerUpdateUser');
// const deletedUser = require('./producerDeleteUser');
// const startEventCDCProducer = require('./producerEventCDC');

async function startProducers(){
    try {
        console.log('Starting all producers...');
        await createdUser();
        // await updatedUser();
        // await deletedUser();
        // await startEventCDCProducer();
        console.log('All producers started successfully.');
    } catch (error) {
        console.error('Error starting producers:', error);
    }
}

startProducers();