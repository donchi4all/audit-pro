
import { LogLevel } from './LogLevel';

export interface AuditLogInterface {
    id?: string;
    action: string;
    userId: string;
    logLevel: LogLevel;
    ipAddress?: string;
    metadata?: any;
    [key: string]: any; // Index signature to allow dynamic properties
}

export interface StorageInterface {
    getTableName(): string;
    logEvent(event: AuditLogInterface): Promise<void>
    fetchLogs(filter: any): Promise<AuditLogInterface[]>;
    fetchLog(filter: any): Promise<AuditLogInterface | null>;
    updateLog(id: string, updates: Partial<AuditLogInterface>): Promise<void>;
    deleteLog(id: string): Promise<void>;
    countLogs(filter: any): Promise<number>;
    findAll({ where, include, order }: { where?: Record<string, any>; include?: Array<{ association: string; required?: boolean; attributes?: string[] }>; order?: [string, 'asc' | 'desc'][]; }): Promise<AuditLogInterface[]>
}

export interface AuditTrailConfig {
    tableName?: string;
    columns?: { [key: string]: any };
}

