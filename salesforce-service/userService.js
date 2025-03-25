const { getConnection } = require('./salesforce');

class UserService {
    static async createUser(){
        try{
            const conn = await getConnection();
            return await conn.sobject('Users_CRM__c').create({
                email__c: 'test@gmail.com',
                first_name__c: 'John',
                last_name__c: 'Doe',
                bus_number__c: '12345',
                city__c: 'Brussels',
                company_id__c: 12,
                country__c: 'Belgium',
                created_at__c: new Date().toISOString(),
                dob__c: '1990-01-01',
                email_registered__c: 1,
                house_number__c: 12,
                phone__c: '1234567890',
                province__c: 'zada',
                street_name__c: 'abc',
                title__c: 'Mr',
                updated_at__c: new Date().toISOString(),
            });
        }catch (error){
            console.error('Error in creating user:', error);
            throw error;
        }
    }}

module.exports = UserService;