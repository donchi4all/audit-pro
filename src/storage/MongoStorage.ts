import mongoose, { Document, Schema } from 'mongoose';
import { AuditLogInterface, StorageInterface, FindParams } from '../interfaces';

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

    public async fetchLogs({ where = {}, include = [], page = 1, limit = 10 }: FindParams): Promise<{ data: AuditLogInterface[], total: number, page: number, limit: number }> {
        const model = this.getModel();
        const query = model.find(where);

        this.applyPopulation(query, include);

        const total = await model.countDocuments(where);
        const logs = await query.skip((page - 1) * limit).limit(limit).lean().exec();

        return {
            data: logs as unknown as AuditLogInterface[],
            total,
            page,
            limit,
        };
    }

    public async fetchLog({ where, include = [] }: FindParams): Promise<AuditLogInterface | null> {
        const model = this.getModel();

        // Create the query with findOne and apply population
        const query = model.findOne(where);
        this.applyPopulation(query, include); // Populate associations directly in the query

        const log = await query.lean().exec(); // Convert to plain object after population

        return log ? (log as unknown as AuditLogInterface) : null;
    }


    public async updateLog(id: string, updates: Partial<AuditLogInterface>): Promise<void> {
        const model = this.getModel();
        await model.updateOne({ _id: id }, updates);
    }

    public async deleteLog(id: string): Promise<void> {
        const model = this.getModel();
        await model.deleteOne({ _id: id });
    }

    public async deleteLogsOlderThan(date?: Date): Promise<void> {
        const model = this.getModel();
        const thresholdDate = date || new Date(Date.now() - 3 * 30 * 24 * 60 * 60 * 1000); // Default to 3 months
        await model.deleteMany({ createdAt: { $lt: thresholdDate } });
    }

    public async countLogs(filter: Record<string, any>): Promise<number> {
        const model = this.getModel();
        return await model.countDocuments(filter);
    }

    public getModel(): mongoose.Model<MongoAuditLog> {
        if (!this.models[this.tableName]) {
            this.models[this.tableName] = createMongoModel(this.tableName, this.dynamicColumns);
        }
        return this.models[this.tableName];
    }

    // Centralized population method
    private applyPopulation(
        query: mongoose.Query<any, MongoAuditLog>, // Adjusted type with any as ResultType and MongoAuditLog as DocumentType
        include: Array<{ association: string; required?: boolean; attributes?: string[] }>
    ) {
        include.forEach(item => {
            const { association, required = false, attributes } = item;
            query.populate({
                path: association,
                model: association, // Ensure the model name matches the association name
                select: attributes ? attributes.join(' ') : undefined, // Include specific attributes if provided
            });
        });
    }


    public async findAll({ where = {}, include = [], order = [], page = 1, limit = 10 }: {
        where?: Record<string, any>;
        include?: Array<{ association: string; required?: boolean; attributes?: string[] }>; // Updated to accept complex include structure
        order?: [string, 'asc' | 'desc'][];
        page?: number;  // For pagination, default to 1 if not provided
        limit?: number; // For pagination, default to a specific limit (e.g., 10) if not provided
    }): Promise<{ data: AuditLogInterface[], total: number, page: number, limit: number }> {
        const model = this.getModel();
        const query = model.find(where);

        // Apply population for associated documents
        this.applyPopulation(query, include);

        // Add ordering
        if (order.length > 0) {
            const sortOptions = Object.fromEntries(order);
            query.sort(sortOptions);
        }

        const total = await model.countDocuments(where);
        const logs = await query.skip((page - 1) * limit).limit(limit).lean().exec();

        return {
            data: logs.map(log => log.toObject() as AuditLogInterface),
            total,
            page,
            limit,
        };
    }
}
