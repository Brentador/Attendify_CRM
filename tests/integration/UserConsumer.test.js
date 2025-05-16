const amqp = require('amqplib');
const connectRabbitmq = require('../../salesforce-service/rabbitmq');
const { getConnection } = require('../../salesforce-service/salesforce');

describe('Consumer Tests', () => {
    let connection, channel
  

    beforeAll(async () => {
        connection = await connectRabbitmq();
        channel = await connection.createChannel();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    afterAll(async () => {
        await channel.close();
        await connection.close();
    });


    it('should revieve a message from the rabbitMQ', async () => {
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

        channel.sendToQueue('crm.user', Buffer.from(xml), { persistent: true });

        // const received = await new Promise((resolve) => {
        //     channel.consume('crm.user', (msg) => {
        //         resolve(msg.content.toString());
        //         channel.ack(msg);
        //     })
        // })
        // expect(received).toBe(xml);
    })

    it('should connect to salesforce', async () => {
        const connection = await getConnection();
        expect(connection).toBeDefined();
    });

    
})

