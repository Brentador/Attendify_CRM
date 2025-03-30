require('dotenv').config();
const { getConnection } = require('./salesforce');
const UserService = require('./UserCRUD');

async function testUpdateUser() {
    try {
        await getConnection();
        
        console.log('Starting user update test...');
        
        const userName = '34';  // Identifier to find the user
        
        const userToUpdate = {
            email__c: 'test@gmail.com',
            first_name__c: 'Test',
            last_name__c: 'Icle',
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