const { getConnection } = require('../salesforce');

class UserService {
    static async createUser(userData) {
      try {
          const conn = await getConnection();
          return await conn.sobject('Users_CRM__c').create({
            email__c: userData.email__c,
            first_name__c: userData.first_name__c,
            last_name__c: userData.last_name__c,
            bus_number__c: userData.bus_number__c,
            city__c: userData.city__c,
            company_id__c: userData.company_id__c,
            country__c: userData.country__c,
            dob__c: userData.dob__c,
            email_registered__c: userData.email_registered__c,
            house_number__c: userData.house_number__c,
            phone__c: userData.phone__c,
            province__c: userData.province__c,
            street_name__c: userData.street_name__c,
            title__c: userData.title__c,
            uid__c: userData.uid__c,
        });
      } catch (error) {
          console.error('Error in creating user:', error);
          return;
      }
    }
    
    static async updateUser(userData) {
      try {
          const conn = await getConnection();
          
          const result = await conn.sobject('Users_CRM__c')
              .find({ uid__c: userData.uid__c })
              .execute();
          
          if (result) {
              const user = result[0];
              const userToUpdate = { Id: user.Id };
              for (const [key, value] of Object.entries(userData)) {
                if (value !== null) {
                    userToUpdate[key] = value;
                }
              }
              return await conn.sobject('Users_CRM__c').update(userToUpdate);
            
          } else {
              console.log(`No user found with uid: ${userData.uid__c}`);
              return { success: false, message: 'User not found' };
          }
      } catch (error) {
        console.error('Error in updating user:', error);
        return;
      } 
    }

    static async deleteUser(uid){
      try{
        const conn = await getConnection();
  
        const query = `SELECT Id FROM Users_CRM__c WHERE uid__c = '${uid}'`
        const result = await conn.query(query);
  
        if (result.records.length === 0){
          console.log(`No user found with uid: ${uid}`)
          return { success: false, message: 'User not found' }
        }
  
        const userId = result.records[0].Id;
  
        await conn.sobject('Users_CRM__c').destroy(userId);
        console.log(`User with uid ${uid} deleted successfully.`);
        return { success: true, message: 'User deleted successfully' };
      }catch (error) {
        console.error(`Error deleting user with uid ${uid}:`, error);
        return { success: false, message: 'Error deleting user', error };
      }
    }
    static async getUserByUid(uid){
      try{
        const conn = await getConnection();
        const result = await conn.sobject('Users_CRM__c')
        .find({ uid__c: uid })
        return result[0];
      } catch (error) {
        console.error('Error in getting user by uid:', error);
        return null;
      }
    }
  }
   

module.exports = UserService;