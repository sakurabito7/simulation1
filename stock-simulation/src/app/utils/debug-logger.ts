export class DebugLogger {
  private static logs: string[] = [];

  static log(message: string): void {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] ${message}`;
    this.logs.push(logLine);
    console.log(logLine);
  }

  static downloadLogs(filename: string = 'debug-log.txt'): void {
    const content = this.logs.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  static clear(): void {
    this.logs = [];
  }

  static getLogs(): string {
    return this.logs.join('\n');
  }
}
