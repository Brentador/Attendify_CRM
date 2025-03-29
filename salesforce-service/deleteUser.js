const { getConnection } = require('./salesforce');

class UserService {
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

module.exports = UserService;
