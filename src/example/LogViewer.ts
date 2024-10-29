import { Sequelize } from "sequelize";
import { FileStorage } from "../storage/FileStorage";
import { SequelizeStorage } from "../storage/SequelizeStorage";
import { LogViewer } from "../LogViewer";
import { LogLevel } from "../LogLevel";
import { AuditLogInterface } from "../interfaces";
import { ConsoleLogger, Color } from "..";

const isDevelopment = process.env.NODE_ENV === 'development';

const sequelizeInstance = new Sequelize('mysql://root:password@localhost:3306/audit', {
  logging: isDevelopment ? console.log : false,
});

// Initialize storages
const fileStorage = new FileStorage('./logs.json', {});

const sequelizeStorage = new SequelizeStorage(sequelizeInstance, 'AuditLogs', {});

// Initialize the logger for console output
const consoleLogger = new ConsoleLogger(true);

// Initialize the log viewer
const logViewer = new LogViewer([fileStorage, sequelizeStorage], consoleLogger);

// Fetch logs from both storages and display in the console
logViewer.viewLogs({ userId: 'user123' }).then((logs) => {
  //console.log('Logs retrieved:', logs);
});



// Example usage
const customColumns = {
  [LogLevel.INFO]: { label: 'Information', color: Color.MAGENTA }, // Use Color.CYAN
  [LogLevel.ERROR]: { label: 'Error Occurred', color: Color.RED }, // Use Color.RED
};

// Create an instance of ConsoleLogger with custom columns
const consoleLogger2 = new ConsoleLogger(true, customColumns);

// Create sample audit log events
const logs: AuditLogInterface[] = [
  {
    id: 'unique-log-id1',
    userId: 'user1234',
    action: 'User Login',
    logLevel: LogLevel.INFO,
    timestamp: new Date(),
    metadata: {
      ipAddress: '192.168.1.1',
    },
  },
  {
    id: 'unique-log-id2',
    userId: 'user5678',
    action: 'Failed Login Attempt',
    logLevel: LogLevel.ERROR,
    timestamp: new Date(),
    metadata: {
      ipAddress: '192.168.1.2',
      reason: 'Incorrect password',
    },
    ns:'dd',
    dddd: false
  },
];

// Log the events using the consoleLogger

for (const log of logs) {
  consoleLogger.logEventToConsole(log);
}
