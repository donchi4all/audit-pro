import { ConsoleLogger } from './ConsoleLogger';
import { AuditLogInterface, StorageInterface } from './interfaces';

export class LogViewer {
    private storages: StorageInterface[];
    private consoleLogger: ConsoleLogger;

    constructor(storages: StorageInterface[], consoleLogger: ConsoleLogger) {
        this.storages = storages;
        this.consoleLogger = consoleLogger;
    }

    public async viewLogs(filter: any): Promise<AuditLogInterface[]> {
        const allLogs: AuditLogInterface[] = [];

        for (const storage of this.storages) {
            const logs = await storage.fetchLogs(filter);
            allLogs.push(...logs.data);
        }

        // Filter logs based on the filter criteria (e.g., userId)
        const filteredLogs = allLogs.filter(log => {
            return Object.entries(filter).every(([key, value]) => log[key] === value);
        });

        // De-duplicate logs based on `id`
        const uniqueLogs = Array.from(new Map(filteredLogs.map(log => [log.id, log])).values());

        // Log each unique log to console
        uniqueLogs.forEach(log => this.consoleLogger.logEventToConsole(log));

        return uniqueLogs;
    }
}
