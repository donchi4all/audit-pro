import { AuditLog } from "../interfaces";
import { LogLevel } from "../LogLevel";
import { FileStorage } from "../storage/FileStorage";

const dynamicColumns = {
    additionalInfo: 'Some dynamic info',
};

const fileStorage = new FileStorage('logs.json', dynamicColumns);

// Logging an event
const logEvent: AuditLog = {
    id: 'unique-log-id3',
    userId: 'user1234',
    action: 'User Login',
    logLevel: LogLevel.INFO,
    timestamp: new Date(),
    metadata: { ipAddress: '192.168.1.1' },
};

fileStorage.logEvent(logEvent).then(() => {
    console.log('Log event saved.');
});

// Fetch logs
fileStorage.fetchLogs({ userId: 'user1234' }).then((logs) => {
    console.log('Fetched logs:', logs);
});

fileStorage.fetchAllLogs().then((logs) => {
    console.log('All logs:', logs);
});

fileStorage.updateLog('unique-log-id', {
    action: 'User Logout',
}).then(() => {
    console.log('Log updated.');
});

  fileStorage.deleteLog('unique-log').then(() => {
    console.log('Log deleted.');
  });

// Count logs based on the filter
fileStorage.countLogs({ userId: 'user1234' }).then((count) => {
    console.log(`Total logs for user123: ${count}`);
}).catch((error) => {
    console.error('Error counting logs:', error);
});