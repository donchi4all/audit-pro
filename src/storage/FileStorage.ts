import { promises as fs } from 'fs';
import { StorageInterface, AuditLogInterface, FindParams } from '../interfaces';

export class FileStorage implements StorageInterface {
    private filePath: string;
    private dynamicColumns: { [key: string]: any };

    constructor(filePath: string, dynamicColumns: { [key: string]: any }) {
        this.filePath = filePath;
        this.dynamicColumns = dynamicColumns;
    }
    getModelInstance() {
        throw new Error('Method not implemented.');
    }

    getTableName(): string {
        return this.filePath;
    }

    public getFilePath(): string {
        return this.filePath;
    }

    public async logEvent(event: AuditLogInterface): Promise<void> {
        const logs = await this.readLogs();
        const dynamicEvent = { ...event, ...this.dynamicColumns };
        logs.push(dynamicEvent);
        await this.writeLogs(logs);
    }

    public async fetchLogs({ where = {}, page = 1, limit = 10 }: FindParams): Promise<{ data: AuditLogInterface[], total: number, page: number, limit: number }> {
        const logs = await this.readLogs();
        const filteredLogs = logs.filter((log) =>
            Object.keys(where).every((key) => log[key] === where[key])
        );

        const total = filteredLogs.length;
        const offset = (page - 1) * limit;
        const paginatedData = filteredLogs.slice(offset, offset + limit);

        return { data: paginatedData, total, page, limit };
    }

    public async fetchLog({ where = {} }: FindParams): Promise<AuditLogInterface | null> {
        const logs = await this.readLogs();
        const logEntry = logs.find((log) =>
            Object.keys(where).every((key) => log[key] === where[key])
        );
        return logEntry ? { ...logEntry } : null;
    }
    

    public async updateLog(id: string, updates: Partial<AuditLogInterface>): Promise<void> {
        const logs = await this.readLogs();
        const index = logs.findIndex((log) => log.id === id);
        if (index !== -1) {
            logs[index] = { ...logs[index], ...updates, ...this.dynamicColumns };
            await this.writeLogs(logs);
        }
    }

    public async deleteLog(id: string): Promise<void> {
        const logs = await this.readLogs();
        const updatedLogs = logs.filter((log) => log.id !== id);
        await this.writeLogs(updatedLogs);
    }

    public async deleteLogsOlderThan(date: Date = new Date(new Date().setMonth(new Date().getMonth() - 3))): Promise<void> {
        const logs = await this.readLogs();
        const updatedLogs = logs.filter((log) => new Date(log.createdAt) >= date);
        await this.writeLogs(updatedLogs);
    }

    public async countLogs(filter: Record<string, any>): Promise<number> {
        const logs = await this.fetchLogs({ where: filter });
        return logs.total;
    }

    public async findAll({
        where = {},
        include = [],
        order = [],
        page = 1,
        limit = 10
    }: FindParams): Promise<{ data: AuditLogInterface[], total: number, page: number, limit: number }> {
        return this.fetchLogs({ where, page, limit });
    }

    private async readLogs(): Promise<AuditLogInterface[]> {
        try {
            const content = await fs.readFile(this.filePath, 'utf-8');
            return JSON.parse(content);
        } catch {
            return [];
        }
    }

    private async writeLogs(logs: AuditLogInterface[]): Promise<void> {
        if (logs.length === 0) {
            return;
        }
        await fs.writeFile(this.filePath, JSON.stringify(logs, null, 2));
    }
}
