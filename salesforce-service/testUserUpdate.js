require('dotenv').config();
const { getConnection } = require('./salesforce');
const UserService = require('./updateUser');

async function testUpdateUser() {
    try {
        await getConnection();
        
        console.log('Starting user update test...');
        const result = await UserService.updateUser();
        console.log('Success:', result);
        
    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        process.exit();
    }
}

testUpdateUser();