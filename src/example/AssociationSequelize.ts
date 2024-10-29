import { DataTypes, Model, Sequelize } from 'sequelize';
import { AuditLog } from '../interfaces';
import { LogLevel } from '../LogLevel';
import { SequelizeStorage } from '../storage/SequelizeStorage';


// Initialize Sequelize
const sequelize = new Sequelize('database', 'username', 'password', {
    host: 'localhost',
    dialect: 'postgres', // or 'mysql', 'sqlite', etc.
});

// Define an example target model (e.g., User)
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

// Define an example target model for a many-to-many relationship (e.g., Role)
class Role extends Model {
    public id!: string;
    public name!: string;
}

Role.init(
    {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        sequelize,
        modelName: 'Role',
        freezeTableName: true,
    }
);

// Define a join table for the many-to-many relationship
class UserRole extends Model {
    public userId!: string;
    public roleId!: string;
}

UserRole.init(
    {
        userId: {
            type: DataTypes.UUID,
            references: {
                model: User,
                key: 'id',
            },
        },
        roleId: {
            type: DataTypes.UUID,
            references: {
                model: Role,
                key: 'id',
            },
        },
    },
    {
        sequelize,
        modelName: 'UserRole',
        freezeTableName: true,
    }
);

// Define your dynamic columns
const dynamicColumns = {
    extraInfo: {
        type: DataTypes.JSON,
        allowNull: true,
    },
};

// Create an instance of SequelizeStorage with associations
const auditStorage = new SequelizeStorage(sequelize, 'AuditLog', dynamicColumns, {
    user: {
        relationship: 'belongsTo',
        targetModel: User,
        options: { foreignKey: 'userId' },
    },
    roles: {
        relationship: 'belongsToMany',
        targetModel: Role,
        options: {
            through: UserRole,
            foreignKey: 'userId',
        },
    },
});

// Synchronize the tables with the database
(async () => {
    await sequelize.sync({ force: true }); // Be cautious with force: true in production!

    // Logging an event
    const event: AuditLog = {
        userId: 'some-user-id',
        action: 'LOGIN',
        logLevel: LogLevel.INFO,
        metadata: { ip: '127.0.0.1' },
        extraInfo: { browser: 'Chrome' },
    };

    await auditStorage.logEvent(event);

    // Fetching logs
    const logs = await auditStorage.fetchLogs({ userId: 'some-user-id' });
    console.log(logs);

    // Fetching a single log
    const singleLog = await auditStorage.fetchLog({ id: logs[0].id });
    console.log(singleLog);

    // Updating a log
    await auditStorage.updateLog(logs[0].id , { logLevel: 'ERROR' });

    // Deleting a log
    await auditStorage.deleteLog(logs[0].id);

    // Fetching all logs
    const allLogs = await auditStorage.fetchAllLogs();
    console.log(allLogs);

    // Counting logs
    const logCount = await auditStorage.countLogs({ userId: 'some-user-id' });
    console.log(`Total logs for user: ${logCount}`);

    // Cleanup
    await sequelize.close();
})();
