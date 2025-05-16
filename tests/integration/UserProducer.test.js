const amqp = require('amqplib');
const connectRabbitmq = require('../../salesforce-service/rabbitmq');
const { getConnection } = require('../../salesforce-service/salesforce');


describe('Producer Tests', () => {
let connection, channel
  
    // beforeAll(async () => {
    //     connection = await connectRabbitmq();
    //     channel = await connection.createChannel();
    // });

    // afterEach(() => {
    //     jest.clearAllMocks();
    // });

    // afterAll(async () => {
    //     await channel.close();
    //     await connection.close();
    // });


    it('should send a message from the rabbitMQ', async () => {
        const xml = 
        `<attendify>
            <info>
                <operation>create</operation>
                <sender>external</sender>
            </info>
            <user>
                <email>test@example.com</email>
                <first_name>Zena</first_name>
                <last_name>Bollaerts</last_name>
                <title>Ms.</title>
                <uid>SF123456789</uid>
            </user>
        </attendify>`;

        // const sent = channel.sendToQueue('crm.user', Buffer.from(xml), { persistent: true });
        // expect(sent).toBe(true);
        
    })

    // it('should connect to salesforce', async () => {
    //     const connection = await getConnection();
    //     expect(connection).toBeDefined();
    // });
});
