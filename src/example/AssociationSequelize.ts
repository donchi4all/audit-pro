import { Sequelize, DataTypes, Model } from 'sequelize';
import { AuditLogInterface } from '../interfaces';
import { LogLevelEnum } from '../LogLevel';
import { SequelizeStorage } from '../storage/SequelizeStorage';

// Initialize Sequelize
const sequelize = new Sequelize('mysql://root:password@localhost:3306/audit', {
    logging: false, // Set to true for SQL query logging
});

// Define the User model
class User extends Model {
    public id!: string;
    public username!: string;
}

User.init(
    {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        sequelize,
        modelName: 'User',
        freezeTableName: true,
    }
);

// Define dynamic columns for audit logs
const dynamicColumns = {
    extraInfo: {
        type: DataTypes.JSON,
        allowNull: true,
    },
};

// Create an instance of SequelizeStorage
const auditStorage = new SequelizeStorage(sequelize, 'AuditLogInterface', dynamicColumns, {
    user: { relationship: 'belongsTo', targetModel: User, options: { foreignKey: 'userId' } },
});

// Sync the database and log an event
(async () => {
    await sequelize.sync({ force: true }); // Use with caution in production!

    // Log an event
    const event: AuditLogInterface = {
        userId: 'some-user-id',
        action: 'LOGIN',
        logLevel: LogLevelEnum.INFO,
        metadata: { ip: '127.0.0.1' },
        extraInfo: { browser: 'Chrome' },
    };

    await auditStorage.logEvent(event);

    // Fetch logs for a specific user
    const logs = await auditStorage.fetchLogs({ where: { userId: 'some-user-id' } });
    console.log('Fetched Logs:', logs);

    // Cleanup
    await sequelize.close();
})();
