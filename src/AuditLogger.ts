import { ConsoleLogger } from "./ConsoleLogger";
import { AuditLogInterface, StorageInterface } from "./interfaces";


export class AuditLogger {
    private storage: StorageInterface;
    private consoleLogger: ConsoleLogger;

    constructor(storage: StorageInterface, consoleLogger: ConsoleLogger) {
        this.storage = storage; // Single storage instance (FileStorage, SequelizeStorage, MongoStorage, etc.)
        this.consoleLogger = consoleLogger; // Optional Console Logger
    }

    /**
     * Logs an event to the configured storage system.
     * @param log - The audit log object containing details of the event.
     */
    public async logEvent(log: AuditLogInterface): Promise<void> {
        try {
            // Log event to the storage
            await this.storage.logEvent(log);
        } catch (error) {
            console.error(`Failed to log event: ${error}`);
        }

        // Optionally log the event to the console if console logging is enabled
        if (this.consoleLogger.getIsEnabled()) {
            this.consoleLogger.logEventToConsole(log);
        }
    }

    /**
     * Fetches logs based on filters from the storage.
     * @param filter - Filter object to narrow down logs (e.g., by userId or action).
     */
    public async fetchLogs(filter: any): Promise<AuditLogInterface[]> {
        try {
            return await this.storage.fetchLogs(filter);
        } catch (error) {
            console.error(`Failed to fetch logs: ${error}`);
            return [];
        }
    }

    /**
     * Updates a log based on its ID in the storage.
     * @param id - Unique identifier for the log to be updated.
     * @param updates - Partial object containing the updates to be applied.
     */
    public async updateLog(id: string, updates: Partial<AuditLogInterface>): Promise<void> {
        try {
            await this.storage.updateLog(id, updates);
        } catch (error) {
            console.error(`Failed to update log: ${error}`);
        }
    }

    /**
     * Deletes a log based on its ID in the storage.
     * @param id - Unique identifier for the log to be deleted.
     */
    public async deleteLog(id: string): Promise<void> {
        try {
            await this.storage.deleteLog(id);
        } catch (error) {
            console.error(`Failed to delete log: ${error}`);
        }
    }

    /**
     * Counts logs based on a filter from the storage.
     * @param filter - Filter object to narrow down the logs to count.
     * @returns - A count of logs matching the filter criteria.
     */
    public async countLogs(filter: any): Promise<number> {
        try {
            return await this.storage.countLogs(filter);
        } catch (error) {
            console.error(`Failed to count logs: ${error}`);
            return 0;
        }
    }
}
