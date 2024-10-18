import { LogLevel } from './LogLevel';
import { AuditLog } from './interfaces';
import kleur from 'kleur'; // Import kleur directly

// Define an enum for supported color names
export enum Color {
    BLACK = 'black',
    RED = 'red',
    GREEN = 'green',
    YELLOW = 'yellow',
    BLUE = 'blue',
    MAGENTA = 'magenta',
    CYAN = 'cyan',
    WHITE = 'white',
    GRAY = 'gray',
}

type ColumnConfig = {
    label: string; // The label to display
    color: Color; // Optional color for this column using the enum
};

export class ConsoleLogger {
    private isEnabled: boolean;
    private columns: { [key in LogLevel]: ColumnConfig };
    private defaultColumns: { [key in LogLevel]: ColumnConfig }; // Changed from string index to LogLevel index

    constructor(isEnabled: boolean, customColumns?: { [key in LogLevel]?: ColumnConfig }) {
        this.isEnabled = isEnabled;

        // Define default columns and colors
        this.defaultColumns = {
            [LogLevel.INFO]: { label: 'Info', color: Color.CYAN },
            [LogLevel.WARN]: { label: 'Warning', color: Color.YELLOW },
            [LogLevel.ERROR]: { label: 'Error', color: Color.RED },
            [LogLevel.DEBUG]: { label: 'Debug', color: Color.MAGENTA },
            [LogLevel.CUSTOM]: { label: 'Custom', color: Color.GREEN },
        };

        // Use custom columns if provided, otherwise fall back to default
        this.columns = { ...this.defaultColumns, ...customColumns };
    }

    // Function to colorize text based on color name
    private colorize(text: string, color: Color): string {
        return kleur[color](text); // Use kleur for coloring
    }

    public logEventToConsole(event: AuditLog): void {
        if (!this.isEnabled) return;

        const logLevelConfig = this.columns[event.logLevel] || this.defaultColumns[event.logLevel];

        // Use an array to construct the log message
        const logParts: string[] = [];

        // Start constructing the log message
        logParts.push(this.colorize(`[${event.logLevel}]`, logLevelConfig.color || Color.WHITE));
        logParts.push(this.colorize(`[${new Date().toISOString()}]`, Color.GRAY));
        logParts.push(this.colorize(event.action, Color.CYAN));

        // Dynamically include properties
        const propertiesToLog: string[] = [];

        // Iterate through all properties of the event
        for (const [key, value] of Object.entries(event)) {
            if (key !== 'action' && key !== 'logLevel' && value !== undefined) {
                propertiesToLog.push(`${this.colorize(`${key.charAt(0).toUpperCase() + key.slice(1)}:`, Color.YELLOW)} ${JSON.stringify(value)}`);
            }
        }

        // Join properties and add them to the log message
        if (propertiesToLog.length > 0) {
            logParts.push(`| ${propertiesToLog.join(' | ')}`);
        }

        // Log the final message
        console.log(logParts.join(' '));
    }

    public getIsEnabled(): boolean {
        return this.isEnabled;
    }

}
