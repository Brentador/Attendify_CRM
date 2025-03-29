const amqp = require('amqplib');
const { Builder } = require('xml2js');
const { getConnection }  = require('../salesforce');
const fs = require('fs');
const { SfDate } = require('jsforce');
const path = require('path');
const bcrypt = require("bcryptjs");

function startProducer() { console.log("Starting producer"); checkUsers(); }

const lastCheckfilePath = path.join(__dirname, 'lastCheck.txt');

function getLastChecktime(){
    try{
        if (fs.existsSync(lastCheckfilePath)){
            const lastCheckTime = fs.readFileSync(lastCheckfilePath, 'utf8').trim();
            return new Date(lastCheckTime);
        }
    }catch(error){
        console.error('Error reading last check time:', error);
    }
    console.log('No valid last check time found. Defaulting to current time.');
    return new Date();
}

async function saveLastCheckTime(time){
    let cb = (err) => {
        if (err) {
            console.error('Error saving last check time:', err);
        } else {
            console.log('Last check time saved successfully.');
            console.log(fs.readFileSync(lastCheckfilePath, 'utf8'));
            console.log(lastCheckfilePath);
        }
    }
    try {
        fs.writeFile(lastCheckfilePath, time.toISOString(), cb);
    }catch(error){
        console.error('Error saving last check time:', error);
    }
}

async function checkUsers() {
    console.log('Checking users...');
    try{
        const conn = await getConnection();
        setTimeout(() => {
        }, 3000);
        const connection = await amqp.connect(process.env.RABBITMQ_URL);
        const channel = await connection.createChannel();

        let lastCheckTime = getLastChecktime();

        setInterval(async () => {
            try{
                const currentTime = new Date();
                const users = await conn.sobject('Users_CRM__c').find({CreatedDate: { $gte: SfDate.toDateTimeLiteral(lastCheckTime), $lt: SfDate.toDateTimeLiteral(currentTime)}}).execute();
                console.log(`Fetched ${users.length} users since last check.`);

                

                const filteredUsers = users.filter((user) => user.created_by_crm_ui__c == 1);
                
                console.log("sending message to RabbitMQ...")
                const builder = new Builder();
                for (const user of filteredUsers){
                    const message = builder.buildObject(mapXML(user));
                    const mailMessage = builder.buildObject(mailXML(user));
                    channel.publish("user-management", "user.register", Buffer.from(message));
                    channel.publish("user-management", "user.generatePassword", Buffer.from(mailMessage));
                }
                lastCheckTime = currentTime;
                await saveLastCheckTime(lastCheckTime);
            }catch(error){
                console.error('Error fetching users or sending users:', error);
            }
        }, 5000);
    } catch (error) {
        console.error('Error in producer:', error);
    }
}

function generateString(length = 12){
    const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function createPassword(randomString) {
    const saltRounds = 12; // Cost factor (12 in your case)
    
    let hashedString = null;
    try {
      hashedString = await bcrypt.hash(randomString, saltRounds);
    //   const formattedHash = hashedString.replace("$2b$", "$2y$");
      console.log(`Random String: ${randomString}`);
    //   console.log(`Hashed (bcrypt): ${formattedHash}`);
    } catch (error) {
      console.error("Error hashing:", error);
    }
    return hashedString;
}
const plainTextPassword = generateString(12);
const hashedPassword = createPassword(plainTextPassword);

function mapXML(userXML){
    const mappedUserXML = {
        attendify: {
            info: {
                sender: 'crm',
                operation: 'create',
            },
            user: {
                // id: userXML.Id,
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

function mailXML(userXML){
    const mappedUserXML = {
        attendify: {
            info: {
                sender: 'crm',
                operation: 'create',
            },
            user: {
                first_name: userXML.first_name__c,
                last_name: userXML.last_name__c,
                title: userXML.title__c,
                email: userXML.email__c,
                password: plainTextPassword,
            }
        }
    }
    return mappedUserXML;
}


module.exports = startProducer;