const { getConnection } = require('./salesforce');

class UserService {
  static async updateUser() {
    try {
        const conn = await getConnection();
        // Fetch the user with ID '5' (Auto Number or whatever identifier you're using)
        const result = await conn.sobject('Users_CRM__c')
            .find({ Name: '5' })  // Use the correct Auto Number field here
            .execute();
        
        if (!result || result.length === 0) {
            throw new Error('User not found');
        }
        
        const user = result[0];

        // Prepare the fields to update
        const userToUpdate = {
            Id: user.Id,  // You need the Id field to perform the update
            email__c: 'updatedemail@gmail.com',
            first_name__c: 'Updated',
            last_name__c: 'Name',
            updated_at__c: new Date().toISOString(),
        };

        // Perform update, only passing the fields you want to update
        return await conn.sobject('Users_CRM__c').update(userToUpdate);
    } catch (error) {
        console.error('Error in updating user:', error);
        throw error;
    }
  }
}

module.exports = UserService;
