const createdUser = require('./producerCreateUser');
const updatedUser = require('./producerUpdateUser');
const deletedUser = require('./producerDeleteUser');

async function startProducers(){
    try {
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