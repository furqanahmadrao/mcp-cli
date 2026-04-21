/**
 * Output formatters for JSON and logging
 */

import chalk from "chalk";

let verboseMode = false;

export function setVerboseMode(verbose: boolean): void {
    verboseMode = verbose;
}

export function isVerbose(): boolean {
    return verboseMode;
}

/**
 * Output JSON to stdout (always clean)
 */
export function outputJSON(data: unknown): void {
    console.log(JSON.stringify(data, null, 2));
}

/**
 * Log to stderr (only in verbose mode)
 */
export function log(message: string): void {
    if (verboseMode) {
        console.error(chalk.dim(`[mcpcli] ${message}`));
    }
}

export function logInfo(message: string): void {
    if (verboseMode) {
        console.error(chalk.cyan(`ℹ ${message}`));
    }
}

export function logWarn(message: string): void {
    if (verboseMode) {
        console.error(chalk.yellow(`⚠ ${message}`));
    }
}

export function logError(message: string): void {
    if (verboseMode) {
        console.error(chalk.red(`✖ ${message}`));
    }
}

export function logSuccess(message: string): void {
    if (verboseMode) {
        console.error(chalk.green(`✓ ${message}`));
    }
}

export function logDebug(label: string, data: unknown): void {
    if (verboseMode) {
        console.error(chalk.gray(`[DEBUG] ${label}:`), JSON.stringify(data));
    }
}
