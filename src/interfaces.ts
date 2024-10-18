
import { LogLevel } from './LogLevel';

export interface AuditLog {
    id?: string;
    action: string;
    userId: string;
    logLevel: LogLevel;
    timestamp: Date;
    ipAddress?: string;
    metadata?: any;
    [key: string]: any; // Index signature to allow dynamic properties
}

export interface StorageInterface {
    getTableName(): string;
    logEvent(event: AuditLog): Promise<void> 
    fetchLogs(filter: any): Promise<AuditLog[]>;
    fetchLog(filter: any): Promise<AuditLog | null>;
    updateLog(id: string, updates: Partial<AuditLog>): Promise<void>;
    deleteLog(id: string): Promise<void> ;
    countLogs(filter: any): Promise<number>;
}

export interface AuditTrailConfig {
    tableName?: string;
    columns?: { [key: string]: any };
}

