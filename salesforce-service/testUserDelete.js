require('dotenv').config();
const { getConnection } = require('./salesforce');
const UserService = require('./deleteUser');  // Assuming updateUser.js contains deleteUser function

async function testDeleteUser(userId) {
    try {
        console.log('Connecting to Salesforce...');
        await getConnection(); // Establish Salesforce connection
        
        console.log('Starting user delete test...');
        const result = await UserService.deleteUser(userId); // Call the delete user function
        
        console.log('User deletion successful:', result);
    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        process.exit(); // Exit the script after completion
    }
}

// Example userId to delete, replace with a valid user Id
const userIdToDelete = '6';  // Replace with actual Salesforce user Id

testDeleteUser(userIdToDelete);
