const amqp = require('amqplib');
const UserCRUD = require('../UserCRUD');
const { parseStringPromise } = require('xml2js');
const connectRabbitmq = require('../rabbitmq');


async function startConsumer() {
    console.log('Starting consumer...');
    try{
        //connect to RabbitMQ server
        const connection = await connectRabbitmq();
        console.log('Connected to RabbitMQ.');
        const channel =  await connection.createChannel();
        console.log('Connected to RabbitMQ2.');

        //assert queue
        channel.assertQueue("crm.user", { durable: true });
        console.log(`Consumer is listening on queue: crm.user`);

        //consumer message from the queue
        channel.consume(
            "crm.user",
            async (message) => {
                try {
                //get data from xml
                const xmlData = message.content.toString();
                const parsedData = await parseStringPromise(xmlData, { explicitArray: false });
                console.log('Parsed XML data:', parsedData);


                //extract data from xml
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
                };

                if(parsedData.attendify.info.sender.toLowerCase() != "crm"){
                    if (operation === 'create') {
                        await UserCRUD.createUser(userData);
                    } else if (operation === 'update') {
                        await UserCRUD.updateUser(userData);
                    } else if (operation === 'delete') {
                        await UserCRUD.deleteUser(userData.uid__c);
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

module.exports = startConsumer;