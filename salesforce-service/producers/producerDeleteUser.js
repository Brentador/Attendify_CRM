const amqp = require('amqplib');
const { getConnection } = require('../salesforce');
const { SfDate } = require('jsforce');
const fs = require('fs');
const path = require('path');
const { Builder } = require('xml2js');

const lastCheckFilePath = path.join(__dirname, 'lastDeletedCheck.txt');

function getLastCheckTime(){
    try{
        if (fs.existsSync(lastCheckFilePath)){
            const lastCheckTime = fs.readFileSync(lastCheckFilePath, 'utf8').trim();
            return new Date(lastCheckTime);
        }
    }catch(error){
        console.error('Error reading last check time:', error);
    }
    console.log('No valid last check time found. Defaulting to current time.');
    return new Date();
}

async function saveLastCheckTime(time){
    try {
        fs.writeFileSync(lastCheckFilePath, time.toISOString());
        console.log('Last check time saved successfully.');
    } catch (error) {
        console.error('Error saving last check time:', error);
    }
}

async function checkDeletedUsers(){
    console.log("checking deleted users");
    try{
        const conn = await getConnection();
        const connection = await amqp.connect(process.env.RABBITMQ_URL);
        const channel = await connection.createChannel();

        let lastCheckTime = getLastCheckTime();
        let previousUsers = new Set();


        setInterval(async () => {
            try{
                console.log("checking deleted users");

                const query = `
                    SELECT Name, Email__c, deleted_date__c, deletion_method__c 
                    FROM Tombstone__c 
                    WHERE Deleted_Date__c > ${SfDate.toDateTimeLiteral(lastCheckTime)}
                    ORDER BY deleted_date__c DESC 
                `;
                console.log(`Executing query: ${query}`);

                const result = await conn.query(query);
                const deletedUsers = result.records

                console.log(`Fetched ${deletedUsers.length} deleted users.`);

                for (const user of deletedUsers) {
                    const email = user.email__c
                    if(user.deletion_method__c === 'UI'){
                    console.log(`User deleted: ${email}`);
                    const builder = new Builder();
                    const mappedUserXML = mapXML({ email__c: email });
                    const message = builder.buildObject(mappedUserXML);
                    channel.publish("user-management", "user.delete", Buffer.from(message));
                    console.log(`Message sent for deleted user: ${email}`);
                    } else {
                        console.log('Skipping API-deleted user: ${email}');
                    }
                }

                lastCheckTime = new Date();
                saveLastCheckTime(lastCheckTime);
            }catch (error) {
                console.error('Error fetching deleted users:', error);
            }
        }, 5000);

    }catch (error) {
        console.error('Error in delete producer:', error);
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
                email: userXML.email__c,
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