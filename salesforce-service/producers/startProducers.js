const createdUser = require('./producerCreateUser');
const updatedUser = require('./producerUpdateUser');
const deletedUser = require('./producerDeleteUser');
const createdEvent = require('./producerCreateEvent');
const updatedEvent = require('./producerUpdateEvent');
const deletedEvent = require('./producerDeleteEvent');

async function startProducers(){
    try {
        console.log('Starting all producers...');
        await createdUser();
        await updatedUser();
        await deletedUser();
        await createdEvent();
        await updatedEvent();
        await deletedEvent();
        console.log('All producers started successfully.');
    } catch (error) {
        console.error('Error starting producers:', error);
    }
}

startProducers();