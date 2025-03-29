const { getConnection } = require('./salesforce');

class UserService {
  static async updateUser(userData) {
    try {
        const conn = await getConnection();
        const result = await conn.sobject('Users_CRM__c')
            .find({ email__c: userData.email__c })
            .execute();
        
        if (!result || result.length === 0) {
            throw new Error('User not found');
        }
        
        const user = result[0];

        // const userToUpdate = {
        //     Id: user.Id,
        //     email__c: 'updatedemail@gmail.com',
        //     first_name__c: 'Updated',
        //     last_name__c: 'Name',
        //     updated_at__c: new Date().toISOString(),
        // };

        const userToUpdate = { Id: user.Id };
        for (const [key, value] of Object.entries(userData)) {
            if (value !== null) {
                userToUpdate[key] = value;
            }
        }

        // Perform update, only passing the fields you want to update
        return await conn.sobject('Users_CRM__c').update(userToUpdate);
    } catch (error) {
        console.error('Error in updating user:', error);
        throw error;
    }
  }
}

module.exports = UserService;
