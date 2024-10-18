import { Sequelize, DataTypes, Model, ModelAttributes, ModelStatic } from 'sequelize';
import { AuditLog, StorageInterface } from '../interfaces';

export class SequelizeStorage implements StorageInterface {
    private sequelize: Sequelize;
    private models: { [key: string]: ModelStatic<Model<AuditLog>> } = {};
    private tableName: string;
    private dynamicColumns: ModelAttributes<Model<AuditLog>, AuditLog>;

    constructor(sequelize: Sequelize, tableName: string, dynamicColumns: Partial<ModelAttributes<Model<AuditLog>, AuditLog>>) {
        this.sequelize = sequelize;
        this.tableName = tableName;

        const defaultColumns: ModelAttributes<Model<AuditLog>, AuditLog> = {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: DataTypes.UUIDV4,
                allowNull: false,
            },
            userId: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            action: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            logLevel: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            timestamp: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            metadata: {
                type: DataTypes.JSON,
                allowNull: true,
            },
        };

        this.dynamicColumns = {
            ...defaultColumns,
            ...Object.fromEntries(Object.entries(dynamicColumns).filter(([, value]) => value !== undefined)),
        } as ModelAttributes<Model<AuditLog>, AuditLog>;

        this.getModel(); // Define the model during initialization
    }

    public getTableName(): string {
        return this.tableName;
    }

    private defineModel(): ModelStatic<Model<AuditLog>> {
        return this.sequelize.define<Model<AuditLog>>(this.tableName, this.dynamicColumns, { freezeTableName: true });
    }

    private getModel(): ModelStatic<Model<AuditLog>> {
        if (!this.models[this.tableName]) {
            this.models[this.tableName] = this.defineModel();
        }
        return this.models[this.tableName];
    }

    public async syncTable(): Promise<void> {
        const model = this.getModel();
        await model.sync(); // Ensure the table is created
    }

    public async logEvent(event: AuditLog): Promise<void> {
        const model = this.getModel();
        await model.sync(); // Sync the table before logging
        await model.create(event);
    }

    public async fetchLogs(filter: any): Promise<AuditLog[]> {
        const model = this.getModel();
        await model.sync(); // Sync the table before querying
        const logs = await model.findAll({ where: filter });
        return logs.map(log => log.get({ plain: true })) as AuditLog[];
    }

    public async fetchLog(filter: any): Promise<AuditLog | null> {
        const model = this.getModel();
        await model.sync(); // Sync the table before querying
        const logEntry = await model.findOne({ where: filter });
        return logEntry ? logEntry.get({ plain: true }) as AuditLog : null; // Return log entry or null
    }

    public async updateLog(id: string, updates: Partial<AuditLog>): Promise<void> {
        const model = this.getModel();
        await model.sync(); // Sync the table before updating
        await model.update(updates, { where: { id } });
    }

    public async deleteLog(id: string): Promise<void> {
        const model = this.getModel();
        await model.sync(); // Sync the table before deletion
        await model.destroy({ where: { id } });
    }

    public async fetchAllLogs(): Promise<AuditLog[]> {
        const model = this.getModel();
        await model.sync(); // Sync the table before fetching all logs
        const logs = await model.findAll();
        return logs.map(log => log.get({ plain: true })) as AuditLog[];
    }

    public async countLogs(filter: any): Promise<number> {
        const model = this.getModel();
        await model.sync(); // Sync the table before counting
        return await model.count({ where: filter });
    }
}
