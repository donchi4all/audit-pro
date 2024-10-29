import { ConsoleLogger } from './ConsoleLogger';
import { AuditLogInterface, StorageInterface } from './interfaces';

export class LogViewer {
    private storages: StorageInterface[]; // Storages may have tableName property
    private consoleLogger: ConsoleLogger;

    constructor(storages: StorageInterface[], consoleLogger: ConsoleLogger) {
        this.storages = storages;
        this.consoleLogger = consoleLogger;
    }

    public async viewLogs(filter: any): Promise<AuditLogInterface[]> {
        let allLogs: AuditLogInterface[] = [];

        for (const storage of this.storages) {
            const logs = await storage.fetchLogs(filter);

            allLogs = [...allLogs, ...logs];
        }

        // De-duplicate logs based on `id` or any unique field
        const uniqueLogs = allLogs.filter((log, index, self) =>
            index === self.findIndex((l) => l.id === log.id && l.timestamp === log.timestamp)
        );

        // Optionally log to console
        uniqueLogs.forEach((log) => this.consoleLogger.logEventToConsole(log));

        return uniqueLogs;
    }


}

