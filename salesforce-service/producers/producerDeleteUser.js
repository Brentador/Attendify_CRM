const amqp = require('amqplib');
const { getConnection } = require('../salesforce');
const { Builder } = require('xml2js');
const Faye = require('faye');
const connectRabbitmq = require('../rabbitmq');
const logToMonitoring = require('../logging');

async function checkDeletedUsers(){
    console.log("checking deleted users");
    try{
        const connection = await connectRabbitmq();
        const conn = await getConnection();
        const channel = await connection.createChannel();
        const instanceUrl = conn.instanceUrl;
        const accessToken = conn.accessToken;

        const client = new Faye.Client(`${instanceUrl}/cometd/58.0`,{
            timeout: 60,
            retry: 1,
        });

        client.setHeader('Authorization', `Bearer ${accessToken}`);

        void client.subscribe('/event/deleted_user__e', (message) =>{
            console.log('Received message:', message);

            const user = message.payload;
            const uid = user.uid__c;
            console.log(`User deleted: ${uid}`);
            const builder = new Builder();
            const mappedUserXML = mapXML({ uid__c: uid });
            const messageXML = builder.buildObject(mappedUserXML);
            channel.publish("user-management", "user.delete", Buffer.from(messageXML));
            logToMonitoring(`Delete user message sent to delete queue: ${uid}`, 'user-management', channel);
        })
    }catch (error) {
        logToMonitoring(`Error in user delete producer: ${error.message}`, 'user-management', channel);
    }
}

function mapXML(userXML){
    const mappedUserXML = {
        attendify: {
            info: {
                sender: 'crm',
                operation: 'delete',
            },
            user: {
                // id: userXML.Id,
                // first_name: userXML.first_name__c,
                // last_name: userXML.last_name__c,
                // date_of_birth: userXML.dob__c,
                // phone_number: userXML.phone__c,
                // title: userXML.title__c,
                uid: userXML.uid__c,
                // address: {
                //     street: userXML.street_name__c,
                //     number: userXML.house_number__c,
                //     bus_number: userXML.bus_number__c,
                //     city: userXML.city__c,
                //     province: userXML.province__c,
                //     country: userXML.country__c,
                //     postal_code: userXML.postcode__c,
                // },

                // payment_details: {
                //     facturation_address: {
                //         street: userXML.street_name__c,
                //         number: userXML.house_number__c,
                //         bus_number: userXML.bus_number__c,
                //         city: userXML.city__c,
                //         province: userXML.province__c,
                //         country: userXML.country__c,
                //         postal_code: userXML.postcode__c,
                //     },
                //     payment_method: '',
                //     card_number: '',
                // },
                // email_registered: userXML.email_registered__c,

                // company: {
                //     id: userXML.company_id__c,
                //     name: '',
                //     VAT_number: '',
                //     address: {
                //         street: '',
                //         number: '',
                //         bus_number: '',
                //         city: '',
                //         province: '',
                //         country: '',
                //         postal_code: '',
                //     },
                // },
            }
        }
    }
    return mappedUserXML;
}

module.exports = checkDeletedUsers;