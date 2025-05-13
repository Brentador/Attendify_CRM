const UserCRUD = require('../../salesforce-service/UserCRUD');
const { getConnection } = require('../../salesforce-service/salesforce');

jest.mock('../../salesforce-service/salesforce');

beforeEach(() => {
    jest.clearAllMocks();
});

describe('UserCRUD.createUser', () => {
    it('should create a user', async () => {
        const mockCreate = jest.fn().mockResolvedValue({ id: '12345' });
        getConnection.mockResolvedValue({ sobject: () => ({ create: mockCreate }) });

        const userData = {
            email__c: 'test@example.com',
            first_name__c: 'Test',
            last_name__c: 'person',
            bus_number__c: '123',
            city__c: 'Test City',
            company_id__c: 'COMP123',
            country__c: 'Test Country',
            dob__c: '1990-01-01',
            email_registered__c: true,
            house_number__c: '456',
            phone__c: '1234567890',
            province__c: 'Test Province',
            street_name__c: 'Test Street',
            title__c: 'Mr.',
            uid__c: 'SF123456789',
        }
        const result = await UserCRUD.createUser(userData);
        expect(getConnection).toHaveBeenCalledTimes(1);
        expect(mockCreate).toHaveBeenCalledWith(userData);
        expect(result).toEqual({ id: '12345' });
    });
    
    it('should handle errors gracefully', async () => {
        getConnection.mockRejectedValue(new Error('Salesforce Connection error'));

        const userData = {
            email__c: 'test@example.com',
            first_name__c: 'Test',
            last_name__c: 'Icle',
            Title__c: 'Mr.'
        }

        const result = await UserCRUD.createUser(userData);
        expect(result).toBeUndefined();
    });
})

describe('UserCRUD.updateUser', () => {
    const userData = {
        email__c: 'test@example.com',
        first_name__c: 'Updated'
    };

    it('should update a user', async () => {
        const mockUpdate = jest.fn().mockResolvedValue({ success: true });
        const mockExecute = jest.fn().mockResolvedValue([{ Id: '12345' }]);
        const mockFind = jest.fn(() => ({ execute: mockExecute }));
        getConnection.mockResolvedValue({ 
            sobject: () => ({ 
                find: mockFind, 
                update: mockUpdate 
            }) 
        });

        const result = await UserCRUD.updateUser(userData);

        expect(getConnection).toHaveBeenCalledTimes(1);
        expect(mockFind).toHaveBeenCalledWith({ uid__c: userData.uid__c });
        expect(mockExecute).toHaveBeenCalled();
        expect(mockUpdate).toHaveBeenCalledWith({ Id: '12345', ...userData });
        expect(result).toEqual({ success: true });

    });

    it('should handle errors during find', async () => {
        const mockFind = jest.fn().mockImplementation(() => ({
            execute: jest.fn().mockRejectedValue(new Error('Find error')),
        }));
        getConnection.mockResolvedValue({
            sobject: () => ({
                find: mockFind,
            }),
        });

        const result = await UserCRUD.updateUser(userData);

        expect(getConnection).toHaveBeenCalledTimes(1);
        expect(mockFind).toHaveBeenCalledWith({ uid__c: userData.uid__c });
        expect(result).toBeUndefined();
    });

    it('should handle errors during update', async () => {
        const mockFind = jest.fn().mockImplementation(() => ({
            execute: jest.fn().mockResolvedValue([{ Id: '12345' }]),
        }));
        const mockUpdate = jest.fn().mockRejectedValue(new Error('Update error'));
        getConnection.mockResolvedValue({
            sobject: () => ({
                find: mockFind,
                update: mockUpdate,
            }),
        });

        const result = await UserCRUD.updateUser(userData);

        expect(getConnection).toHaveBeenCalledTimes(1);
        expect(mockFind).toHaveBeenCalledWith({ uid__c: userData.uid__c });
        expect(mockUpdate).toHaveBeenCalledWith({ Id: '12345', ...userData });
        expect(result).toBeUndefined();
    });

})

describe('UserCRUD.deleteUser', () => {
    it('should delete a user', async () => {
        const mockQuery = jest.fn().mockResolvedValue({ records: [{ Id: '12345' }] });
        const mockDestroy = jest.fn().mockResolvedValue({ success: true });
        getConnection.mockResolvedValue({
            query: mockQuery,
            sobject: () => ({
                destroy: mockDestroy,
            }),
        })
        
        const result = await UserCRUD.deleteUser('SF1747078879231');
        expect(getConnection).toHaveBeenCalledTimes(1);
        expect(mockQuery).toHaveBeenCalledWith(`SELECT Id FROM Users_CRM__c WHERE uid__c = 'SF1747078879231'`);
        expect(mockDestroy).toHaveBeenCalledWith('12345');
        expect(result).toEqual({ success: true, message: 'User deleted successfully' });
    });

    it('should handle user not found', async () => {
        const mockQuery = jest.fn().mockResolvedValue({ records: [] });
        getConnection.mockResolvedValue({
            query: mockQuery,
        });

        const result = await UserCRUD.deleteUser('SF1747078879231');
        expect(getConnection).toHaveBeenCalledTimes(1);
        expect(mockQuery).toHaveBeenCalledWith(`SELECT Id FROM Users_CRM__c WHERE uid__c = 'SF1747078879231'`);
        expect(result).toEqual({ success: false, message: 'User not found' });
    });

})