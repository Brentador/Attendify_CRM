const amqp = require('amqplib');
const startUserConsumer = require('../../salesforce-service/consumers/consumerUser');
const UserCRUD = require('../../salesforce-service/UserCRUD');

jest.mock('../../salesforce-service/UserCRUD');
jest.mock('amqplib');

describe('Consumer Tests', () => {
    let fakeChannel;
    let consumeCallback;

    beforeAll(async () => {
        const amqplib = require('amqplib');

        fakeChannel = {
            assertQueue: jest.fn(),
            consume: jest.fn((queue, callback) => {
                consumeCallback = callback;
            }),
            ack: jest.fn()
        };

        amqplib.connect.mockResolvedValue({
            createChannel: jest.fn().mockResolvedValue(fakeChannel),
        });

        await startUserConsumer();
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'log').mockImplementation(() => {});
    });


    it('should create a user', async () => {
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
            </user>
        </attendify>`;

        const message = {
            content: Buffer.from(xml),
        };

        await consumeCallback(message);

        expect(UserCRUD.createUser).toHaveBeenCalledWith(expect.objectContaining({
            email__c: 'test@example.com',
            first_name__c: 'Zena',
            last_name__c: 'Bollaerts',
            title__c: 'Ms.',
            bus_number__c: null,
            city__c: null,
            company_id__c: null,
            country__c: null,
            dob__c: null,
            email_registerd__c: null,
            house_number__c: null,
            phone__c: null,
            province__c: null,
            street_name__c: null,
            id: null
        }));

        expect(fakeChannel.ack).toHaveBeenCalledWith(message);
    })

    it('should update a user', async () => {
        const xml = `
        <attendify>
            <info>
                <operation>update</operation>
                <sender>external</sender>
            </info>
            <user>
                <email>updated@example.com</email>
                <first_name>Updated</first_name>
                <last_name>User</last_name>
                <title>Dr.</title>
            </user>
        </attendify>`;

        const message = {
            content: Buffer.from(xml),
        };

        await consumeCallback(message);

        expect(UserCRUD.updateUser).toHaveBeenCalledWith(expect.objectContaining({
            email__c: 'updated@example.com',
            first_name__c: 'Updated',
            last_name__c: 'User',
            title__c: 'Dr.',
        }));

        expect(fakeChannel.ack).toHaveBeenCalledWith(message);
    })

    it('should delete a user', async () => {
        const xml = `
        <attendify>
            <info>
                <operation>delete</operation>
                <sender>external</sender>
            </info>
            <user>
                <email>delete@example.com</email>
            </user>
        </attendify>`;

        const message = {
            content: Buffer.from(xml),
        };

        await consumeCallback(message);

        expect(UserCRUD.deleteUser).toHaveBeenCalledWith('delete@example.com');
        expect(fakeChannel.ack).toHaveBeenCalledWith(message);
    })

    it('should handle malformed XML gracefully', async () => {
        const malformedXml = `<attendify><info><operation>create</operation></info>`; 
    
        const message = {
            content: Buffer.from(malformedXml),
        };
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        await consumeCallback(message);
    
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Error processing message:',
            expect.any(Error)
        );
        expect(fakeChannel.ack).toHaveBeenCalledWith(message);
        consoleErrorSpy.mockRestore();
    })
})
