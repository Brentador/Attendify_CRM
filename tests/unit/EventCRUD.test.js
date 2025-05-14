const EventService = require('../../salesforce-service/consumers/EventCRUD');
const { getConnection } = require('../../salesforce-service/salesforce');

jest.mock('../../salesforce-service/salesforce');

beforeEach(() => {
    jest.clearAllMocks();
});

describe('EventService.createEvent', () => {
    it('should create an event', async () => {
        const mockCreate = jest.fn().mockResolvedValue({ id: 'a00...' });
        getConnection.mockResolvedValue({ sobject: () => ({ create: mockCreate }) });

        const eventData = {
            Address__c: 'Test Address',
            description__c: 'Test Description',
            End_date__c: '2024-12-31T23:59:59Z',
            name_event__c: 'Test Event',
            Start_date__c: '2024-01-01T00:00:00Z',
            Organizer_Name__c: 'Test Organizer',
            Organizer_UID__c: 'ORG123',
            Entrance_Fee__c: '10',
            Uid__c: 'EVENT123'
        };

        const expectedData = {
            Address__c: 'Test Address',
            description__c: 'Test Description',
            End_date__c: '2024-12-31T23:59:59Z',
            name_event__c: 'Test Event',
            Start_date__c: '2024-01-01T00:00:00Z',
            Organizer_Name__c: 'Test Organizer',
            Organizer_UID__c: 'ORG123',
            Entrance_Fee__c: '10',
            Uid__c: 'EVENT123'
        };


        const result = await EventService.createEvent(eventData);

        expect(getConnection).toHaveBeenCalledTimes(1);
        expect(mockCreate).toHaveBeenCalledWith(expectedData);
        expect(result).toEqual({ id: 'a00...' });
    });

    it('should handle errors during event creation', async () => {
        const mockCreate = jest.fn().mockRejectedValue(new Error('Create error'));
        getConnection.mockResolvedValue({ sobject: () => ({ create: mockCreate }) });

        const eventData = {
            Address__c: 'Test Address',
            description__c: 'Test Description',
            End_date__c: '2024-12-31T23:59:59Z',
            name_event__c: 'Test Event',
            Start_date__c: '2024-01-01T00:00:00Z',
            Organizer_Name__c: 'Test Organizer',
            Organizer_UID__c: 'ORG123',
            Entrance_Fee__c: '10',
            Uid__c: 'EVENT123'
        };

        await expect(EventService.createEvent(eventData)).rejects.toThrow('Create error');
        expect(getConnection).toHaveBeenCalledTimes(1);
        expect(mockCreate).toHaveBeenCalled();
    });
});

describe('EventService.updateEvent', () => {
    const eventData = {
        Uid__c: 'EVENT123',
        description__c: 'Updated Description',
    };

    it('should update an event', async () => {
        const mockQuery = jest.fn().mockResolvedValue({ records: [{ Id: 'a00...' }] });
        const mockUpdate = jest.fn().mockResolvedValue({ success: true });
        getConnection.mockResolvedValue({
            query: mockQuery,
            sobject: () => ({
                update: mockUpdate,
            }),
        });

        const expectedUpdateData = {
            Id: 'a00...',
            description__c: 'Updated Description',
        };


        const result = await EventService.updateEvent(eventData);

        expect(getConnection).toHaveBeenCalledTimes(1);
        expect(mockQuery).toHaveBeenCalledWith(`SELECT Id FROM Eventcrm__c WHERE Uid__c = 'EVENT123' LIMIT 1`);
        expect(mockUpdate).toHaveBeenCalledWith(expectedUpdateData);
        expect(result).toEqual({ success: true });
    });

    it('should handle event not found during update', async () => {
        const mockQuery = jest.fn().mockResolvedValue({ records: [] });
        getConnection.mockResolvedValue({
            query: mockQuery,
        });

        const eventData = {
            Uid__c: 'EVENT123',
            description__c: 'Updated Description',
        };

        const result = await EventService.updateEvent(eventData);

        expect(getConnection).toHaveBeenCalledTimes(1);
        expect(mockQuery).toHaveBeenCalledWith(`SELECT Id FROM Eventcrm__c WHERE Uid__c = 'EVENT123' LIMIT 1`);
        expect(result).toEqual({ success: false, message: 'Event not found' });
    });

    it('should handle errors during update', async () => {
        const mockQuery = jest.fn().mockResolvedValue({ records: [{ Id: 'a00...' }] });
        const mockUpdate = jest.fn().mockRejectedValue(new Error('Update error'));
        getConnection.mockResolvedValue({
            query: mockQuery,
            sobject: () => ({
                update: mockUpdate,
            }),
        });

        const eventData = {
            Uid__c: 'EVENT123',
            description__c: 'Updated Description',
        };

        await expect(EventService.updateEvent(eventData)).rejects.toThrow('Update error');

        expect(getConnection).toHaveBeenCalledTimes(1);
        expect(mockQuery).toHaveBeenCalledWith(`SELECT Id FROM Eventcrm__c WHERE Uid__c = 'EVENT123' LIMIT 1`);
        expect(mockUpdate).toHaveBeenCalled();
    });

    it('should return success if no fields to update are provided', async () => {
        const mockQuery = jest.fn().mockResolvedValue({ records: [{ Id: 'a00...' }] });
        getConnection.mockResolvedValue({
            query: mockQuery,
        });

        const eventDataWithOnlyUid = { Uid__c: 'EVENT123' };
        const result = await EventService.updateEvent(eventDataWithOnlyUid);

        expect(getConnection).toHaveBeenCalledTimes(1);
        expect(mockQuery).toHaveBeenCalledWith(`SELECT Id FROM Eventcrm__c WHERE Uid__c = 'EVENT123' LIMIT 1`);
        expect(result).toEqual({ success: true, message: 'No fields to update provided', id: 'a00...' });
    });
});

describe('EventService.deleteEvent', () => {
    it('should delete an event', async () => {
        const mockQuery = jest.fn().mockResolvedValue({ records: [{ Id: 'a00...' }] });
        const mockDestroy = jest.fn().mockResolvedValue({});
        getConnection.mockResolvedValue({
            query: mockQuery,
            sobject: () => ({
                destroy: mockDestroy,
            }),
        });

        const result = await EventService.deleteEvent('EVENT123');

        expect(getConnection).toHaveBeenCalledTimes(1);
        expect(mockQuery).toHaveBeenCalledWith(`SELECT Id FROM Eventcrm__c WHERE Uid__c = 'EVENT123'`);
        expect(mockDestroy).toHaveBeenCalledWith('a00...');
        expect(result).toEqual({ success: true, message: 'Event deleted successfully' });
    });

    it('should handle event not found during deletion', async () => {
        const mockQuery = jest.fn().mockResolvedValue({ records: [] });
        getConnection.mockResolvedValue({
            query: mockQuery,
        });

        const result = await EventService.deleteEvent('EVENT123');

        expect(getConnection).toHaveBeenCalledTimes(1);
        expect(mockQuery).toHaveBeenCalledWith(`SELECT Id FROM Eventcrm__c WHERE Uid__c = 'EVENT123'`);
        expect(result).toEqual({ success: false, message: 'Event not found' });
    });

    it('should handle errors during deletion', async () => {
        const mockQuery = jest.fn().mockResolvedValue({ records: [{ Id: 'a00...' }] });
        const mockDestroy = jest.fn().mockRejectedValue(new Error('Delete error'));
        getConnection.mockResolvedValue({
            query: mockQuery,
            sobject: () => ({
                destroy: mockDestroy,
            }),
        });

        const result = await EventService.deleteEvent('EVENT123');

        expect(getConnection).toHaveBeenCalledTimes(1);
        expect(mockQuery).toHaveBeenCalledWith(`SELECT Id FROM Eventcrm__c WHERE Uid__c = 'EVENT123'`);
        expect(mockDestroy).toHaveBeenCalledWith('a00...');
        expect(result).toEqual({ success: false, message: 'Error deleting event', error: 'Delete error' });
    });
});