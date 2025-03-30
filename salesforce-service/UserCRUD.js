const { getConnection } = require('./salesforce');

class createUser {
    static async createUser(userData) {
      try {
          const conn = await getConnection();

          // Add timestamps dynamically
          const userPayload = {
              ...userData,
              created_at__c: new Date().toISOString(),
              updated_at__c: new Date().toISOString(),
              created_by_crm_ui__c: 0,
          };

          return await conn.sobject('Users_CRM__c').create(userPayload);
      } catch (error) {
          console.error('Error in creating user:', error);
          throw error;
      }
    }

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

    static async deleteUser(email){
      try{
        const conn = await getConnection();
  
        const query = `SELECT Id FROM Users_CRM__c WHERE email__c = '${email}'`
        const result = await conn.query(query);
  
        if (result.records.length === 0){
          console.log(`No user found with email: ${email}`)
          return { success: false, message: 'User not found' }
        }
  
        const userId = result.records[0].Id;
  
        await conn.sobject('Users_CRM__c').destroy(userId);
        console.log(`User with email ${email} deleted successfully.`);
        return { success: true, message: 'User deleted successfully' };
      }catch (error) {
        console.error(`Error deleting user with email ${email}:`, error);
        return { success: false, message: 'Error deleting user', error };
      }
    }
}

module.exports = createUser;