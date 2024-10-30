import { AuditLogger } from '../src/AuditLogger';
import { ConsoleLogger } from '../src/ConsoleLogger';
import { StorageInterface, AuditLogInterface } from '../src/interfaces';
import { LogLevelEnum } from '../src/LogLevel';


describe('AuditLogger', () => {
    let storage: jest.Mocked<StorageInterface>;
    let consoleLogger: jest.Mocked<ConsoleLogger>;
    let auditLogger: AuditLogger;

    beforeEach(() => {
        // Mock the console.error function
        jest.spyOn(console, 'error').mockImplementation(() => { });

        storage = {
            logEvent: jest.fn(),
            fetchLogs: jest.fn(),
            fetchLog: jest.fn(),
            updateLog: jest.fn(),
            deleteLog: jest.fn(),
            countLogs: jest.fn(),
            findAll: jest.fn(),
            deleteLogsOlderThan: jest.fn(), // Include the required method
            getTableName: jest.fn().mockReturnValue('logs'),
            getModelInstance: jest.fn(),
        };

        consoleLogger = {
            getIsEnabled: jest.fn().mockReturnValue(true),
            logEventToConsole: jest.fn(),
            isEnabled: true, // Add required properties
            columns: [],     // Add required properties
            defaultColumns: [], // Add required properties
            colorizets: jest.fn(), // Add required method if necessary
        } as any; // Use 'as any' if the structure is complex

        auditLogger = new AuditLogger(storage, consoleLogger);
    });

    it('should log an event successfully', async () => {
        const log: AuditLogInterface = { id: '1', userId: 'user123', action: 'test', logLevel: LogLevelEnum.INFO };
        await auditLogger.logEvent(log);
        expect(storage.logEvent).toHaveBeenCalledWith(log);
    });

    it('should handle errors when logging an event', async () => {
        const log: AuditLogInterface = { id: '1', userId: 'user123', action: 'test', logLevel: LogLevelEnum.INFO };
        storage.logEvent.mockRejectedValueOnce(new Error('Log error'));

        await auditLogger.logEvent(log);
        expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Failed to log event'));
    });

    it('should fetch logs based on filters', async () => {
        const logs = [{ id: '1', userId: 'user123', action: 'test', logLevel: LogLevelEnum.INFO }];
        storage.fetchLogs.mockResolvedValueOnce({ data: logs, total: 1, page: 1, limit: 10 });

        const result = await auditLogger.fetchLogs({ where: { userId: 'user123' } });
        expect(result).toEqual({ data: logs, total: 1, page: 1, limit: 10 });
    });

    it('should handle errors when fetching logs', async () => {
        storage.fetchLogs.mockRejectedValueOnce(new Error('Fetch error'));

        const result = await auditLogger.fetchLogs({ where: { userId: 'user123' } });
        expect(result).toEqual({ data: [], total: 0, page: 1, limit: 10 });
    });

    it('should fetch a single log successfully', async () => {
        const log = { id: '1', userId: 'user123', action: 'test', logLevel: LogLevelEnum.INFO };
        storage.fetchLog.mockResolvedValueOnce(log);

        const result = await auditLogger.fetchLog({});
        expect(result).toEqual(log);
    });

    it('should return null when the log is not found', async () => {
        storage.fetchLog.mockResolvedValueOnce(null);

        const result = await auditLogger.fetchLog({});
        expect(result).toBeNull();
    });

    it('should handle errors when fetching a single log', async () => {
        storage.fetchLog.mockRejectedValueOnce(new Error('Fetch single log error'));

        const result = await auditLogger.fetchLog({});
        expect(result).toBeNull();
    });

    it('should update a log successfully', async () => {
        const updates = { action: 'updatedAction' };
        await auditLogger.updateLog('1', updates);
        expect(storage.updateLog).toHaveBeenCalledWith('1', updates);
    });

    it('should handle errors when updating a log', async () => {
        const updates = { action: 'updatedAction' };
        storage.updateLog.mockRejectedValueOnce(new Error('Update error'));

        await auditLogger.updateLog('1', updates);
        expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Failed to update log'));
    });

    it('should delete a log successfully', async () => {
        await auditLogger.deleteLog('1');
        expect(storage.deleteLog).toHaveBeenCalledWith('1');
    });

    it('should handle errors when deleting a log', async () => {
        storage.deleteLog.mockRejectedValueOnce(new Error('Delete error'));

        await auditLogger.deleteLog('1');
        expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Failed to delete log'));
    });

    it('should count logs based on filter', async () => {
        storage.countLogs.mockResolvedValueOnce(5);

        const count = await auditLogger.countLogs({ userId: 'user123' });
        expect(count).toBe(5);
    });

    it('should handle errors when counting logs', async () => {
        storage.countLogs.mockRejectedValueOnce(new Error('Count error'));

        const count = await auditLogger.countLogs({ userId: 'user123' });
        expect(count).toBe(0);
    });

    it('should delete logs older than a specified date', async () => {
        const date = new Date('2023-01-01');
        await auditLogger.deleteLogsOlderThan(date);
        expect(storage.deleteLogsOlderThan).toHaveBeenCalledWith(date);
    });

    it('should handle errors when deleting logs older than a specified date', async () => {
        const date = new Date('2023-01-01');
        storage.deleteLogsOlderThan.mockRejectedValueOnce(new Error('Delete older logs error'));
        
        // Clear previous calls to console.error
        jest.clearAllMocks();
        
        await auditLogger.deleteLogsOlderThan(date);
    
        // Check if console.error was called with the expected message
        expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Failed to delete logs older than'));
    
        // Ensure that console.error was called exactly once during this test
        expect(console.error).toHaveBeenCalledTimes(1);
    });
    

});
