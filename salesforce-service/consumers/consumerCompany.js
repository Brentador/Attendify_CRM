const CompanyCRUD = require('../crud/CompanyCRUD');
const { parseStringPromise } = require('xml2js');
const connectRabbitmq = require('../rabbitmq');

async function startCompanyConsumer() {
    console.log('Starting company consumer');
    try{
        const connection = await connectRabbitmq();
        const channel =  await connection.createChannel();


        channel.consume(
            "crm.company",
            async (message) => {
                try {
                const xmlData = message.content.toString();
                const parsedData = await parseStringPromise(xmlData, { explicitArray: false });
                console.log('Parsed XML data:', parsedData);


                const operation = parsedData.attendify.info.operation;
                let companyData;
                let companyRegisterData;
                if (operation == 'create' || operation == 'update' || operation == 'delete') {
                    const company = parsedData.attendify.companies.company;
                    console.log('Parsed XML data:', company);
                    companyData = {
                            b_city__c: company.billingAddress?.city || null,
                            b_number__c: company.billingAddress?.number || null,
                            b_postcode__c: company.billingAddress?.postcode || null,
                            b_street__c: company.billingAddress?.street || null,
                            companyNumber__c: company.companyNumber,
                            email__c: company.email,
                            name__c: company.name,
                            phone__c: company.phone,
                            city__c: company.address.city,
                            number__c: company.address.number,
                            postcode__c: company.address.postcode,
                            street__c: company.address.street,
                            uid__c: company.uid,
                            VATNumber__c: company.VATNumber
                    };
                } else if (operation == 'register' || operation == 'unregister') {
                    const companyRegister = parsedData.attendify.company_employee;
                    console.log('Parsed XML data:', companyRegister);
                    companyRegisterData = {
                        company_uid__c: companyRegister.company_id,
                        user_uid__c: companyRegister.uid
                    };
                }
                if(parsedData.attendify.info.sender.toLowerCase() != "crm"){
                    if (operation === 'create') {
                        await CompanyCRUD.createCompany(companyData);
                    } else if (operation === 'update') {
                        await CompanyCRUD.updateCompany(companyData);
                    } else if (operation === 'delete') {
                        await CompanyCRUD.deleteCompany(companyData.uid__c);
                    } else if (operation === 'register') {
                        await CompanyCRUD.registerCompany(companyRegisterData);
                    } else if (operation === 'unregister') {
                        await CompanyCRUD.unregisterCompany(companyRegisterData);
                    } else {
                        console.log('Invalid operation');
                    }
                }
            } catch (error) {
                console.error('Error processing message:', error);
            } finally {
                channel.ack(message);
            }
            }
        )
    }catch(error){
        console.error('Error starting consumer:', error);
    }
}

async function stopCompanyConsumer(connection){
    try{
        await connection.close();
        exit();
    } catch(error){
        exit();
    }
}

module.exports = { startCompanyConsumer, stopCompanyConsumer };