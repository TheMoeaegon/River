import type { Argv } from "./types.ts";

export const progressBar = (current: number, total: number, width: number = 60): string => {
    const percent = current / total;
    const filled = Math.floor(percent * width);
    const empty = width - filled;

    const bar = "#".repeat(filled) + "-".repeat(empty);
    return `[${bar}] ${(percent * 100).toFixed(1)}%`;
};

export const printStatus = (
    matchLines: string[],
    startTime: number,
    speed: number,
    lineCount: number,
    output: string,
) => {
    if (matchLines.length > 1) {
        process.stdout.write("\n");
        process.stdout.write(matchLines.join("\n") + "\n");
    }
    process.stdout.write(
        `\n✅ done in ${((Date.now() - startTime) / 1000).toFixed(2)}s | ${(speed / (1024 * 1024)).toFixed(1)} MB/s | \x1b[1m\x1b[31m${lineCount}\x1b[0m matches\n`,
    );
};
