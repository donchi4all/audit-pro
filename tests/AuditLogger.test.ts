import { AuditLogger } from '../src/AuditLogger';
import { ConsoleLogger } from '../src/ConsoleLogger';
import { StorageInterface, AuditLogInterface } from '../src/interfaces';
import { LogLevel } from '../src/LogLevel';

const mockStorage: jest.Mocked<StorageInterface> = {
    logEvent: jest.fn(),
    fetchLogs: jest.fn(),
    fetchLog: jest.fn(),
    updateLog: jest.fn(),
    deleteLog: jest.fn(),
    countLogs: jest.fn(),
    getTableName: jest.fn(),
    findAll: jest.fn(),
};

// Mocking ConsoleLogger without the columns properties
const createMockConsoleLogger = (): jest.Mocked<ConsoleLogger> => {
    return {
        getIsEnabled: jest.fn().mockReturnValue(true), // Default to enabled
        logEventToConsole: jest.fn(),
        isEnabled: true,
        colorize: jest.fn(), // Mock colorize method
    } as unknown as jest.Mocked<ConsoleLogger>;
};

describe('AuditLogger', () => {
    let auditLogger: AuditLogger;
    let mockConsoleLogger: jest.Mocked<ConsoleLogger>;

    const testLog: AuditLogInterface = {
        id: 'unique-log-id',
        userId: 'user123',
        action: 'User Login',
        logLevel: LogLevel.INFO,
        timestamp: new Date(),
        metadata: { ipAddress: '192.168.1.1' },
    };

    beforeEach(() => {
        mockConsoleLogger = createMockConsoleLogger();
        auditLogger = new AuditLogger(mockStorage, mockConsoleLogger);
    });

    afterEach(async () => {
        // Cleanup: Delete any logs created during the tests
        if (testLog.id) await mockStorage.deleteLog(testLog.id); // Delete the specific log created
        jest.clearAllMocks(); // Clear all mocks after each test
    });

    test('should log an event to storage and console', async () => {
        mockConsoleLogger.getIsEnabled.mockReturnValue(true); // Console logging enabled

        await auditLogger.logEvent(testLog);

        expect(mockStorage.logEvent).toHaveBeenCalledWith(testLog);
        expect(mockConsoleLogger.logEventToConsole).toHaveBeenCalledWith(testLog);
    });

    test('should log an event to storage only when console logging is disabled', async () => {
        mockConsoleLogger.getIsEnabled.mockReturnValue(false); // Console logging disabled

        await auditLogger.logEvent(testLog);

        expect(mockStorage.logEvent).toHaveBeenCalledWith(testLog);
        expect(mockConsoleLogger.logEventToConsole).not.toHaveBeenCalled();
    });

    test('should fetch logs from storage with a filter', async () => {
        const mockLogs: AuditLogInterface[] = [testLog];
        mockStorage.fetchLogs.mockResolvedValue(mockLogs);

        const logs = await auditLogger.fetchLogs({ userId: 'user123' });

        expect(mockStorage.fetchLogs).toHaveBeenCalledWith({ userId: 'user123' });
        expect(logs).toEqual(mockLogs);
    });

    test('should update a log in storage', async () => {
        const updates = { action: 'Updated Action' };

        await auditLogger.updateLog('unique-log-id', updates);

        expect(mockStorage.updateLog).toHaveBeenCalledWith('unique-log-id', updates);
    });

    test('should delete a log in storage', async () => {
        await auditLogger.deleteLog('unique-log-id');

        expect(mockStorage.deleteLog).toHaveBeenCalledWith('unique-log-id');
    });

    test('should count logs in storage based on filter', async () => {
        mockStorage.countLogs.mockResolvedValue(10);

        const count = await auditLogger.countLogs({ userId: 'user123' });

        expect(mockStorage.countLogs).toHaveBeenCalledWith({ userId: 'user123' });
        expect(count).toBe(10);
    });

    test('should handle errors when logging an event', async () => {
        mockStorage.logEvent.mockRejectedValue('Failed to log event: Failed to log event: Error: Storage error');

        await auditLogger.logEvent(testLog);

        expect(mockStorage.logEvent).toHaveBeenCalledWith(testLog);
    });
});
