const { getConnection } = require('./salesforce');

class UserService {
  static async updateUser(userName, userToUpdate) {
    try {
        if (!userName) {
            throw new Error('User name is required to find the user.');
        }

        const conn = await getConnection();
        
        // Fetch the user based on the provided Name (or unique identifier)
        const result = await conn.sobject('Users_CRM__c')
            .find({ Name: userName })
            .execute();
        
        if (!result || result.length === 0) {
            throw new Error('User not found');
        }
        
        const user = result[0];
        
        // Ensure the object has the required ID field for update
        userToUpdate.Id = user.Id;
        
        // Perform update
        return await conn.sobject('Users_CRM__c').update(userToUpdate);
    } catch (error) {
        console.error('Error in updating user:', error);
        throw error;
    }
  }
}

module.exports = UserService;