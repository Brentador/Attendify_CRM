require('dotenv').config();
const { getConnection } = require('./salesforce');
const createUser = require('./UserCRUD');

async function testCreateUser() {
    try {
        await getConnection();
        
        console.log('Starting user creation test...');
        
        const userData = {
            email__c: 'newuser@gmail.com',
            first_name__c: 'John',
            last_name__c: 'Doe',
            dob__c: '1990-01-01',
        };
        
        const result = await createUser.createUser(userData);
        console.log('Success:', result);
        
    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        process.exit();
    }
}

testCreateUser();