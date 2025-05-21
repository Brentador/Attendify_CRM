const { getConnection } = require('./salesforce');

class CompanyService {
    static async getSalesforceId(objectType, uid) {
      const conn = await getConnection();
      const result = await conn.query(`
        SELECT Id FROM ${objectType} WHERE uid__c = '${uid}' LIMIT 1
      `);
      return result.records[0]?.Id || null;
    }

    static async createCompany(companyData) {
      try {
          const conn = await getConnection();
          return await conn.sobject('Company__c').create({
            b_city__c: companyData.b_city__c,
            b_number__c: companyData.b_number__c,
            b_postcode__c: companyData.b_postcode__c,
            b_street__c: companyData.b_street__c,
            companyNumber__c: companyData.companyNumber__c,
            email__c: companyData.email__c,
            name__c: companyData.name__c,
            phone__c: companyData.phone__c,
            city__c: companyData.city__c,
            number__c: companyData.number__c,
            postcode__c: companyData.postcode__c,
            street__c: companyData.street__c,
            uid__c: companyData.uid__c,
            VATNumber__c: companyData.VATNumber__c
        });
      } catch (error) {
          console.error('Error in creating company:', error);
          return;
      }
    }
    
    static async updateCompany(companyData) {
      try {
          const conn = await getConnection();
          
          const result = await conn.sobject('Company__c')
              .find({ uid__c: companyData.uid__c })
              .execute();
          
          if (result) {
              const company = result[0];
              const companyToUpdate = { uid: company.uid };
              for (const [key, value] of Object.entries(companyData)) {
                if (value !== null) {
                    companyToUpdate[key] = value;
                }
              }
              return await conn.sobject('Company__c').update(companyToUpdate);
            
          } else {
              console.log(`No company found with uid: ${companyData.uid__c}`);
              return { success: false, message: 'Company not found' };
          }
      } catch (error) {
        console.error('Error in updating company:', error);
        return;
      } 
    }

    static async deleteCompany(uid){
      try{
        const conn = await getConnection();
  
        const query = `SELECT Id FROM Company__c WHERE uid__c = '${uid}'`
        const result = await conn.query(query);
  
        if (result.records.length === 0){
          console.log(`No company found with uid: ${uid}`)
          return { success: false, message: 'Company not found' }
        }
  
        const companyId = result.records[0].Id;
  
        await conn.sobject('Company__c').destroy(companyId);
        console.log(`Company with uid ${uid} deleted successfully.`);
        return { success: true, message: 'Company deleted successfully' };
      }catch (error) {
        console.error(`Error deleting company with uid ${uid}:`, error);
        return { success: false, message: 'Error deleting company', error };
      }
    }
    static async getCompanyByUid(uid){
      try{
        const conn = await getConnection();
        const result = await conn.sobject('Company__c')
        .find({ uid__c: uid })
        return result[0];
      } catch (error) {
        console.error('Error in getting company by uid:', error);
        return null;
      }
    }

    static async registerCompany(companyRegisterData) {
        try {
            const conn = await getConnection();
            const userId = await this.getSalesforceId('Users_CRM__c', companyRegisterData.user_uid__c);
            const companyId = await this.getSalesforceId('Company__c', companyRegisterData.company_uid__c);
            console.log('User ID:', userId);
            console.log('Company ID:', companyId);
            console.log('user uid:', companyRegisterData.user_uid__c);
            console.log('company uid:', companyRegisterData.company_uid__c);

            const result = await conn.sobject('Company_User__c').create({
                user_uid__c: companyRegisterData.user_uid__c,
                company_uid__c: companyRegisterData.company_uid__c,
                User__c: userId,
                Company__c: companyId
            });
            console.log('Company registered successfully:', result);
            return result;
        } catch (error) {
            console.error('Error in registering company:', error);
            return null;
        }
    }

    static async unregisterCompany(companyRegisterData) {
        try {
            const conn = await getConnection();
            const recordId = await conn.sobject('Company_User__c').findOne({
                user_uid__c: companyRegisterData.user_uid__c,
                company_uid__c: companyRegisterData.company_uid__c
            }, 'Id');

            const result = await conn.sobject('Company_User__c').destroy(recordId.Id);
            console.log('Company unregistered successfully:', result);
            return result;
        } catch (error) {
            console.error('Error in unregistering company:', error);
            return null;
        }
    }

  }

module.exports = CompanyService;