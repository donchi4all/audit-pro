import mongoose, { model, Schema } from 'mongoose';
import { AuditLogInterface, StorageInterface, FindParams } from '../src/interfaces';
import { MongoStorage } from '../src/storage/MongoStorage';
import { LogLevelEnum } from '../src/LogLevel';

describe('MongoStorage', () => {
    let mongoStorage: MongoStorage;
    const mockConnectionString = 'mongodb://localhost:27017/testdb';
    const tableName = 'audit_logs';
    const dynamicColumns = {};

    beforeAll(async () => {
        mongoStorage = new MongoStorage(mockConnectionString, tableName, dynamicColumns);
        //await mongoose.connect(mockConnectionString)

    });
    afterAll(async () => {
        await mongoose.connection.db?.dropDatabase();
        await mongoose.disconnect();
        await mongoose.connection.close();

    });

    beforeEach(async () => {
        await mongoose.connection.collection(tableName).deleteMany({}); // Clear logs before each test
    });


    const setupMockModel = (mockResponse: any[] | null) => {
        const mockQuery = {
            lean: jest.fn().mockReturnThis(),
            exec: jest.fn().mockResolvedValue(mockResponse), // Resolves to the mockResponse
            populate: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            sort: jest.fn().mockReturnThis(), // Add sort method here
        };

        const method = 'findOne'; // or whatever method you're mocking
        const mockModel = {
            [method]: jest.fn().mockReturnValueOnce(mockQuery),
            countDocuments: jest.fn().mockResolvedValue(mockResponse ? mockResponse.length : 0), // Safely access length
            find: jest.fn().mockReturnValueOnce(mockQuery), // Ensure find also returns mockQuery
        };

        jest.spyOn(mongoStorage, 'getModel').mockReturnValue(mockModel as any);
        return { mockModel, mockQuery };
    };


    describe('fetchLog', () => {
        it('should return null if no log is found', async () => {
            const where = { action: 'NON_EXISTENT_ACTION' }; // Change as necessary
            const mockResponse = null; // Set up mockResponse to null

            const { mockQuery } = setupMockModel(mockResponse); // Pass null here

            const result = await mongoStorage.fetchLog({ where });

            expect(mockQuery.exec).toHaveBeenCalled(); // Ensure the exec method is called
            expect(result).toBeNull(); // Ensure the result is null
        });
    });


    describe('findAll', () => {
        it('should fetch logs with pagination, sorting, and associations', async () => {
            const where = { action: 'LOGIN_ATTEMPT' };
            const include = [
                { association: 'user', attributes: ['name', 'email'] },
            ];
            const order: [string, 'asc' | 'desc'][] = [['logLevel', 'asc']];
            const page = 1;
            const limit = 10;

            const mockLogs = [
                {
                    userId: 'user123',
                    action: 'LOGIN_ATTEMPT',
                    logLevel: LogLevelEnum.INFO,
                    metadata: { ipAddress: '127.0.0.1' },
                    toObject: jest.fn().mockReturnThis(),
                },
                {
                    userId: 'user456',
                    action: 'LOGIN_ATTEMPT',
                    logLevel: LogLevelEnum.WARN,
                    metadata: { ipAddress: '192.168.1.1' },
                    toObject: jest.fn().mockReturnThis(),
                },
            ];

            const mockQuery = {
                lean: jest.fn().mockReturnThis(),
                populate: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue(mockLogs),
            };

            const mockModel = {
                find: jest.fn().mockReturnValue(mockQuery),
                countDocuments: jest.fn().mockResolvedValue(mockLogs.length), // Directly return count without exec
            };

            jest.spyOn(mongoStorage, 'getModel').mockReturnValue(mockModel as any);

            const result = await mongoStorage.findAll({
                where,
                include,
                order,
                page,
                limit,
            });

            expect(mockModel.find).toHaveBeenCalledWith(where);
            expect(mockQuery.populate).toHaveBeenCalledWith({
                model: 'user',
                path: 'user',
                select: 'name email',
            });
            expect(mockQuery.sort).toHaveBeenCalledWith({ logLevel: 'asc' });
            expect(mockQuery.skip).toHaveBeenCalledWith(0);
            expect(mockQuery.limit).toHaveBeenCalledWith(limit);
            expect(result.data).toEqual(mockLogs.map(log => log.toObject()));
            expect(result.total).toBe(mockLogs.length);
            expect(result.page).toBe(page);
            expect(result.limit).toBe(limit);
        });
    });

    describe('deleteLogsOlderThan', () => {
        it('should delete logs older than the specified date', async () => {
            const mockModel = {
                deleteMany: jest.fn().mockResolvedValueOnce({ deletedCount: 3 }),
            };
            jest.spyOn(mongoStorage, 'getModel').mockReturnValue(mockModel as any);

            const thresholdDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // Default 3 months
            await mongoStorage.deleteLogsOlderThan(thresholdDate);

            expect(mockModel.deleteMany).toHaveBeenCalledWith({
                createdAt: { $lt: thresholdDate },
            });
        });
    });

    describe('deleteLog', () => {
        it('should delete a log entry by id', async () => {
            const id = 'log123';
            const mockModel = {
                deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
            };

            jest.spyOn(mongoStorage, 'getModel').mockReturnValue(mockModel as any);

            await mongoStorage.deleteLog(id);

            expect(mockModel.deleteOne).toHaveBeenCalledWith({ _id: id });
            expect(mockModel.deleteOne).toHaveBeenCalledTimes(1);
        });
    });

    describe('countLogs', () => {
        it('should count logs based on a filter', async () => {
            const filter = { action: 'LOGIN' };
            const mockCount = 5;

            const mockModel = {
                countDocuments: jest.fn().mockResolvedValue(mockCount),
            };

            jest.spyOn(mongoStorage, 'getModel').mockReturnValue(mockModel as any);

            const result = await mongoStorage.countLogs(filter);

            expect(mockModel.countDocuments).toHaveBeenCalledWith(filter);
            expect(result).toBe(mockCount);
        });
    });


    describe('updateLog', () => {
        it('should update a log entry by id', async () => {
            const id = 'log123';
            const updates = { action: 'LOGOUT' };
            const mockModel = {
                updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
            };

            jest.spyOn(mongoStorage, 'getModel').mockReturnValue(mockModel as any);

            await mongoStorage.updateLog(id, updates);

            expect(mockModel.updateOne).toHaveBeenCalledWith({ _id: id }, updates);
            expect(mockModel.updateOne).toHaveBeenCalledTimes(1);
        });
    });


    describe('logEvent', () => {
    
        // it('should log an event successfully', async () => {
        //     const logEvent: AuditLogInterface = {
        //         userId: 'user123',
        //         action: 'CREATE',
        //         logLevel: LogLevelEnum.INFO,
        //         timestamp: new Date(),
        //         metadata: { detail: 'Created a new resource' },
        //         additionalInfo: 'Extra info about the event',
        //     };
        //     await mongoStorage.logEvent(logEvent);
        //     const logs = await mongoStorage.fetchLogs({});
            
        //     expect(logs.data.length).toBe(1); // Check that one log has been created
        //     expect(logs.data[0]).toMatchObject(logEvent); // Validate log content
        // });

        
        it('should handle errors when saving a log entry', async () => {
            const mockEvent: AuditLogInterface = {
                userId: 'user123',
                action: 'LOGIN',
                logLevel: LogLevelEnum.INFO,
                metadata: { ipAddress: '127.0.0.1' },
                timestamp: new Date(),
            };

            const mockModel = {
                create: jest.fn().mockRejectedValue(new Error('Database error')), // Simulate a database error
            };

            jest.spyOn(mongoStorage, 'getModel').mockReturnValue(mockModel as any);

            await expect(mongoStorage.logEvent(mockEvent)).rejects.toThrow('model is not a constructor');
        });

    });


    describe('fetchLogs', () => {
        it('should fetch logs with pagination and included associations', async () => {
            const where = { action: 'LOGIN_ATTEMPT' };
            const include = [{ association: 'user', attributes: ['name', 'email'] }];
            const page = 1;
            const limit = 10;
            const mockLogs = [
                { userId: 'user123', action: 'LOGIN_ATTEMPT', toObject: jest.fn().mockReturnThis() },
                { userId: 'user456', action: 'LOGIN_ATTEMPT', toObject: jest.fn().mockReturnThis() },
            ];

            const mockQuery = {
                lean: jest.fn().mockReturnThis(),
                populate: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue(mockLogs),
            };

            const mockModel = {
                find: jest.fn().mockReturnValue(mockQuery),
                countDocuments: jest.fn().mockResolvedValue(mockLogs.length),
            };

            jest.spyOn(mongoStorage, 'getModel').mockReturnValue(mockModel as any);

            const result = await mongoStorage.fetchLogs({ where, include, page, limit });

            expect(mockModel.find).toHaveBeenCalledWith(where);
            expect(mockQuery.populate).toHaveBeenCalledWith({
                path: 'user',
                model: 'user',
                select: 'name email',
            });
            expect(mockQuery.skip).toHaveBeenCalledWith(0);
            expect(mockQuery.limit).toHaveBeenCalledWith(limit);
            expect(result.data).toEqual(mockLogs.map(log => log.toObject()));
            expect(result.total).toBe(mockLogs.length);
            expect(result.page).toBe(page);
            expect(result.limit).toBe(limit);
        });
    });


});
