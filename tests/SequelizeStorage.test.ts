import { Sequelize } from 'sequelize';
import { SequelizeStorage } from '../src/storage/SequelizeStorage';
import { AuditLog } from '../src/interfaces';
import { LogLevel } from '../src/LogLevel';

describe('SequelizeStorage', () => {
    const sequelize = new Sequelize('mysql://root:password@localhost:3306/audit', {
        logging: false, // Disable logging for cleaner test output
    });
    
    const tableName = 'AuditLogs';
    const dynamicColumns = {}; // You can define dynamic columns if needed

    let sequelizeStorage: SequelizeStorage;

    beforeAll(async () => {
        sequelizeStorage = new SequelizeStorage(sequelize, tableName, dynamicColumns);
        await sequelizeStorage.syncTable(); // Ensure the table is created before tests
    });

    afterAll(async () => {
        await sequelize.close(); // Close the database connection after all tests
    });

    afterEach(async () => {
        // Clear logs after each test to ensure isolation
        const logs = await sequelizeStorage.fetchAllLogs();
        await Promise.all(logs.map(log => log.id ? sequelizeStorage.deleteLog(log.id) : Promise.resolve()));
    });


    it('should log an event correctly', async () => {
        const logEvent: AuditLog = {
            userId: 'testUser',
            action: 'testAction',
            logLevel: LogLevel.INFO,
            timestamp: new Date(),
            metadata: {}
        };

        await sequelizeStorage.logEvent(logEvent);
        const logs = await sequelizeStorage.fetchAllLogs();
        expect(logs.length).toBe(1); // Expect one log after insertion
        expect(logs[0].userId).toBe(logEvent.userId);
        expect(logs[0].action).toBe(logEvent.action);
    });

    it('should delete a log entry', async () => {
        const logEvent: AuditLog = {
            userId: 'testUser',
            action: 'testAction',
            logLevel: LogLevel.INFO,
            timestamp: new Date(),
            metadata: {}
        };

        // Log the event
        await sequelizeStorage.logEvent(logEvent);

        // Fetch the log entry
        const log = await sequelizeStorage.fetchLog({ userId: 'testUser' });

        // Ensure the log exists and delete it
        if (log?.id) {
            await sequelizeStorage.deleteLog(log.id); // Delete the log
        }

        // Fetch all logs to check if the deletion was successful
        const deletedLogs = await sequelizeStorage.fetchAllLogs();

        // Expect no logs after deletion
        expect(deletedLogs.length).toBe(0);
    });


    it('should count logs correctly', async () => {
        await sequelizeStorage.logEvent({
            userId: 'testUser1',
            action: 'testAction1',
            logLevel: LogLevel.INFO,
            timestamp: new Date(),
            metadata: {}
        });

        await sequelizeStorage.logEvent({
            userId: 'testUser2',
            action: 'testAction2',
            logLevel: LogLevel.INFO,
            timestamp: new Date(),
            metadata: {}
        });

        const count = await sequelizeStorage.countLogs({});
        expect(count).toBe(2); // Expect two logs to be counted
    });

    it('should fetch logs with filters', async () => {
        const logEvent: AuditLog = {
            userId: 'testUser',
            action: 'testAction',
            logLevel: LogLevel.INFO,
            timestamp: new Date(),
            metadata: {}
        };

        await sequelizeStorage.logEvent(logEvent);
        const filteredLogs = await sequelizeStorage.fetchLogs({ userId: 'testUser' });

        expect(filteredLogs.length).toBe(1); // Expect one log to match the filter
        expect(filteredLogs[0].userId).toBe(logEvent.userId);
    });

    it('should delete a log entry', async () => {
        const logEvent: AuditLog = {
            userId: 'testUser',
            action: 'testAction',
            logLevel: LogLevel.INFO,
            timestamp: new Date(),
            metadata: {}
        };

        await sequelizeStorage.logEvent(logEvent);
        const log = await sequelizeStorage.fetchLog({ userId: 'testUser' });

        // Check if log exists before deleting
        if (log && log.id) {
            await sequelizeStorage.deleteLog(log.id); // Delete the log
        } else {
            throw new Error("Log entry not found for deletion");
        }

        // Verify no logs exist after deletion
        const deletedLogs = await sequelizeStorage.fetchAllLogs();
        expect(deletedLogs.length).toBe(0); // Expect no logs after deletion
    });


});
