const amqp = require('amqplib');
const Faye = require('faye');
const checkDeletedUsers = require('../../salesforce-service/producers/producerDeleteUser');
const connectRabbitmq = require('../../salesforce-service/rabbitmq');
const { getConnection } = require('../../salesforce-service/salesforce');
const checkUpdatedUsers = require('../../salesforce-service/producers/producerUpdateUser');
const startProducer = require('../../salesforce-service/producers/producerCreateUser');

jest.mock('amqplib');
jest.mock('faye');
jest.mock('../../salesforce-service/rabbitmq');
jest.mock('../../salesforce-service/salesforce');

describe('Producer Tests', () => {
    let mockChannel;
    let mockConnection;

    beforeEach(() => {
        jest.clearAllMocks();

        mockChannel = {
            publish: jest.fn(),
        };
        mockConnection = {
            createChannel: jest.fn().mockResolvedValue(mockChannel),
        };
        const mockSalesforceConnection = {
            instanceUrl: 'https://mock.salesforce.com',
            accessToken: 'mockAccessToken',
        };

        connectRabbitmq.mockResolvedValue(mockConnection);
        getConnection.mockResolvedValue(mockSalesforceConnection);
    });

    it('should handle a deleted user', async () => {
        const mockClient = {
            setHeader: jest.fn(),
            subscribe: jest.fn((channel, callback) => {
                const mockMessage = {
                    payload: {
                        email__c: 'test@example.com',
                    },
                };
                callback(mockMessage);
            }),
        };

        Faye.Client.mockImplementation(() => mockClient);

        await checkDeletedUsers();

        expect(connectRabbitmq).toHaveBeenCalled();
        expect(getConnection).toHaveBeenCalled();
        expect(mockClient.setHeader).toHaveBeenCalledWith('Authorization', 'Bearer mockAccessToken');
        expect(mockClient.subscribe).toHaveBeenCalledWith('/event/deleted_user__e', expect.any(Function));
        expect(mockChannel.publish).toHaveBeenCalledWith(
            'user-management',
            'user.delete',
            expect.any(Buffer)
        );
    });

    it('should handle an updated user', async () => {
        const mockClient = {
            setHeader: jest.fn(),
            subscribe: jest.fn((channel, callback) => {
                const mockMessage = {
                    payload: {
                        email__c: 'updated@example.com',
                        first_name__c: 'Updated',
                        last_name__c: 'User',
                        LastModifiedDate: '2025-05-08T12:00:00Z',
                        CreatedDate: '2025-05-07T12:00:00Z',
                    },
                };
                callback(mockMessage);
            }),
        };

        Faye.Client.mockImplementation(() => mockClient);

        await checkUpdatedUsers();

        expect(connectRabbitmq).toHaveBeenCalled();
        expect(getConnection).toHaveBeenCalled();
        expect(mockClient.setHeader).toHaveBeenCalledWith('Authorization', 'Bearer mockAccessToken');
        expect(mockClient.subscribe).toHaveBeenCalledWith('/event/updated_producer__e', expect.any(Function));
        expect(mockChannel.publish).toHaveBeenCalledWith(
            'user-management',
            'user.update',
            expect.any(Buffer)
        );
    });

    it('should handle a created user', async () => {
        const mockClient = {
            setHeader: jest.fn(),
            subscribe: jest.fn((channel, callback) => {
                const mockMessage = {
                    payload: {
                        email__c: 'created@example.com',
                        first_name__c: 'Created',
                        last_name__c: 'User',
                        LastModifiedDate: '2025-05-08T12:00:00Z',
                        CreatedDate: '2025-05-07T12:00:00Z',
                    },
                };
                callback(mockMessage);
            }),
        };

        Faye.Client.mockImplementation(() => mockClient);

        await startProducer();

        expect(connectRabbitmq).toHaveBeenCalled();
        expect(getConnection).toHaveBeenCalled();
        expect(mockClient.setHeader).toHaveBeenCalledWith('Authorization', 'Bearer mockAccessToken');
        expect(mockClient.subscribe).toHaveBeenCalledWith('/event/created_user__e', expect.any(Function));
        expect(mockChannel.publish).toHaveBeenCalledWith(
            'user-management',
            'user.create',
            expect.any(Buffer)
        );

    });
});
