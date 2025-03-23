import fs from "fs";

import { isObject } from "lodash";

import { Config } from "./config";

interface LogStreamer {
  write(log: Log): Promise<void>;
}

export type LogLevel = "debug" | "info" | "warning" | "error";
type Log = {
  timestamp: Date;
  level: LogLevel;
  messages: string[];
};

export class Logger {
  private readonly streamers: LogStreamer[];

  constructor(
    private level: LogLevel,
    ...streamers: LogStreamer[]
  ) {
    this.streamers = streamers;
  }

  public debug(...messages: unknown[]): void {
    if (this.level !== "debug") {
      return;
    }

    this.log("debug", ...messages);
  }

  public info(...messages: unknown[]): void {
    if (["warning", "error"].includes(this.level)) {
      return;
    }

    this.log("info", ...messages);
  }

  public warning(...messages: unknown[]): void {
    if (this.level === "error") {
      return;
    }

    this.log("warning", ...messages);
  }

  public error(...messages: unknown[]): void {
    this.log("error", ...messages);
  }

  public setLevel(level: LogLevel): void {
    this.level = level;
  }

  public addStreamer(streamer: LogStreamer): void {
    this.streamers.push(streamer);
  }

  private log(level: LogLevel, ...messages: unknown[]): void {
    for (const streamer of this.streamers) {
      streamer.write({
        timestamp: new Date(),
        level,
        messages: this.formatMessages(messages),
      });
    }
  }

  private formatMessages(messages: unknown[]): string[] {
    const formattedMessages: string[] = [];

    for (const message of messages) {
      if (isObject(message)) {
        try {
          formattedMessages.push(JSON.stringify(message));
        } catch (err) {
          // this indicates the passed message is cyclic and can't be formatted nicely
          if (err instanceof TypeError) {
            formattedMessages.push(
              `${message.toString()} (could not format due to cyclic structure)`
            );
          } else {
            // unlikely scenario but log error that we couldn't format message
            this.error("Failed to format object messge", err);
          }
        }

        continue;
      }

      // if it isn't an object we can safely interpolate
      formattedMessages.push(`${message}`);
    }

    return formattedMessages;
  }
}

class ConsoleStreamer implements LogStreamer {
  private readonly RESET_COLOUR = "\x1b[0m";
  private readonly COLOURS = {
    debug: "\x1b[36m",
    info: "\x1b[32m",
    warning: "\x1b[33m",
    error: "\x1b[31m",
  };

  public async write(log: Log): Promise<void> {
    switch (log.level) {
      case "debug":
      case "info":
        // eslint-disable-next-line no-console
        console.log(this.formatLog(log));
        break;
      case "warning":
        console.warn(this.formatLog(log));
        break;
      case "error":
        console.error(this.formatLog(log));
        break;
    }
  }

  private formatLog(log: Log): string {
    return `[${log.timestamp.toISOString()}] ${this.COLOURS[log.level]}${log.level.toUpperCase().padStart(7)}: ${this.RESET_COLOUR}${log.messages.join("\t")}`;
  }
}

class FileStreamer implements LogStreamer {
  constructor(private readonly logPath: string) {
    if (!fs.existsSync(this.logPath)) {
      fs.writeFileSync(this.logPath, "");
    }
  }

  public async write(log: Log): Promise<void> {
    fs.appendFileSync(this.logPath, this.formatLog(log));
  }

  private formatLog(log: Log): string {
    return `[${log.timestamp.toISOString()}] ${log.level.toUpperCase()}: ${log.messages.join("\t")}\n`;
  }
}

export const resolveLogger = (config: Config) => {
  const streamers: LogStreamer[] = [new ConsoleStreamer()];

  if (config.LOG_FILE_PATH) {
    streamers.push(new FileStreamer(config.LOG_FILE_PATH));
  }

  return new Logger(config.LOG_LEVEL, ...streamers);
};
