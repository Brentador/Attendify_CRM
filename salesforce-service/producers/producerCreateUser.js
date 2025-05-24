const amqp = require('amqplib');
const { Builder } = require('xml2js');
const { getConnection } = require('../salesforce');
const bcrypt = require("bcryptjs");
const Faye = require('faye');
const connectRabbitmq = require('../rabbitmq');
const logToMonitoring = require('../logging');



async function checkCreatedUsers() {
    console.log('Checking users...');
    try {
        const connection = await connectRabbitmq();
        const conn = await getConnection();
        const channel = await connection.createChannel();
        const instanceUrl = conn.instanceUrl;
        const accessToken = conn.accessToken;

        const client = new Faye.Client(`${instanceUrl}/cometd/58.0`, {
            timeout: 60,
            retry: 1,
        });

        client.setHeader('Authorization', `Bearer ${accessToken}`);
            console.log('Attempting to subscribe to created user channel');
            void client.subscribe('/event/created_producer__e', async (message) => {
                console.log('Received created user event:', message);
    
                const user = message.payload;
                console.log(`User event: ${user.email__c}`);
                const builder = new Builder();
                const plainTextPassword = generateString(12);
                const hashedPassword = await createPassword(plainTextPassword);
                const userMessage = builder.buildObject(mapXML(user, hashedPassword));
                channel.publish("user-management", "user.register", Buffer.from(userMessage));
                logToMonitoring(`Create use message sent to queue`, 'user-management', channel);
            });
    } catch (error) {
        logToMonitoring(`Error in user create producer: ${error.message}`, 'user-management', channel);
    }
}

function generateString(length) {
    const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

async function createPassword(randomString) {
    const saltRounds = 12; 

    let hashedString = null;
    try {
        hashedString = await bcrypt.hash(randomString, saltRounds);
    } catch (error) {
        console.error("Error hashing:", error);
    }
    return hashedString;
}

function mapXML(userXML, hashedPassword) {
    const mappedUserXML = {
        attendify: {
            info: {
                sender: 'crm',
                operation: 'create',
            },
            user: {
                uid: userXML.uid__c,
                first_name: userXML.first_name__c,
                last_name: userXML.last_name__c,
                // date_of_birth: userXML.dob__c,
                // phone_number: userXML.phone__c,
                title: userXML.title__c,
                email: userXML.email__c,
                password: hashedPassword,
                //         address: {
                //             street: userXML.street_name__c,
                //             number: userXML.house_number__c,
                //             bus_number: userXML.bus_number__c,
                //             city: userXML.city__c,
                //             province: userXML.province__c,
                //             country: userXML.country__c,
                //             postal_code: userXML.postcode__c,
                //         },

                //         payment_details: {
                //             facturation_address: {
                //                 street: userXML.street_name__c,
                //                 number: userXML.house_number__c,
                //                 bus_number: userXML.bus_number__c,
                //                 city: userXML.city__c,
                //                 province: userXML.province__c,
                //                 country: userXML.country__c,
                //                 postal_code: userXML.postcode__c,
                //             },
                //             payment_method: '',
                //             card_number: '',
                //         },
                //         email_registered: userXML.email_registered__c,

                //         company: {
                //             id: userXML.company_id__c,
                //             name: '',
                //             VAT_number: '',
                //             address: {
                //                 street: '',
                //                 number: '',
                //                 bus_number: '',
                //                 city: '',
                //                 province: '',
                //                 country: '',
                //                 postal_code: '',
                //             },
                //         },
            }
        }
    }
    return mappedUserXML;
}




module.exports = {checkCreatedUsers, createPassword};