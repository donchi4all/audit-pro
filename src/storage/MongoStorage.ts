import mongoose, { Document, Schema } from 'mongoose';
import { AuditLog, StorageInterface } from '../interfaces';

interface MongoAuditLog extends Document, Omit<AuditLog, 'id'> { }

const createMongoModel = (tableName: string, dynamicColumns: Record<string, any>) => {
    const schemaDefinition = {
        userId: { type: String, required: true },
        action: { type: String, required: true },
        logLevel: { type: String, required: true },
        timestamp: { type: Date, required: true },
        metadata: { type: Schema.Types.Mixed, required: false },
        ...dynamicColumns,
    };

    const logSchema = new Schema<MongoAuditLog>(schemaDefinition);
    return mongoose.model<MongoAuditLog>(tableName, logSchema);
};

export class MongoStorage implements StorageInterface {
    private models: { [key: string]: mongoose.Model<MongoAuditLog> } = {};
    private tableName: string;
    private dynamicColumns: Record<string, any>;

    constructor(mongoConnectionString: string, tableName: string, dynamicColumns: Record<string, any>) {
        this.tableName = tableName;
        this.dynamicColumns = dynamicColumns;

        mongoose.connect(mongoConnectionString).then(() => {
            console.log('MongoDB connected successfully');
        }).catch(err => {
            console.error('MongoDB connection error:', err);
        });
    }


    public getTableName(): string {
        return this.tableName;
    }


    public async logEvent(event: AuditLog): Promise<void> {
        const model = this.getModel();
        const logEntry = new model(event);
        await logEntry.save();
    }

    public async fetchLogs(filter: any): Promise<AuditLog[]> {
        const model = this.getModel();
        const logs = await model.find(filter).exec();
        return logs.map(log => log.toObject() as unknown as AuditLog);
    }

    public async fetchLog(filter: any): Promise<AuditLog | null> {
        const model = this.getModel();
        return await model.findOne(filter);
    }

    public async updateLog(id: string, updates: Partial<AuditLog>): Promise<void> {
        const model = this.getModel();
        await model.updateOne({ _id: id }, updates);
    }

    public async deleteLog(id: string): Promise<void> {
        const model = this.getModel();
        await model.deleteOne({ _id: id });
    }


    public async fetchAllLogs(): Promise<AuditLog[]> {
        const model = this.getModel();
        const logs = await model.find().exec();
        return logs.map(log => log.toObject() as unknown as AuditLog);
    }

    public async countLogs(filter: any): Promise<number> {
        const model = this.getModel();
        return await model.countDocuments(filter).exec();
    }

    private getModel(): mongoose.Model<MongoAuditLog> {
        if (!this.models[this.tableName]) {
            this.models[this.tableName] = createMongoModel(this.tableName, this.dynamicColumns);
        }
        return this.models[this.tableName];
    }
}
