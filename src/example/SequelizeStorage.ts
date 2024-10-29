import { DataTypes, Model, ModelAttributes, Sequelize } from 'sequelize';
import { AuditLogInterface } from '../interfaces';
import { SequelizeStorage } from '../storage/SequelizeStorage';
import { LogLevel } from '../LogLevel';

const isDevelopment = process.env.NODE_ENV === 'development';
// Initialize Sequelize
const sequelize = new Sequelize('mysql://root:password@localhost:3306/audit', {
    logging: isDevelopment ? console.log : false,
});

// Define dynamic columns (if any)
const dynamicColumns: Partial<ModelAttributes<Model<AuditLogInterface>, AuditLogInterface>> = {
    additionalInfo: {
        type: DataTypes.STRING,
        allowNull: true,
    },
};

// Create the storage instance with the necessary table name and dynamic columns
const storage = new SequelizeStorage(sequelize, 'AuditLogs', dynamicColumns);

// Example of logging an event
const logEvent: AuditLogInterface = {
    id: 'unique-log-id',
    userId: 'user123',
    action: 'User Login',
    logLevel: LogLevel.INFO,
    timestamp: new Date(),
    metadata: { ipAddress: '192.168.1.1' },
    additionalInfo: 'extra information'
};

// Main function to demonstrate the various operations
async function runStorageOperations() {
    try {
        // Log an event
        await storage.logEvent(logEvent);
        console.log('Log event saved.');

        // Fetch logs for a specific user
        const logs = await storage.fetchLogs({ userId: 'user123' });
        console.log('Fetched logs:', logs);

        // Fetch all logs
        const allLogs = await storage.fetchAllLogs();
        console.log('All logs:', allLogs);

        // Update a log (example: change the action)
        const updatedLog = await storage.updateLog(
            'unique-log-id', // filter to find the log
            { action: 'Updated User Action' } // fields to update
        );
        console.log('Updated log:', updatedLog);

        // Delete a log
        // const deleteResult = await storage.deleteLog('unique-log-id');
        // console.log('Deleted log result:', deleteResult);

        // Count logs for a specific user
        const logCount = await storage.countLogs({ userId: 'user123' });
        console.log(`Total logs for user123: ${logCount}`);

        const findAllLogs: AuditLogInterface[] = await storage.findAll({
            where: { userId: 'user123', logLevel: LogLevel.INFO }, // Filter criteria
            include: [
                { association: 'user', required: true }, // Fetch associated User
            ],
            order: [['timestamp', 'desc']]                // Sort by timestamp in descending order
        });

        console.log('findAllLogs', findAllLogs);
    } catch (error) {
        console.error('Error performing storage operations:', error);
    }
}

runStorageOperations();
