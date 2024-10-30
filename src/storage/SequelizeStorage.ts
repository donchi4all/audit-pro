import { Sequelize, DataTypes, Model, ModelAttributes, ModelStatic, AssociationOptions, Op, IncludeOptions, OrderItem, WhereOptions } from 'sequelize';
import { AuditLogInterface, FindParams, StorageInterface } from '../interfaces';

interface AssociationConfig {
    relationship: 'belongsTo' | 'hasMany' | 'hasOne' | 'belongsToMany';
    targetModel: ModelStatic<any>;
    options?: AssociationOptions & { through?: string | ModelStatic<any> };
}


export class SequelizeStorage implements StorageInterface {
    private sequelize: Sequelize;
    private models: { [key: string]: ModelStatic<Model<AuditLogInterface>> } = {};
    private tableName: string;
    private dynamicColumns: ModelAttributes<Model<AuditLogInterface>, AuditLogInterface>;

    constructor(sequelize: Sequelize, tableName: string,
        dynamicColumns: Partial<ModelAttributes<Model<AuditLogInterface>, AuditLogInterface>>,
        associations: { [key: string]: AssociationConfig } = {}
    ) {
        this.sequelize = sequelize;
        this.tableName = tableName;

        const defaultColumns: ModelAttributes<Model<AuditLogInterface>, AuditLogInterface> = {
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
            metadata: {
                type: DataTypes.JSON,
                allowNull: true,
            },
        };

        this.dynamicColumns = {
            ...defaultColumns,
            ...Object.fromEntries(Object.entries(dynamicColumns).filter(([, value]) => value !== undefined)),
        } as ModelAttributes<Model<AuditLogInterface>, AuditLogInterface>;

        this.getModel(); // Define the model during initialization
        this.defineAssociations(associations); // Define associations during initialization
    }

    public getTableName(): string {
        return this.tableName;
    }

    private defineModel(): ModelStatic<Model<AuditLogInterface>> {
        return this.sequelize.define<Model<AuditLogInterface>>(this.tableName, this.dynamicColumns, { freezeTableName: true });
    }

    private getModel(): ModelStatic<Model<AuditLogInterface>> {
        if (!this.models[this.tableName]) {
            this.models[this.tableName] = this.defineModel();
        }
        return this.models[this.tableName];
    }

    private defineAssociations(associations: { [key: string]: AssociationConfig }): void {
        const model = this.getModel();

        for (const [alias, { relationship, targetModel, options }] of Object.entries(associations)) {
            switch (relationship) {
                case 'belongsTo':
                    model.belongsTo(targetModel, { ...options, as: alias });
                    break;
                case 'hasMany':
                    model.hasMany(targetModel, { ...options, as: alias });
                    break;
                case 'hasOne':
                    model.hasOne(targetModel, { ...options, as: alias });
                    break;
                case 'belongsToMany':
                    if (!options || !options.through) {
                        throw new Error(`A 'through' table is required for belongsToMany associations. Association: ${alias}`);
                    }
                    model.belongsToMany(targetModel, { ...options, as: alias, through: options.through });
                    break;
                default:
                    throw new Error(`Invalid association type: ${relationship}`);
            }
        }
    }


    // Public getter to expose the model instance
    public getModelInstance(): ModelStatic<Model<AuditLogInterface>> {
        return this.getModel();
    }

    public async syncTable(): Promise<void> {
        const model = this.getModel();
        await model.sync(); // Ensure the table is created
    }

    public async logEvent(event: AuditLogInterface): Promise<void> {
        const model = this.getModel();
        await model.sync(); // Sync the table before logging
        await model.create(event);
    }

    private async paginate(
        model: ModelStatic<Model<AuditLogInterface, AuditLogInterface>>,
        where: Record<string, any> = {},
        include?: Array<{ association: string; required?: boolean; attributes?: string[] }>, // Generic include type, could represent Sequelize IncludeOptions or Mongoose populate
        order: [string, 'asc' | 'desc'][] = [],
        page: number = 1,
        limit: number = 10
    ): Promise<{ data: AuditLogInterface[], total: number, page: number, limit: number }> {
        const offset = (page - 1) * limit;

        const { rows, count } = await model.findAndCountAll({
            where,
            include: include?.map(item => ({
                association: item.association,
                required: item.required || false,
                attributes: item.attributes || undefined,
            })),
            order,
            offset,
            limit,
            raw: false, // Ensure rows are Sequelize instances with the .get() method
        });


        return {
            data: rows.map(row => row instanceof Model ? row.get({ plain: true }) : row),
            total: count,
            page,
            limit
        };
    }




    public async fetchLog({ where, include }: FindParams): Promise<AuditLogInterface | null> {
        const model = this.getModel();
        await model.sync(); // Sync the table before logging
        const logEntry = await model.findOne({
            where,
            include: include?.map(item => ({
                association: item.association,
                required: item.required || false,
                attributes: item.attributes || undefined
            }))
        });
        return logEntry ? logEntry.get({ plain: true }) as AuditLogInterface : null;
    }

    public async updateLog(id: string, updates: Partial<AuditLogInterface>): Promise<void> {
        const model = this.getModel();
        await model.sync(); // Sync the table before updating
        await model.update(updates, { where: { id } });
    }

    public async deleteLog(id: string): Promise<void> {
        const model = this.getModel();
        await model.sync(); // Sync the table before deletion
        await model.destroy({ where: { id } });
    }

    // Fetch logs with pagination
    public async fetchLogs({
        where = {},
        include = [],
        page = 1,
        limit = 10,
    }: FindParams): Promise<{ data: AuditLogInterface[], total: number, page: number, limit: number }> {
        const model = this.getModel();
        return await this.paginate(model, where, include, [], page, limit);
    }


    public async countLogs(filter: Record<string, any>): Promise<number> {
        const model = this.getModel();
        await model.sync();
        return await model.count({ where: filter });
    }

    public async deleteLogsOlderThan(date = new Date(new Date().setMonth(new Date().getMonth() - 3))): Promise<void> {
        const model = this.getModel();
        await model.sync();
        await model.destroy({ where: { createdAt: { [Op.lt]: date } } });
    }

    // Find all logs with associations, order, and pagination
    public async findAll({
        where = {},
        include = [],
        order = [],
        page = 1,
        limit = 10
    }: FindParams): Promise<{ data: AuditLogInterface[], total: number, page: number, limit: number }> {
        const model = this.getModel();

        return await this.paginate(model, where, include, order, page, limit);
    }


}
