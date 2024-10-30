
import { LogLevelEnum } from './LogLevel';

export interface AuditLogInterface {
    id?: string;
    action: string;
    userId: string;
    logLevel: LogLevelEnum;
    ipAddress?: string;
    metadata?: any;
    [key: string]: any; // Index signature to allow dynamic properties
}



export interface StorageInterface {

    /**
     * Logs an event in the database.
     * @param event The audit log event to store.
     */
    logEvent(event: AuditLogInterface): Promise<void>;

    /**
     * Retrieves paginated logs based on a filter.
     * @param where Criteria for selecting logs.
     * @param page Current page number for pagination.
     * @param limit Number of records per page.
     * @returns Paginated logs and metadata.
     */
    fetchLogs({ where, page, include, limit }: FindParams): Promise<{ data: AuditLogInterface[], total: number, page: number, limit: number }>;

    /**
     * Retrieves a single log entry based on the specified filter.
     * @param filter Criteria for selecting the log.
     * @returns The log entry if found, otherwise null.
     */
    fetchLog({ where, include }: FindParams): Promise<AuditLogInterface | null>;

    /**
     * Updates a log entry with specified data.
     * @param id The ID of the log entry to update.
     * @param updates Data to update in the log entry.
     */
    updateLog(id: string, updates: Partial<AuditLogInterface>): Promise<void>;

    /**
     * Deletes a specific log entry based on ID.
     * @param id The ID of the log entry to delete.
     */
    deleteLog(id: string): Promise<void>;

    /**
     * Deletes logs older than the specified date. Defaults to logs older than 3 months.
     * @param date Optional date for deletion threshold.
     */
    deleteLogsOlderThan(date?: Date): Promise<void>;


    /**
     * Counts logs based on specified criteria.
     * @param filter Criteria for counting logs.
     * @returns The count of logs matching the filter.
     */
    countLogs(filter: Record<string, any>): Promise<number>;

    /**
     * Retrieves all records with specified conditions, pagination, ordering, and associations.
     * @param params Filtering, pagination, ordering, and associations options.
     * @returns Paginated logs and metadata.
     */
    findAll(params: {
        where?: Record<string, any>;
        include?: Array<{ association: string; required?: boolean; attributes?: string[] }>;
        order?: [string, 'asc' | 'desc'][];
        page?: number;
        limit?: number;
    }): Promise<{ data: AuditLogInterface[], total: number, page: number, limit: number }>;

    /**
     * Returns the name of the associated database table.
     * @returns The table name.
     */
    getTableName(): string;

    /**
     * Returns the Sequelize model instance.
     * @returns The model instance.
     */
    getModelInstance(): any;
}



export interface AuditTrailConfig {
    tableName?: string;
    columns?: { [key: string]: any };
}


// Define the shared FindParams interface
export interface FindParams {
    where?: Record<string, any>;
    include?: Array<{ association: string; required?: boolean; attributes?: string[] }>;  // Generic include type, could represent Sequelize IncludeOptions or Mongoose populate
    order?: [string, 'asc' | 'desc'][];  // Common ordering format for sorting
    page?: number;  // For pagination, default to 1 if not provided
    limit?: number;  // For pagination, default to a specific limit (e.g., 10) if not provided
}

