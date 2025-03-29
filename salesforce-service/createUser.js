const { getConnection } = require('./salesforce');

class createUser {
    static async createUser(userData){
        try{
            const conn = await getConnection();
            return await conn.sobject('Users_CRM__c').create({
                email__c: userData.email__c,
                first_name__c: userData.first_name__c,
                last_name__c: userData.last_name__c,
                bus_number__c: userData.bus_number__c,
                city__c: userData.city__c,
                company_id__c: userData.company_id__c,
                country__c: userData.country__c,
                created_at__c: new Date().toISOString(),
                dob__c: userData.dob__c,
                email_registered__c: userData.email_registered__c,
                house_number__c: userData.house_number__c,
                phone__c: userData.phone__c,
                province__c: userData.province__c,
                street_name__c: userData.street_name__c,
                title__c: userData.title__c,
                updated_at__c: new Date().toISOString(),
                created_by_crm_ui__c: 0,
            });
        }catch (error){
            console.error('Error in creating user:', error);
            throw error;
        }
    }}

module.exports = createUser;