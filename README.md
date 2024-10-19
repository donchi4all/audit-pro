
# Audit Pro

**Audit Pro** is an advanced audit logging and trail package for Node.js applications that supports multiple databases with dynamic columns, log levels, and customizable console logs. It enables developers to log, retrieve, and manage audit events easily and efficiently.

## Table of Contents

- [Audit Pro](#audit-pro)
  - [Table of Contents](#table-of-contents)
  - [Installation](#installation)
    - [Storage Dependencies](#storage-dependencies)
  - [Getting Started](#getting-started)
    - [Basic Setup](#basic-setup)
  - [Usage](#usage)
    - [Using Storage Instance to Log Events](#using-storage-instance-to-log-events)
    - [Logging Events](#logging-events)
    - [Fetching Logs](#fetching-logs)
    - [Updating Logs](#updating-logs)
    - [Deleting Logs](#deleting-logs)
    - [Counting Logs](#counting-logs)
  - [API Documentation](#api-documentation)
    - [AuditLogger](#auditlogger)
      - [Constructor](#constructor)
      - [Methods](#methods)
    - [Storage Interfaces](#storage-interfaces)
    - [ConsoleLogger](#consolelogger)
      - [Constructor](#constructor-1)
      - [Methods](#methods-1)
    - [Available Log Levels](#available-log-levels)
    - [Viewing Logs](#viewing-logs)
  - [Customizing Console Logs](#customizing-console-logs)
  - [Examples](#examples)
  - [Testing](#testing)
  - [License](#license)

## Installation

To install the `audit-pro` package, use npm:

```bash
npm install audit-pro
```

### Storage Dependencies

Depending on which storage type you plan to use, you may need to install additional dependencies:

- **Sequelize (for SQL databases):** If you intend to use Sequelize for SQL-based storage (e.g., MySQL, PostgreSQL), you must install `sequelize` and a corresponding SQL driver (e.g., `mysql2`, `pg`).

  ```bash
  npm install sequelize 
  ```

- **MongoDB:** If you are using MongoDB as your storage, install the `mongodb` package.

  ```bash
  npm install mongodb
  ```


## Getting Started

To start using **Audit Pro**, you need to create instances of the `AuditLogger`, the storage implementations (like `SequelizeStorage` or `FileStorage`), and the `ConsoleLogger`. 

### Basic Setup

```typescript
import { SequelizeStorage, LogLevel, AuditLog } from 'audit-pro';
import { DataTypes, Model, ModelAttributes, Sequelize } from 'sequelize';


// Setup your database connection
const sequelizeInstance = new Sequelize('mysql://user:password@localhost:3306/audit', {
  logging: false,
});

// Create storage and logger instances
const storage = new SequelizeStorage(sequelizeInstance, 'AuditLogs', {});
const logger = new ConsoleLogger(true); // true enables console logging

// Create an AuditLogger instance
const auditLogger = new AuditLogger(storage, logger);

OR

Using Storage Instance to Log Events
// Define dynamic columns (if any)
const dynamicColumns: Partial<ModelAttributes<Model<AuditLog>, AuditLog>> = {
    additionalInfo: {
        type: DataTypes.STRING,
        allowNull: true,
    },
};
// Create the storage instance with the necessary table name and dynamic columns
const storage = new SequelizeStorage(sequelizeInstance, 'AuditLogs', dynamicColumns);

```

## Usage

### Using Storage Instance to Log Events
You can also directly use the storage instance to log events. This is particularly useful if you want to log without going through the AuditLogger instance.

```typescript
// Create the storage instance with the necessary table name and dynamic columns
const storage = new SequelizeStorage(sequelizeInstance, 'AuditLogs', dynamicColumns);

// Example of logging an event
const logEvent: AuditLog = {
    id: 'unique-log-id',
    userId: 'user123',
    action: 'User Login',
    logLevel: LogLevel.INFO,
    timestamp: new Date(),
    metadata: { ipAddress: '192.168.1.1' },
    additionalInfo: 'extra information'
    // more custom fields on the dynamic column
}; 

// Log the event directly using the storage instance
await storage.logEvent(logEvent);

```

### Logging Events

To log an event, use the `logEvent` method. The method accepts an `AuditLog` object.

```typescript
const log: AuditLog = {
  id: 'unique-log-id',
  userId: 'user123',
  action: 'User Login',
  logLevel: LogLevel.INFO,
  timestamp: new Date(),
  metadata: { ipAddress: '192.168.1.1' },
  //any additional fields
};

// Log the event
await auditLogger.logEvent(log);
```

### Fetching Logs

You can retrieve logs with specific filters using the `fetchLogs` method.

```typescript
const logs = await auditLogger.fetchLogs({ userId: 'user123' });
console.log(logs);
```

### Updating Logs

To update an existing log, use the `updateLog` method.

```typescript
await auditLogger.updateLog('unique-log-id', { action: 'Updated Action' });
```

### Deleting Logs

You can delete logs by using the `deleteLog` method.

```typescript
await auditLogger.deleteLog('unique-log-id');
```

### Counting Logs

To count logs based on specific filters, use the `countLogs` method.

```typescript
const count = await auditLogger.countLogs({ userId: 'user123' });
console.log(`Total logs for user123: ${count}`);
```

## API Documentation

### AuditLogger

The `AuditLogger` class is the main entry point for logging events.

#### Constructor

```typescript
new AuditLogger(storage: StorageInterface, logger: ConsoleLogger)
```

- **storage**: An instance of a storage implementation (e.g., `SequelizeStorage`, `FileStorage`).
- **logger**: An instance of `ConsoleLogger` for logging to the console.

#### Methods

- `logEvent(log: AuditLog): Promise<void>`
- `fetchLogs(filter: object): Promise<AuditLog[]>`
- `fetchLog(filter: object): Promise<AuditLog>`
- `updateLog(id: string, updates: object): Promise<void>`
- `deleteLog(id: string): Promise<void>`
- `countLogs(filter: object): Promise<number>`

### Storage Interfaces

Implement your storage interface by extending `StorageInterface`. The main methods to implement are:

- `logEvent(log: AuditLog): Promise<void>`
- `fetchLogs(filter: object): Promise<AuditLog[]>`
- `updateLog(id: string, updates: object): Promise<void>`
- `deleteLog(id: string): Promise<void>`
- `countLogs(filter: object): Promise<number>`

### ConsoleLogger

The `ConsoleLogger` class is used for logging events to the console.

#### Constructor

```typescript
new ConsoleLogger(isEnabled: boolean)
```

- **isEnabled**: Boolean indicating whether console logging is enabled.

#### Methods

- `getIsEnabled(): boolean`
- `logEventToConsole(log: AuditLog): void`
- `colorize(message: string, color: Color): string`

### Available Log Levels

- **LogLevel.INFO**
- **LogLevel.WARN**
- **LogLevel.ERROR**
- **LogLevel.DEBUG**
- **LogLevel.CUSTOM**

### Viewing Logs

You can use the `LogViewer` class to fetch and display logs from any storage implementation. Here’s an example:

```typescript
import { LogViewer, ConsoleLogger } from 'audit-pro';

const consoleLogger = new ConsoleLogger(true); // Enable colorized console logging

// Assuming you have configured one or more storages
const logViewer = new LogViewer([storage], consoleLogger);

// View logs based on filters (e.g., userId)
logViewer.viewLogs({ userId: 'user123' });
```

## Customizing Console Logs

Audit-Pro allows you to customize the console output with different colors:

```typescript
import { ConsoleLogger } from 'audit-pro';

// Enable colorized logs
const consoleLogger = new ConsoleLogger(true);

// Log events to the console
consoleLogger.logEventToConsole({
    id: 'unique-log-id',
    userId: 'user123',
    action: 'User Login',
    logLevel: LogLevel.INFO,
    timestamp: new Date(),
    metadata: { ipAddress: '192.168.1.1' },
});
```

## Examples

Here’s a simple example of how to use **Audit Pro** in an Express.js application.

```typescript
import express from 'express';
import { AuditLogger, ConsoleLogger, SequelizeStorage } from 'audit-pro';
import { Sequelize } from 'sequelize';

const app = express();
const sequelizeInstance = new Sequelize('mysql://user:password@localhost:3306/audit', {
  logging: false,
});
const storage = new SequelizeStorage(sequelizeInstance, 'AuditLogs', {});
const logger = new ConsoleLogger(true);
const auditLogger = new AuditLogger(storage, logger);

app.post('/login', async (req, res) => {
  // Simulating a login action
  const log: AuditLog = {
    id: 'unique-log-id',
    userId: req.body.userId,
    action: 'User Login',
    logLevel: LogLevel.INFO,
    timestamp: new Date(),
    metadata: { ipAddress: req.ip },
  };

  await auditLogger.logEvent(log);
  res.send('Login logged!');
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
```

## Testing

To run the tests for **Audit Pro**, ensure you have Jest installed. Run the following command:

```bash
npm test
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

