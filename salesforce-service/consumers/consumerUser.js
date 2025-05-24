const UserCRUD = require('../crud/UserCRUD');
const { parseStringPromise } = require('xml2js');
const connectRabbitmq = require('../rabbitmq');
const logToMonitoring = require('../logging');


async function startUserConsumer() {
    console.log('Starting user consumer');
    let channel;
    try {
        const connection = await connectRabbitmq();
        channel = await connection.createChannel();

        await channel.consume(
            "crm.user",
            async (message) => {
                try {
                    const xmlData = message.content.toString();
                    const parsedData = await parseStringPromise(xmlData, { explicitArray: false });
                    console.log('Parsed XML data:', parsedData);


                    const operation = parsedData.attendify.info.operation;
                    const user = parsedData.attendify.user;
                    console.log('Parsed XML data:', user);
                    const userData = {
                        id: user?.id || null,
                        email__c: user.email,
                        first_name__c: user.first_name,
                        last_name__c: user.last_name,
                        bus_number__c: user.address?.bus_number || null,
                        city__c: user.address?.city || null,
                        company_id__c: user.company?.id || null,
                        country__c: user.address?.country || null,
                        dob__c: user?.date_of_birth || null,
                        email_registerd__c: user?.email_registered || null,
                        house_number__c: user.address?.number || null,
                        phone__c: user?.phone_number || null,
                        province__c: user.address?.province || null,
                        street_name__c: user.address?.street || null,
                        title__c: user.title,
                        uid__c: user.uid,
                        admin__c: user.is_admin || false,
                    };

                    if (parsedData.attendify.info.sender.toLowerCase() != "crm") {
                        let success = false;
                        let message = "";

                        switch (operation) {
                            case 'create':
                                success = await UserCRUD.createUser(userData);
                                message = success ? 'User created successfully' : 'Failed to create user';
                                logToMonitoring(message, 'user-management', channel);
                                break;
                            case 'update':
                                success = await UserCRUD.updateUser(userData);
                                message = success ? 'User updated successfully' : 'Failed to update user';
                                logToMonitoring(message, 'user-management', channel);
                                break;
                            case 'delete':
                                success = await UserCRUD.deleteUser(userData);
                                message = success ? 'User deleted successfully' : 'Failed to delete user';
                                logToMonitoring(message, 'user-management', channel);
                                break;
                            default:
                                logToMonitoring(`Unknown operation: ${operation}`, 'user-management', channel);
                                return;
                        }
                    }
                } catch (error) {
                    logToMonitoring(`Error processing user message: ${error}`, 'user-management', channel);
                } finally {
                    channel.ack(message);
                }
            }
        )
    } catch (error) {
        logToMonitoring(`Error starting user consumer: ${error}`, 'user-management', channel);
    }
}

async function stopUserConsumer(connection) {
    try {
        await connection.close();
        exit();
    } catch (error) {
        exit();
    }
}

module.exports = { startUserConsumer, stopUserConsumer };