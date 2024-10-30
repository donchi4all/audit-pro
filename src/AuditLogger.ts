import { ConsoleLogger } from "./ConsoleLogger";
import { AuditLogInterface, FindParams, StorageInterface } from "./interfaces";

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
     * @param params - Filter object to narrow down logs (e.g., by userId or action).
     */
    public async fetchLogs(params: FindParams): Promise<{ data: AuditLogInterface[], total: number, page: number, limit: number }> {
        try {
            return await this.storage.fetchLogs(params);
        } catch (error) {
            console.error(`Failed to fetch logs: ${error}`);
            return { data: [], total: 0, page: params.page || 1, limit: params.limit || 10 };
        }
    }

    /**
     * Retrieves a single log entry based on the specified filter.
     * @param filter - Criteria for selecting the log.
     * @returns The log entry if found, otherwise null.
     */
    public async fetchLog(filter: FindParams): Promise<AuditLogInterface | null> {
        try {
            return await this.storage.fetchLog(filter);
        } catch (error) {
            console.error(`Failed to fetch log: ${error}`);
            return null;
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
     * @returns A count of logs matching the filter criteria.
     */
    public async countLogs(filter: Record<string, any>): Promise<number> {
        try {
            return await this.storage.countLogs(filter);
        } catch (error) {
            console.error(`Failed to count logs: ${error}`);
            return 0;
        }
    }

    /**
     * Deletes logs older than the specified date. Defaults to logs older than 3 months.
     * @param date Optional date for deletion threshold.
     */
    public async deleteLogsOlderThan(date?: Date): Promise<void> {
        try {
            await this.storage.deleteLogsOlderThan(date);
        } catch (error) {
            console.error(`Failed to delete logs older than ${date}: ${error}`);
        }
    }

    /**
     * Retrieves all records with specified conditions, pagination, ordering, and associations.
     * @param params Filtering, pagination, ordering, and associations options.
     * @returns Paginated logs and metadata.
     */
    public async findAll(params: FindParams): Promise<{ data: AuditLogInterface[], total: number, page: number, limit: number }> {
        try {
            return await this.storage.findAll(params);
        } catch (error) {
            console.error(`Failed to find all logs: ${error}`);
            return { data: [], total: 0, page: params.page || 1, limit: params.limit || 10 };
        }
    }

    /**
     * Returns the name of the associated storage table.
     * @returns The table name.
     */
    public getTableName(): string {
        return this.storage.getTableName();
    }

    /**
     * Returns the storage model instance.
     * @returns The model instance.
     */
    public getModelInstance(): any {
        return this.storage.getModelInstance();
    }
}
