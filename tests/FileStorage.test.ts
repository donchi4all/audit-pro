import { FileStorage } from '../src/storage/FileStorage'; // Adjust the path as necessary
import { LogLevelEnum } from '../src/LogLevel';
import { AuditLogInterface } from '../src/interfaces';
import { promises as fs } from 'fs';

// Mock the entire fs module
jest.mock('fs', () => ({
    promises: {
        readFile: jest.fn(),
        writeFile: jest.fn(),
    },
}));

describe('FileStorage', () => {
    const filePath = 'testLogs.json';
    const dynamicColumns = { additionalInfo: 'test' };
    let fileStorage: FileStorage;

    beforeEach(() => {
        fileStorage = new FileStorage(filePath, dynamicColumns);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });


  test('should log an event', async () => {
        const event: AuditLogInterface = {
            id: '1',
            userId: 'user1',
            action: 'CREATE',
            logLevel:LogLevelEnum.INFO,
            metadata: {},
            createdAt: new Date().toISOString(),
        };

        (fs.readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify([]));
        (fs.writeFile as jest.Mock).mockResolvedValueOnce(undefined);

        await fileStorage.logEvent(event);

        expect(fs.writeFile).toHaveBeenCalledWith(filePath, JSON.stringify([{
            ...event,
            ...dynamicColumns,
        }], null, 2));
    });


    test('should fetch logs', async () => {
        const logs: AuditLogInterface[] = [
            {
                id: '1',
                userId: 'user1',
                action: 'CREATE',
                logLevel: LogLevelEnum.INFO,
                metadata: {},
                createdAt: new Date().toISOString(),
            },
            {
                id: '2',
                userId: 'user2',
                action: 'DELETE',
                logLevel: LogLevelEnum.WARN,
                metadata: {},
                createdAt: new Date().toISOString(),
            },
        ];

        (fs.readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(logs));

        const result = await fileStorage.fetchLogs({ where: { userId: 'user1' }, page: 1, limit: 10 });

        expect(result).toEqual({
            data: [logs[0]],
            total: 1,
            page: 1,
            limit: 10,
        });
    });

    test('should update a log', async () => {
        const logs: AuditLogInterface[] = [
            {
                id: '1',
                userId: 'user1',
                action: 'CREATE',
                logLevel: LogLevelEnum.INFO,
                metadata: {},
                createdAt: new Date().toISOString(),
            },
        ];

        (fs.readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(logs));
        (fs.writeFile as jest.Mock).mockResolvedValueOnce(undefined);

        const updates = { action: 'UPDATE' };

        await fileStorage.updateLog('1', updates);

        expect(fs.writeFile).toHaveBeenCalledWith(filePath, JSON.stringify([{
            ...logs[0],
            ...updates,
            ...dynamicColumns,
        }], null, 2));
    });

    test('should delete a log', async () => {
        const logs: AuditLogInterface[] = [
            {
                id: '1',
                userId: 'user1',
                action: 'CREATE',
                logLevel: LogLevelEnum.INFO,
                metadata: {},
                createdAt: new Date().toISOString(),
            },
            {
                id: '2',
                userId: 'user2',
                action: 'DELETE',
                logLevel: LogLevelEnum.WARN,
                metadata: {},
                createdAt: new Date().toISOString(),
            },
        ];

        (fs.readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(logs));
        (fs.writeFile as jest.Mock).mockResolvedValueOnce(undefined);

        await fileStorage.deleteLog('1');

        expect(fs.writeFile).toHaveBeenCalledWith(filePath, JSON.stringify([logs[1]], null, 2));
    });
});
