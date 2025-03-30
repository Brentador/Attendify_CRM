const createdUser = requires('./producerCreateUser');
const updatedUser = requires('./producerUpdateUser');
const deletedUser = requires('./producerDeleteUser');

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