const amqp = require('amqplib');
const startUserConsumer = require('../../salesforce-service/consumers/consumerUser');
const UserCRUD = require('../../salesforce-service/UserCRUD');
const { parseStringPromise } = require('xml2js');
const {EventEmitter} = require('events');
const { Builder } = require('xml2js');
const { getConnection } = require('../../salesforce-service/salesforce');
const bcrypt = require("bcryptjs");
const Faye = require('faye');
const connectRabbitmq = require('../../salesforce-service/rabbitmq');
const e = require('express');
const startProducer = require('../../salesforce-service/producers/producerCreateUser');
const checkDeletedUsers = require('../../salesforce-service/producers/producerUpdateUser');
const checkUpdatedUsers = require('../../salesforce-service/producers/producerDeleteUser');


jest.mock('../../salesforce-service/salesforce');
jest.mock('bcryptjs');
jest.mock('faye');
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
})




describe('Producer Tests', () => {

})