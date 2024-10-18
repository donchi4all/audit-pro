import { promises as fs } from 'fs';
import { StorageInterface, AuditLog } from '../interfaces';

export class FileStorage implements StorageInterface {
    private filePath: string;
    private dynamicColumns: { [key: string]: any }; // Store dynamic columns

    constructor(filePath: string, dynamicColumns: { [key: string]: any }) {
        this.filePath = filePath;
        this.dynamicColumns = dynamicColumns;
    }
    getTableName(): string {
        return this.filePath;
    }

    // Log event with dynamic columns
    public async logEvent(event: AuditLog): Promise<void> {
        const logs = await this.readLogs();
        const dynamicEvent = { ...event, ...this.dynamicColumns }; // Merge event and dynamic columns
        logs.push(dynamicEvent);
        await this.writeLogs(logs); // Ensure JSON is rewritten correctly
    }

    // Fetch logs by applying filters including dynamic columns
    public async fetchLogs(filter: any): Promise<AuditLog[]> {
        const logs = await this.readLogs();
        return logs.filter((log) =>
            Object.keys(filter).every((key) => log[key] === filter[key])
        );
    }

     // Fetch logs by applying filters including dynamic columns
     public async fetchLog(filter: any): Promise<AuditLog> {
        const logs = await this.readLogs();
        return logs[0];
    }

    // Fetch all logs
    public async fetchAllLogs(): Promise<AuditLog[]> {
        return await this.readLogs();
    }

    // Count logs that match a specific filter
    public async countLogs(filter: any): Promise<number> {
        const logs = await this.fetchLogs(filter);
        return logs.length;
    }

    // Update logs with dynamic columns
    public async updateLog(id: string, updates: Partial<AuditLog>): Promise<void> {
        const logs = await this.readLogs();
        const index = logs.findIndex((log) => log.id === id);
        if (index !== -1) {
            logs[index] = { ...logs[index], ...updates, ...this.dynamicColumns };
            await this.writeLogs(logs);
        }
    }

    // Delete a log by id
    public async deleteLog(id: string): Promise<void> {
        const logs = await this.readLogs();
        const updatedLogs = logs.filter((log) => log.id !== id);
        await this.writeLogs(updatedLogs);
    }

    // Read logs from file
    private async readLogs(): Promise<AuditLog[]> {
        try {
            const content = await fs.readFile(this.filePath, 'utf-8');
            return JSON.parse(content);
        } catch {
            return [];
        }
    }

    // Write logs to file and ensure the JSON structure is valid
    private async writeLogs(logs: AuditLog[]): Promise<void> {
        if (logs.length === 0) {
            // Don't write anything if the logs array is empty
            return;
        }
        await fs.writeFile(this.filePath, JSON.stringify(logs, null, 2));
    }

}
