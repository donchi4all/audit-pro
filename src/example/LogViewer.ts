import { Sequelize } from "sequelize";
import { FileStorage } from "../storage/FileStorage";
import { SequelizeStorage } from "../storage/SequelizeStorage";
import { LogViewer } from "../LogViewer";
import { LogLevelEnum } from "../LogLevel";
import { AuditLogInterface } from "../interfaces";
import { ConsoleLogger } from "../ConsoleLogger";
import { MongoStorage } from "../storage/MongoStorage";

const main = async () => {
  const consoleLogger = new ConsoleLogger(true);
  const tableName = 'AuditLogs';


  //set up the  mongoStorage database
  const mongoConnectionString = 'mongodb://localhost:27017/auditLogs';
  const dynamicColumns = {
    createdAt: { type: Date, default: Date.now },
  };
  const mongoStorage = new MongoStorage(mongoConnectionString, tableName, dynamicColumns);


  //set up the  sequelizeStorage database
  const sequelize = new Sequelize('mysql://root:password@localhost:3306/audit', {
    logging: false, // Set to true for SQL query logging
  });
  const sequelizeStorage = new SequelizeStorage(sequelize, tableName, {});



  const logViewer = new LogViewer([mongoStorage, sequelizeStorage], consoleLogger);

  // Log some events
  const log1: AuditLogInterface = {
    id: '1',
    userId: 'user1234',
    action: 'User Login',
    logLevel: LogLevelEnum.INFO,
    metadata: { ipAddress: '192.168.1.1' },
  };
  const log2: AuditLogInterface = {
    id: '2',
    userId: 'user1234',
    action: 'User Logout',
    logLevel: LogLevelEnum.INFO,
    metadata: { ipAddress: '192.168.1.1' },
  };
  const log3: AuditLogInterface = {
    id: '3',
    userId: 'user5678',
    action: 'User Login',
    logLevel: LogLevelEnum.INFO,
    metadata: { ipAddress: '192.168.1.2' },
  };

  await sequelizeStorage.logEvent(log1);
  await mongoStorage.logEvent(log2);
  await mongoStorage.logEvent(log3);

  // View logs for user1234
  const logsForUser1234 = await logViewer.viewLogs({ userId: 'user1234' });
  console.log('Filtered Logs for user1234:', logsForUser1234);

  // View logs for user5678
  const logsForUser5678 = await logViewer.viewLogs({ userId: 'user5678' });
  console.log('Filtered Logs for user5678:', logsForUser5678);
};

main().catch(console.error);
