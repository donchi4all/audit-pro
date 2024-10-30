import mongoose from "mongoose";
import { AuditLogInterface } from "../interfaces";
import { LogLevelEnum } from "../LogLevel";
import { MongoStorage } from "../storage/MongoStorage";


const mongoConnectionString = 'mongodb://localhost:27017/auditLogs';
const tableName = 'AuditLogs';

const dynamicColumns = {
    createdAt: { type: Date, default: Date.now },
};

const mongoStorage = new MongoStorage(mongoConnectionString, tableName, dynamicColumns);

const runExample = async () => {
    try {
        // 1. Log an event
        const newLog: AuditLogInterface = {
            userId: 'user1234',
            action: 'User Login',
            logLevel: LogLevelEnum.INFO,
            metadata: { ipAddress: '192.168.1.1' },
        };

        await mongoStorage.logEvent(newLog);
        console.log('Log event created successfully.');

        // 2. Fetch logs with pagination
        const { data: logs, total, page, limit } = await mongoStorage.fetchLogs({
            where: { userId: 'user1234' },
            page: 1,
            limit: 5,
        });

        console.log(`Total logs: ${total}, Page: ${page}, Limit: ${limit}`);
        console.log('Fetched logs:', logs);

        // 3. Update a log (assume the first log's ID is available)
        if (logs.length > 0) {
            const logId = logs[0].id; // Get the ID of the first log
            await mongoStorage.updateLog(logId!, { action: 'User Logout' });
            console.log(`Log with ID ${logId} updated successfully.`);
        }

        // 4. Fetch the updated log
        const updatedLog = await mongoStorage.fetchLog({ where: { _id: logs[0]._id } });
        console.log('Updated log:', updatedLog);

        // 5. Delete a log (again using the first log's ID)
        if (logs.length > 0) {
            const logId = logs[0].id; // Get the ID of the first log
            await mongoStorage.deleteLog(logId!);
            console.log(`Log with ID ${logId} deleted successfully.`);
        }

        // 6. Fetch logs after deletion to verify
        const logsAfterDeletion = await mongoStorage.fetchLogs({ where: { userId: 'user1234' } });
        console.log('Logs after deletion:', logsAfterDeletion.data);

    } catch (error) {
        console.error('Error occurred:', error);
    } finally {
        // Close the Mongoose connection
        await mongoose.connection.close();
        console.log('MongoDB connection closed.');
    }
};

runExample();