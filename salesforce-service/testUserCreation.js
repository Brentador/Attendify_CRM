require('dotenv').config();
const { getConnection } = require('./salesforce');
const createUser = require('./UserCRUD');

async function testCreateUser() {
    try {
        await getConnection();
        
        console.log('Starting user creation test...');
        const result = await createUser.createUser();
        console.log('Success:', result);
        
    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        process.exit();
    }
}

testCreateUser();