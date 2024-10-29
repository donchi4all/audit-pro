import { LogLevel } from "../LogLevel";
import { MongoStorage } from "../storage/MongoStorage";

const mongoConnectionString = 'mongodb://localhost:27017/your-database-name';
const tableName = 'AuditLogs';
const dynamicColumns = {
    additionalInfo: { type: String, required: false },
};

const mongoStorage = new MongoStorage(mongoConnectionString, tableName, dynamicColumns);

// Example of logging an event
const logEvent = {
    userId: 'user123',
    action: 'User Login',
    logLevel: LogLevel.INFO,
    timestamp: new Date(),
    metadata: { ipAddress: '192.168.1.1' },
    additionalInfo: 'Additional Information successfully1'
};

// Log event
mongoStorage.logEvent(logEvent)
    .then(() => {
        // Fetch all logs
        return mongoStorage.fetchAllLogs();
    })
    .then(logs => {
        console.log('Fetched all logs:', logs);

        // Count logs for userId 'user123'
        return mongoStorage.countLogs({ userId: 'user123' });
    })
    .then(count => {
        console.log('Total logs for user123:', count);

        // Example of deleting a log (assuming you have an ID)
        const logIdToDelete = '67104b9e67685462b8cb6e15'; // Replace with actual log ID
        return mongoStorage.deleteLog(logIdToDelete);
    })
    .then(() => {
        console.log('Log deleted successfully');
    })
    .catch(err => {
        console.error('Error:', err);
    });


// Now you can use the model directly
async function runStorageOperations() {
    // Access the model instance
    const auditLogModel = mongoStorage.getModelInstance();
    const logs = await auditLogModel.find({ userId: 'user123' }).exec();
    console.log(logs);
}

runStorageOperations();