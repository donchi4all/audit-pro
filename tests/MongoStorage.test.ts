import mongoose from 'mongoose';
import { MongoStorage } from '../src/storage/MongoStorage';
import { AuditLogInterface } from '../src/interfaces';
import { LogLevel } from '../src/LogLevel';

describe('MongoStorage', () => {
    const mongoConnectionString = 'mongodb://localhost:27017/test'; // Use a test database
    const tableName = 'auditLogs';
    const dynamicColumns = { additionalInfo: String };

    let mongoStorage: MongoStorage;

    beforeAll(async () => {
        mongoStorage = new MongoStorage(mongoConnectionString, tableName, dynamicColumns);
        await mongoose.connect(mongoConnectionString);
    });

    afterAll(async () => {
        await mongoose.connection.db?.dropDatabase();
        await mongoose.disconnect();
    });

    beforeEach(async () => {
        await mongoose.connection.collection(tableName).deleteMany({}); // Clear logs before each test
    });


    afterEach(async () => {
        // Clear logs after each test to ensure isolation
        const logs = await mongoStorage.fetchAllLogs();
        for (const log of logs) {
            await mongoStorage.deleteLog(log._id);
        }
    });

    it('should log an event successfully', async () => {
        const logEvent: AuditLogInterface = {
            userId: 'user123',
            action: 'CREATE',
            logLevel: LogLevel.INFO,
            metadata: { detail: 'Created a new resource' },
            additionalInfo: 'Extra info about the event',
        };

        await mongoStorage.logEvent(logEvent);
        const logs = await mongoStorage.fetchAllLogs();
        
        expect(logs.length).toBe(1); // Check that one log has been created
        expect(logs[0]).toMatchObject(logEvent); // Validate log content
    });

    it('should fetch logs with filters correctly', async () => {
        const logEvent1: AuditLogInterface = {
            userId: 'user123',
            action: 'CREATE',
            logLevel: LogLevel.INFO,
            metadata: { detail: 'Created a new resource' },
        };

        const logEvent2: AuditLogInterface = {
            userId: 'user456',
            action: 'DELETE',
            logLevel: LogLevel.ERROR,
            metadata: { detail: 'Deleted a resource' },
        };

        await mongoStorage.logEvent(logEvent1);
        await mongoStorage.logEvent(logEvent2);

        const filteredLogs = await mongoStorage.fetchLogs({ action: 'DELETE' });
        expect(filteredLogs.length).toBe(1); // Expect one log to be fetched
        expect(filteredLogs[0]).toMatchObject(logEvent2); // Check the content of the fetched log
    });

    it('should update a log entry', async () => {
        const logEvent: AuditLogInterface = {
            userId: 'user123',
            action: 'CREATE',
            logLevel: LogLevel.INFO,
            metadata: { detail: 'Created a new resource' },
        };

        await mongoStorage.logEvent(logEvent);
        const logs = await mongoStorage.fetchAllLogs();
        const logId = logs[0]._id; // Get the log ID

        const updates = { action: 'UPDATE' };
        await mongoStorage.updateLog(logId, updates);

        const updatedLogs = await mongoStorage.fetchLogs({ _id: logId });
        expect(updatedLogs[0].action).toBe('UPDATE'); // Check that the log was updated
    });

    it('should log an event correctly', async () => {
        const logEvent: AuditLogInterface = {
            userId: 'testUser',
            action: 'testAction',
            logLevel: LogLevel.INFO,
            metadata: { key: 'value' }
        };
    
        await mongoStorage.logEvent(logEvent);
    
        const logs = await mongoStorage.fetchAllLogs();
        expect(logs.length).toBe(1); // Expect one log after insertion
    });
    

    it('should delete a log entry', async () => {
        const logEvent: AuditLogInterface = {
            userId: 'user123',
            action: 'CREATE',
            logLevel: LogLevel.INFO,
            metadata: { detail: 'Created a new resource' },
        };

        await mongoStorage.logEvent(logEvent);
        const logs = await mongoStorage.fetchAllLogs();
        const logId = logs[0]._id; // Get the log ID

        await mongoStorage.deleteLog(logId);
        const deletedLogs = await mongoStorage.fetchAllLogs();

        expect(deletedLogs.length).toBe(0); // Expect no logs after deletion
    });

    it('should count logs correctly', async () => {
        const logEvent1: AuditLogInterface = {
            userId: 'user123',
            action: 'CREATE',
            logLevel: LogLevel.INFO,
            metadata: { detail: 'Created a new resource' },
        };

        const logEvent2: AuditLogInterface = {
            userId: 'user456',
            action: 'DELETE',
            logLevel: LogLevel.ERROR,
            metadata: { detail: 'Deleted a resource' },
        };

        await mongoStorage.logEvent(logEvent1);
        await mongoStorage.logEvent(logEvent2);

        const count = await mongoStorage.countLogs({});
        expect(count).toBe(2); // Expect two logs to be counted
    });
});
