const amqp = require('amqplib');
const { Builder } = require('xml2js');
const { getConnection }  = require('../salesforce');
const fs = require('fs');
const { SfDate } = require('jsforce');
const path = require('path')

const lastCheckFilePath = path.join(__dirname, 'lastUpdateCheck.txt');

async function saveLastCheckTime(time) {
    try {
        fs.writeFileSync(lastCheckFilePath, time.toISOString());
        console.log('Last check time saved successfully.');
    } catch (error) {
        console.error('Error saving last check time:', error);
    }
}

function getLastCheckTime() {
    try {
        if (fs.existsSync(lastCheckFilePath)) {
            const lastCheckTime = fs.readFileSync(lastCheckFilePath, 'utf8').trim();
            return new Date(lastCheckTime);
        }
    } catch (error) {
        console.error('Error reading last check time:', error);
    }
    console.log('No valid last check time found. Defaulting to current time.');
    return new Date();
}

async function checkUpdatedUsers(){
    console.log("checking updated users");
    try{
        const conn = await getConnection();
        const connection = await amqp.connect(process.env.RABBITMQ_URL);
        const channel = await connection.createChannel();

        let lastCheckTime = getLastCheckTime();

        setInterval(async () => {
            try {
                const currentTime = new Date();
                const users = await conn.sobject('Users_CRM__c').find({ LastModifiedDate: { $gte: SfDate.toDateTimeLiteral(lastCheckTime), $lt: SfDate.toDateTimeLiteral(currentTime)}}).execute();
                console.log(`Fetched ${users.length} updated users since last check.`);

                console.log("sending message to RabbitMQ...")
                const builder = new Builder();
                if (users.length > 0) {
                    for(const user of users){
                        if (user.LastModifiedDate !== user.CreatedDate){
                        const mappedUserXML = mapXML(user);
                        const message = builder.buildObject(mappedUserXML);
                        channel.publish("user-management", "user.update", Buffer.from(message));
                    } else {
                        console.log(`Skipping user ${user.Id} as it was just created.`);
                    }
                    }
                }

                lastCheckTime = currentTime;
                saveLastCheckTime(lastCheckTime);
            } catch (error) {
                console.error('Error fetching updated users:', error);
            }
        }, 5000);
    } catch (error) {
        console.error('Error in producer:', error);
    }

    
function mapXML(userXML){
    const mappedUserXML = {
        attendify: {
            info: {
                sender: 'crm',
                operation: 'update',
            },
            user: {
                // id: userXML.Id,
                first_name: userXML.first_name__c,
                last_name: userXML.last_name__c,
                // date_of_birth: userXML.dob__c,
                // phone_number: userXML.phone__c,
                title: userXML.title__c,
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
}
module.exports = checkUpdatedUsers;