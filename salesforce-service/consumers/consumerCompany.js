const CompanyCRUD = require('../crud/CompanyCRUD');
const { parseStringPromise } = require('xml2js');
const connectRabbitmq = require('../rabbitmq');
const logToMonitoring = require('../logging');

async function startCompanyConsumer() {
    console.log('Starting company consumer');
    let channel;
    try {
        const connection = await connectRabbitmq();
        channel = await connection.createChannel();


        await channel.consume(
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
                            city__c: company.address?.city || null,
                            number__c: company.address?.number || null,
                            postcode__c: company.address?.postcode || null,
                            street__c: company.address?.street || null,
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
                    if (parsedData.attendify.info.sender.toLowerCase() != "crm") {
                        let success = false;
                        let message = "";

                        switch (operation) {
                            case 'create':
                                success = await CompanyCRUD.createCompany(companyData);
                                message = success ? 'Company created successfully' : 'Failed to create company';
                                logToMonitoring(message, 'company', channel);
                                break;
                            case 'update':
                                success = await CompanyCRUD.updateCompany(companyData);
                                message = success ? 'Company updated successfully' : 'Failed to update company';
                                logToMonitoring(message, 'company', channel);
                                break;
                            case 'delete':
                                success = await CompanyCRUD.deleteCompany(companyData.uid__c);
                                message = success ? 'Company deleted successfully' : 'Failed to delete company';
                                logToMonitoring(message, 'company', channel);
                                break;
                            case 'register':
                                success = await CompanyCRUD.registerCompanyEmployee(companyRegisterData);
                                message = success ? 'Company employee registered successfully' : 'Failed to register company employee';
                                logToMonitoring(message, 'company', channel);
                                break;
                            case 'unregister':
                                success = await CompanyCRUD.unregisterCompanyEmployee(companyRegisterData);
                                message = success ? 'Company employee unregistered successfully' : 'Failed to unregister company employee';
                                logToMonitoring(message, 'company', channel);
                                break;
                            default:
                                logToMonitoring(`Unknown operation: ${operation}`, 'company', channel);
                                return;
                        }
                    }
                } catch (error) {
                    logToMonitoring(`Error processing company message: ${error}`, 'company', channel);
                } finally {
                    channel.ack(message);
                }
            }
        )
    } catch (error) {
        logToMonitoring(`Error starting company consumer: ${error}`, 'company', channel);
    }
}

async function stopCompanyConsumer(connection) {
    try {
        await connection.close();
        exit();
    } catch (error) {
        exit();
    }
}

module.exports = { startCompanyConsumer, stopCompanyConsumer };