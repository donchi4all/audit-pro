import { Sequelize } from "sequelize";
import { FileStorage } from "../storage/FileStorage";
import { SequelizeStorage } from "../storage/SequelizeStorage";
import { MongoStorage } from "../storage/MongoStorage";
import { ConsoleLogger } from "../ConsoleLogger";
import { AuditLogger } from "../AuditLogger";
import { LogLevelEnum } from "../LogLevel";
import { AuditLogInterface } from "../interfaces";

// Define a union type for storage options
type StorageType = 'file' | 'sequelize' | 'mongo';

// Set the desired storage type
const storageType: StorageType = 'sequelize'; // Change to 'file', 'sequelize', or 'mongo' as needed

let storage;
if (storageType === 'sequelize') {
    const sequelize = new Sequelize('mysql://root:password@localhost:3306/audit');
    storage = new SequelizeStorage(sequelize, 'AuditLogs', {});
}
else if (storageType === "file") {
    storage = new FileStorage('./logs.json', {});

} else if (storageType === 'mongo') {
    storage = new MongoStorage('mongodb://localhost:27017/audit', 'AuditLogs', {});
} else {
    throw new Error('Invalid storage type specified.');
}

// Enable console logging
const consoleLogger = new ConsoleLogger(true);

// Initialize AuditLogger with the selected storage
const auditLogger = new AuditLogger(storage, consoleLogger);

// Example of logging an event
const logEvent = async () => {
    const log: AuditLogInterface = {
        id: 'unique-log-id',
        userId: 'user123',
        action: 'User Login',
        logLevel: LogLevelEnum.INFO,
        timestamp: new Date(),
        metadata: { ipAddress: '192.168.1.1' },
    };

    try {
        await auditLogger.logEvent(log);
        console.log('Event logged successfully');
    } catch (error) {
        console.error('Error logging event:', error);
    }
};

// Fetch logs
const fetchLogs = async () => {
    try {
        const logs = await auditLogger.fetchLogs({ where: { userId: 'user123' }, page: 1, limit: 10 });
        console.log('Fetched logs:', logs);
    } catch (error) {
        console.error('Error fetching logs:', error);
    }
};

// Main function to run the example
const main = async () => {
    await logEvent();  // Log the event
    await fetchLogs(); // Fetch the logs
};

// Execute the main function
main().catch(console.error);
