require('dotenv').config();
const { getConnection } = require('./salesforce');
const UserService = require('./updateUser');

async function testUpdateUser() {
    try {
        await getConnection();
        
        console.log('Starting user update test...');
        
        const userName = '36';  // Identifier to find the user
        
        const userToUpdate = {
            email__c: 'updatedemail@gmail.com',
            first_name__c: 'Ben',
            last_name__c: 'Dover',
            updated_at__c: new Date().toISOString(),
        };
        
        const result = await UserService.updateUser(userName, userToUpdate);
        console.log('Success:', result);
        
    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        process.exit();
    }
}

testUpdateUser();