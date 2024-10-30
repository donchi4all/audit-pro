import { Sequelize } from 'sequelize';
import { FileStorage } from '../src/storage/FileStorage';
import { SequelizeStorage } from '../src/storage/SequelizeStorage';
import { LogViewer } from '../src/LogViewer';
import { LogLevelEnum } from '../src/LogLevel';
import { AuditLogInterface } from '../src/interfaces';
import { ConsoleLogger } from '../src/ConsoleLogger';

// Create a mock ConsoleLogger
const createMockConsoleLogger = (): jest.Mocked<ConsoleLogger> => {
    const logger = new ConsoleLogger(true);
    return {
        ...logger,
        logEventToConsole: jest.fn(),
        getIsEnabled: jest.fn().mockReturnValue(true),
    } as unknown as jest.Mocked<ConsoleLogger>;
};

describe('LogViewer', () => {
    let fileStorage: FileStorage;
    let sequelizeStorage: SequelizeStorage;
    let consoleLogger: jest.Mocked<ConsoleLogger>;
    let logViewer: LogViewer;

    beforeAll(() => {
        const sequelizeInstance = new Sequelize('mysql://root:password@localhost:3306/audit', {
            logging: false,
        });

        fileStorage = new FileStorage('./logs.json', {});
        sequelizeStorage = new SequelizeStorage(sequelizeInstance, 'AuditLogs', {});
        consoleLogger = createMockConsoleLogger();
        logViewer = new LogViewer([fileStorage, sequelizeStorage], consoleLogger);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should fetch and log unique logs from both storages based on filter', async () => {
        const mockLogs: AuditLogInterface[] = [
            {
                id: 'unique-log-id1',
                userId: 'user1234',
                action: 'User Login',
                logLevel: LogLevelEnum.INFO,
                timestamp: new Date(),
                metadata: { ipAddress: '192.168.1.1' },
            },
            {
                id: 'unique-log-id2',
                userId: 'user1234',
                action: 'User Logout',
                logLevel: LogLevelEnum.INFO,
                timestamp: new Date(),
                metadata: { ipAddress: '192.168.1.1' },
            },
            {
                id: 'unique-log-id1', // Duplicate log
                userId: 'user5678',
                action: 'User Login',
                logLevel: LogLevelEnum.INFO,
                timestamp: new Date(),
                metadata: { ipAddress: '192.168.1.1' },
            }
        ];

        // Mock fetchLogs for both storages
        const mockFetchResult = {
            data: mockLogs,
            total: mockLogs.length,
            page: 1,
            limit: 10,
        };
        jest.spyOn(fileStorage, 'fetchLogs').mockResolvedValue(mockFetchResult);
        jest.spyOn(sequelizeStorage, 'fetchLogs').mockResolvedValue(mockFetchResult);

        const result = await logViewer.viewLogs({ userId: 'user1234' });

        const expectedLogs = mockLogs.filter(log => log.userId === 'user1234');

        expect(result).toEqual(expectedLogs);
        expectedLogs.forEach(log => {
            expect(consoleLogger.logEventToConsole).toHaveBeenCalledWith(log);
        });
    });

    it('should return an empty array if no logs match the filter', async () => {

        const emptyFetchResult = {
            data: [],
            total: 0,
            page: 1,
            limit: 10,
        };

        jest.spyOn(fileStorage, 'fetchLogs').mockResolvedValue(emptyFetchResult);
        jest.spyOn(sequelizeStorage, 'fetchLogs').mockResolvedValue(emptyFetchResult);

        const result = await logViewer.viewLogs({ userId: 'nonExistentUser' });

        expect(result).toEqual([]);
        expect(consoleLogger.logEventToConsole).not.toHaveBeenCalled();
    });
});
