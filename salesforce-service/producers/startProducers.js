const { checkCreatedUsers } = require('./producerCreateUser');
const checkUpdatedUsers = require('./producerUpdateUser');
const checkDeletedUsers = require('./producerDeleteUser');

async function startProducers(){
    try {
        console.log('Starting all producers...');
        await checkCreatedUsers();
        await checkUpdatedUsers();
        await checkDeletedUsers();
        console.log('All producers started successfully.');
    } catch (error) {
        console.error('Error starting producers:', error);
    }
}

module.exports = startProducers;