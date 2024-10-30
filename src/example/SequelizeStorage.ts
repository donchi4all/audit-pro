import { DataTypes, Model, ModelAttributes, Sequelize } from 'sequelize';
import { AuditLogInterface } from '../interfaces';
import { SequelizeStorage } from '../storage/SequelizeStorage';
import { LogLevelEnum } from '../LogLevel';


const sequelize = new Sequelize('mysql://root:password@localhost:3306/audit', {
    logging: false, // Set to true for SQL query logging
});

const tableName = 'AuditLogs';
const dynamicColumns = {}; // Add any dynamic columns if needed

const sequelizeStorage = new SequelizeStorage(sequelize, tableName, dynamicColumns);

const runExample = async () => {
    try {
        // 1. Sync the table
        await sequelizeStorage.syncTable();
        console.log('Table synced successfully.');

        // 2. Log an event
        const newLog: AuditLogInterface = {
            userId: 'user1234',
            action: 'User Login',
            logLevel: LogLevelEnum.INFO,
            metadata: { ipAddress: '192.168.1.1' },
        };

        await sequelizeStorage.logEvent(newLog);
        console.log('Log event created successfully.');

        // 3. Fetch logs
        const { data: logs, total, page, limit } = await sequelizeStorage.fetchLogs({
            where: { userId: 'user1234' },
            page: 1,
            limit: 5,
        });

        console.log(`Total logs: ${total}, Page: ${page}, Limit: ${limit}`);
        console.log('Fetched logs:', logs);

        // 4. Update a log (assume the first log's ID is available)
        if (logs.length > 0) {
            const logId = logs[0].id; // Get the ID of the first log
            await sequelizeStorage.updateLog(logId!, { action: 'User Logout' });
            console.log(`Log with ID ${logId} updated successfully.`);
        }

        // 5. Fetch the updated log
        const updatedLog = await sequelizeStorage.fetchLog({ where: { id: logs[0].id } });
        console.log('Updated log:', updatedLog);

        // 6. Delete a log (again using the first log's ID)
        if (logs.length > 0) {
            const logId = logs[0].id; // Get the ID of the first log
            await sequelizeStorage.deleteLog(logId!);
            console.log(`Log with ID ${logId} deleted successfully.`);
        }

        // 7. Fetch logs after deletion to verify
        const logsAfterDeletion = await sequelizeStorage.fetchLogs({ where: { userId: 'user1234' } });
        console.log('Logs after deletion:', logsAfterDeletion.data);

    } catch (error) {
        console.error('Error occurred:', error);
    } finally {
        // Close the Sequelize connection
        await sequelize.close();
        console.log('Database connection closed.');
    }
};

runExample();
