import { Sequelize } from 'sequelize';
import { FileStorage } from '../src/storage/FileStorage';
import { SequelizeStorage } from '../src/storage/SequelizeStorage';
import { LogViewer } from '../src/LogViewer';
import { LogLevel } from '../src/LogLevel';
import { AuditLog } from '../src/interfaces';
import { ConsoleLogger, Color } from '../src/ConsoleLogger';


const createMockConsoleLogger = (): ConsoleLogger => {
    const logger = new ConsoleLogger(true); // Assuming the constructor accepts an `isEnabled` parameter
    // Mocking methods
    colorize: jest.fn(), // Mock function
    logger.logEventToConsole = jest.fn();
    return logger;
};

describe('LogViewer', () => {
    let fileStorage: FileStorage;
    let sequelizeStorage: SequelizeStorage;
    let consoleLogger: ConsoleLogger;
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

    it('should fetch logs from both storages and log them to console', async () => {
        const mockLogs: AuditLog[] = [
            {
                id: 'unique-log-id1',
                userId: 'user1234',
                action: 'User Login',
                logLevel: LogLevel.INFO,
                metadata: { ipAddress: '192.168.1.1' },
            }
        ];
    
        // Mock fetchLogs for both storages
        jest.spyOn(fileStorage, 'fetchLogs').mockResolvedValue(mockLogs);
        jest.spyOn(sequelizeStorage, 'fetchLogs').mockResolvedValue(mockLogs);
    
        // Fetch logs for a specific userId
        const result = await logViewer.viewLogs({ userId: 'user1234' });
    
        // Expected logs should only include logs for user1234
        const expectedLogs = mockLogs.filter(log => log.userId === 'user1234');
    
        // Assert that the returned logs match the expected filtered logs
        expect(result).toEqual(expectedLogs);
    
        // Ensure consoleLogger logged each expected log
        expectedLogs.forEach(log => {
            expect(consoleLogger.logEventToConsole).toHaveBeenCalledWith(log);
        });
    });
    
    
    

    it('should return an empty array if no logs are found', async () => {
        jest.spyOn(fileStorage, 'fetchLogs').mockResolvedValue([]);
        jest.spyOn(sequelizeStorage, 'fetchLogs').mockResolvedValue([]);

        const result = await logViewer.viewLogs({ userId: 'nonExistentUser' });

        expect(result).toEqual([]);
        expect(consoleLogger.logEventToConsole).not.toHaveBeenCalled();
    });
});
