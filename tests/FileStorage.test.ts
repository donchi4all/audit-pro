import { FileStorage } from '../src/storage/FileStorage'; // Adjust the path as necessary
import { LogLevel } from '../src/LogLevel';
import { AuditLog } from '../src/interfaces';

describe('FileStorage', () => {
    const fileStorage = new FileStorage('logs.json', {});

    it('should log an event successfully', async () => {
        const logEvent: AuditLog = {
            id: 'test-log-id',
            userId: 'testUser',
            action: 'Test Action',
            logLevel: LogLevel.INFO,
            timestamp: new Date(),
            metadata: { ipAddress: '127.0.0.1' },
        };

        await fileStorage.logEvent(logEvent);

        const logs = await fileStorage.fetchLogs({ userId: 'testUser' });
        expect(logs).toHaveLength(1);
        expect(logs[0].action).toBe('Test Action');
    });

    it('should fetch all logs', async () => {
        const allLogs = await fileStorage.fetchAllLogs();
        expect(allLogs).toBeDefined();
        expect(allLogs.length).toBeGreaterThan(0); // Adjust based on your setup
    });

    it('should delete a log', async () => {
        await fileStorage.deleteLog('test-log-id');
        const logs = await fileStorage.fetchLogs({ userId: 'testUser' });
        expect(logs).toHaveLength(0); // Log should be deleted
    });
});
