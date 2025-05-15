const amqp = require('amqplib');
const UserCRUD = require('../../salesforce-service/UserCRUD');
const connectRabbitmq = require('../../salesforce-service/rabbitmq');

jest.mock('../../salesforce-service/UserCRUD');



describe('Consumer Tests', () => {
    let connection, channel
    const createUser = jest.fn()
    const updateUser = jest.fn()
    const deleteUser = jest.fn()
    const getUserByUid = jest.fn()

    beforeAll(async () => {
        connection = await connectRabbitmq();
        channel = await connection.createChannel();    
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterAll(async () => {
        if (channel) await channel.close();
        if (connection) await connection.close();
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
                <uid>SF123456789</uid>
            </user>
        </attendify>`;

        UserCRUD.createUser.mockResolvedValueOnce(xml);

        channel.sendToQueue('crm.user', Buffer.from(xml), { persistent: true });
        await new Promise(resolve => setTimeout(resolve, 100));

        // expect(UserCRUD.createUser).toHaveBeenCalledWith(expect.objectContaining({
        // email__c: 'test@example.com',
        // first_name__c: 'Zena',
        // last_name__c: 'Bollaerts',
        // title__c: 'Ms.',
        // uid__c: 'SF123456789'
        // }));
        expect(createUser).toHaveBeenCalledWith(expect.objectContaining({
        email__c: 'test@example.com',
        first_name__c: 'Zena',
        last_name__c: 'Bollaerts',
        title__c: 'Ms.',
        uid__c: 'SF123456789'
        }));
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
                <uid>SF123456789</uid>
            </user>
        </attendify>`;

        UserCRUD.updateUser.mockResolvedValue({ success: true });

        channel.sendToQueue('crm.user', Buffer.from(xml), { persistent: true });
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(UserCRUD.updateUser).toHaveBeenCalledWith(expect.objectContaining({
            email__c: 'updated@example.com',
            first_name__c: 'Updated',
            last_name__c: 'User',
            title__c: 'Dr.',
            uid__c: 'SF123456789'
        }));
    });

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

        UserCRUD.deleteUser.mockResolvedValue({ success: true });

        channel.sendToQueue('crm.user', Buffer.from(xml), { persistent: true });
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(UserCRUD.deleteUser).toHaveBeenCalledWith(expect.objectContaining({
            email__c: 'delete@example.com',
        }));
    })

    it('should handle malformed XML gracefully', async () => {
        const malformedXml = `<attendify><info><operation>create</operation></info>`; 
    
        channel.sendToQueue('crm.user', Buffer.from(malformedXml), { persistent: true });
        expect(UserCRUD.createUser).not.toHaveBeenCalled();
        expect(UserCRUD.updateUser).not.toHaveBeenCalled();
        expect(UserCRUD.deleteUser).not.toHaveBeenCalled();
    })
})

