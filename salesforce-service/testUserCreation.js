require('dotenv').config();
const { getConnection } = require('./salesforce');
const UserService = require('./userService');

async function testCreateUser() {
    try {
        await getConnection();
        
        console.log('Starting user creation test...');
        const result = await UserService.createUser();
        console.log('Success:', result);
        
    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        process.exit();
    }
}

testCreateUser();