import { ConsoleLogger } from "../ConsoleLogger";
import { AuditLogInterface } from "../interfaces";
import { LogLevelEnum } from "../LogLevel";
import { LogViewer } from "../LogViewer";
import { FileStorage } from "../storage/FileStorage";

// app.ts
import { promises as fs } from 'fs';

// Path to the log file
const logFilePath = 'logs.json';

const main = async () => {
    const consoleLogger = new ConsoleLogger(true);
    const fileStorage = new FileStorage(logFilePath, { createdAt: new Date().toISOString() });

    const logViewer = new LogViewer([fileStorage], consoleLogger);

    // Log some events
    const log1: AuditLogInterface = {
        id: '1',
        userId: 'user1234',
        action: 'User Login',
        logLevel: LogLevelEnum.INFO,
        metadata: { ipAddress: '192.168.1.1' },
    };

    const log2: AuditLogInterface = {
        id: '2',
        userId: 'user1234',
        action: 'User Logout',
        logLevel: LogLevelEnum.INFO,
        metadata: { ipAddress: '192.168.1.1' },
    };

    const log3: AuditLogInterface = {
        id: '3',
        userId: 'user5678',
        action: 'User Login',
        logLevel: LogLevelEnum.INFO,
        metadata: { ipAddress: '192.168.1.2' },
    };

    await fileStorage.logEvent(log1);
    await fileStorage.logEvent(log2);
    await fileStorage.logEvent(log3);

    // View logs 
    const logsForUser1234 = await logViewer.viewLogs({});
    console.log('Filtered Logs for user1234:', logsForUser1234);

    // View logs for user5678
    const logsForUser5678 = await logViewer.viewLogs({ where: { userId: 'user5678' } });
    console.log('Filtered Logs for user5678:', logsForUser5678);
};

// Clean up: Remove the log file after running the example
const cleanup = async () => {
    try {
       // await fs.unlink(logFilePath);
        console.log('Log file removed.');
    } catch (err) {
        console.error('Error removing log file:', err);
    }
};

main().catch(console.error).finally(cleanup);
