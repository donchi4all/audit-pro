import { Op, Sequelize } from 'sequelize';
import { SequelizeStorage } from '../src/storage/SequelizeStorage';
import { AuditLogInterface } from '../src/interfaces';
import { LogLevelEnum } from '../src/LogLevel';

const sequelize = new Sequelize('mysql://root:password@localhost:3306/audit', {
    logging: false, // Disable logging for cleaner test output
});

const tableName = 'AuditLog';
const dynamicColumns = {};

// Mock data
const mockLog: AuditLogInterface = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    userId: 'user-123',
    action: 'CREATE',
    logLevel: LogLevelEnum.INFO,
    metadata: { key: 'value' },
};

// Initialize storage instance
const storage = new SequelizeStorage(sequelize, tableName, dynamicColumns);

beforeAll(async () => {
    await sequelize.sync();
});

afterAll(async () => {
    await sequelize.close();
});

describe('SequelizeStorage', () => {

    describe('Model Initialization', () => {
        it('should define the model with the correct table name', () => {
            const model = storage.getModelInstance();
            expect(model.tableName).toBe(tableName);
        });
    });

    describe('logEvent', () => {
        it('should create an event log successfully', async () => {
            const modelCreateSpy = jest.spyOn(storage.getModelInstance(), 'create').mockResolvedValue(mockLog as any);
            await storage.logEvent(mockLog);
            expect(modelCreateSpy).toHaveBeenCalledWith(mockLog);
        });
    });

    describe('fetchLog', () => {
        it('should fetch a log by ID', async () => {
            const modelFindOneSpy = jest.spyOn(storage.getModelInstance(), 'findOne').mockResolvedValue({ get: () => mockLog } as any);
            const result = await storage.fetchLog({ where: { id: mockLog.id }, include: [] });
            expect(modelFindOneSpy).toHaveBeenCalledWith({ where: { id: mockLog.id }, include: [] });
            expect(result).toEqual(mockLog);
        });
    });

    describe('updateLog', () => {
        it('should update a log by ID', async () => {
            const updates = { action: 'UPDATE' };
            const modelUpdateSpy = jest.spyOn(storage.getModelInstance(), 'update').mockResolvedValue([1]);
            await storage.updateLog(mockLog.id!, updates);
            expect(modelUpdateSpy).toHaveBeenCalledWith(updates, { where: { id: mockLog.id } });
        });
    });

    describe('deleteLog', () => {
        it('should delete a log by ID', async () => {
            const modelDestroySpy = jest.spyOn(storage.getModelInstance(), 'destroy').mockResolvedValue(1);
            await storage.deleteLog(mockLog.id!);
            expect(modelDestroySpy).toHaveBeenCalledWith({ where: { id: mockLog.id } });
        });
    });

    describe('countLogs', () => {
        it('should count logs matching filter', async () => {
            const modelCountSpy = jest.spyOn(storage.getModelInstance(), 'count').mockResolvedValue(5);
            const filter = { logLevel: LogLevelEnum.INFO };
            const count = await storage.countLogs(filter);
            expect(modelCountSpy).toHaveBeenCalledWith({ where: filter });
            expect(count).toBe(5);
        });
    });

    describe('deleteLogsOlderThan', () => {
        it('should delete logs older than a specified date', async () => {
            const date = new Date(new Date().setMonth(new Date().getMonth() - 3));
            const modelDestroySpy = jest.spyOn(storage.getModelInstance(), 'destroy').mockResolvedValue(1);
            await storage.deleteLogsOlderThan(date);
            expect(modelDestroySpy).toHaveBeenCalledWith({ where: { createdAt: { [Op.lt]: date } } });
        });
    });

    describe('fetchLogs with pagination', () => {
        it('should fetch paginated logs', async () => {
            const mockData = Array(10).fill(mockLog);
            const modelFindAndCountAllSpy = jest.spyOn(storage.getModelInstance(), 'findAndCountAll').mockResolvedValue({
                rows: mockData,
                count: 10,
            } as any);
            const result = await storage.fetchLogs({ where: {}, include: [], page: 1, limit: 5 });
            expect(modelFindAndCountAllSpy).toHaveBeenCalledWith({
                where: {},
                include: [],
                order: [],
                offset: 0,
                limit: 5,
                raw: false, // Add raw: false to match the actual call
            });
            expect(result.data.length).toBe(10);
            expect(result.total).toBe(10);
            expect(result.page).toBe(1);
            expect(result.limit).toBe(5);
        });
    });

    describe('findAll with ordering and associations', () => {
        it('should fetch all logs with associations and order', async () => {
            const mockData = [mockLog];
            const modelFindAndCountAllSpy = jest.spyOn(storage.getModelInstance(), 'findAndCountAll').mockResolvedValue({
                rows: mockData,
                count: 1,
            } as any);
            const result = await storage.findAll({ where: {}, include: [{ association: 'user' }], order: [['createdAt', 'asc']], page: 1, limit: 5 });
            expect(modelFindAndCountAllSpy).toHaveBeenCalledWith({
                where: {},
                include: [{ association: 'user', required: false, attributes: undefined }], // Add required and attributes for matching
                order: [['createdAt', 'asc']],
                offset: 0,
                limit: 5,
                raw: false // Ensure raw: false is in the expected call
            });

            expect(result.data).toEqual(mockData);
            expect(result.total).toBe(1);
        });
    });
});
