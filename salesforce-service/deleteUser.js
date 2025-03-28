const { getConnection } = require('./salesforce');

class UserService {
  // New method for deleting a user
  static async deleteUser(userId) {
    try {
        const conn = await getConnection();
        // Fetch the user to ensure it exists before attempting to delete
        const result = await conn.sobject('Users_CRM__c')
            .find({ Name: userId })
            .execute();

        if (!result || result.length === 0) {
            throw new Error('User not found');
        }

        const user = result[0];

        // Perform delete
        const deleteResult = await conn.sobject('Users_CRM__c').destroy(user.Id);
        
        // Return the result of the delete operation
        return deleteResult;
    } catch (error) {
        console.error('Error in deleting user:', error);
        throw error;
    }
  }
}

module.exports = UserService;
