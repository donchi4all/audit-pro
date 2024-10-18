import { Sequelize } from "sequelize";
import { FileStorage } from "../storage/FileStorage";
import { SequelizeStorage } from "../storage/SequelizeStorage";
import { MongoStorage } from "../storage/MongoStorage";
import { ConsoleLogger } from "../ConsoleLogger";
import { AuditLogger } from "../AuditLogger";
import { LogLevel } from "../LogLevel";

// Initialize a single storage (choose one based on your needs)
const fileStorage = new FileStorage('./logs.json', {});
const sequelizeStorage = new SequelizeStorage(new Sequelize('mysql://root:password@localhost:3306/audit'), 'AuditLogs', {});
const mongoStorage = new MongoStorage('mongodb://localhost:27017/audit', 'AuditLogs', {});

// Enable console logging
const consoleLogger = new ConsoleLogger(true);

// Initialize AuditLogger with one storage (e.g., fileStorage)
const auditLogger = new AuditLogger(sequelizeStorage, consoleLogger);

// Example of logging an event
auditLogger.logEvent({
    id: 'unique-log-id',
    userId: 'user123',
    action: 'User Login',
    logLevel: LogLevel.INFO,
    timestamp: new Date(),
    metadata: { ipAddress: '192.168.1.1' }
}).then(() => {
    console.log('Event logged successfully');
});

// Fetch logs
auditLogger.fetchLogs({ userId: 'user123' }).then(logs => {
    console.log('Fetched logs:', logs);
});
