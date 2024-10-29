import mongoose, { Document, Schema } from 'mongoose';
import { AuditLogInterface, StorageInterface } from '../interfaces';

interface MongoAuditLog extends Document, Omit<AuditLogInterface, 'id'> { }

const createMongoModel = (tableName: string, dynamicColumns: Record<string, any>) => {
    const schemaDefinition = {
        userId: { type: String, required: true },
        action: { type: String, required: true },
        logLevel: { type: String, required: true },
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

    // Public getter to expose the model instance
    public getModelInstance(): mongoose.Model<MongoAuditLog> {
        return this.getModel();
    }

    public async logEvent(event: AuditLogInterface): Promise<void> {
        const model = this.getModel();
        const logEntry = new model(event);
        await logEntry.save();
    }

    public async fetchLogs(filter: any): Promise<AuditLogInterface[]> {
        const model = this.getModel();
        const logs = await model.find(filter).exec();
        return logs.map(log => log.toObject() as unknown as AuditLogInterface);
    }

    public async fetchLog(filter: any): Promise<AuditLogInterface | null> {
        const model = this.getModel();
        return await model.findOne(filter);
    }

    public async updateLog(id: string, updates: Partial<AuditLogInterface>): Promise<void> {
        const model = this.getModel();
        await model.updateOne({ _id: id }, updates);
    }

    public async deleteLog(id: string): Promise<void> {
        const model = this.getModel();
        await model.deleteOne({ _id: id });
    }


    public async fetchAllLogs(): Promise<AuditLogInterface[]> {
        const model = this.getModel();
        const logs = await model.find().exec();
        return logs.map(log => log.toObject() as unknown as AuditLogInterface);
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


    public async findAll({
        where = {},
        include = [],
        order = []
    }: {
        where?: Record<string, any>;
        include?: Array<{ association: string; required?: boolean; attributes?: string[] }>; // Updated to accept complex include structure
        order?: [string, 'asc' | 'desc'][];
    }): Promise<AuditLogInterface[]> {
        const model = this.getModel();
        const query = model.find(where);

        // Add includes (populate related documents)
        include.forEach(item => {
            const { association, required = false, attributes } = item;
            query.populate({
                path: association,
                model: association, // Ensure the model name matches the association name
                select: attributes ? attributes.join(' ') : undefined, // Include specific attributes if provided
                match: required ? {} : undefined, // Add any match condition if required
            });
        });

        // Add ordering
        if (order.length > 0) {
            const sortOptions = Object.fromEntries(order);
            query.sort(sortOptions);
        }

        // Use `as AuditLogInterface[]` to assert the type
        return query.lean().exec() as unknown as Promise<AuditLogInterface[]>;
    }

}
