#!/usr/bin/env node

import fs from "node:fs";
import { createReadStream } from "node:fs";
import { Transform, Writable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { printStatus, progressBar } from "./utils.ts";
import type { Argv } from "./types.ts";

let lineCount = 0;
let totalSize: number;
let startTime: number;
let totalBytes = 0;
let speed: number;
const matchLines = [];

const readableStream = (filePath: string) => {
    return createReadStream(filePath);
};

const lineParser = (): Transform => {
    let leftOver = "";
    return new Transform({
        transform(chunk, encoding, cb) {
            let data = leftOver + chunk.toString();
            const lines = data.split("\n");
            leftOver = lines.pop();
            for (let line of lines) {
                this.push(line);
            }
            cb();
        },
        flush(cb) {
            if (leftOver) {
                this.push(leftOver);
            }
            cb();
        },
        readableObjectMode: true,
    });
};

const tracker = new Transform({
    transform(chunk, encoding, cb) {
        totalBytes += chunk.length;
        const elapsed = (Date.now() - startTime) / 1000;
        if (elapsed == 0) {
            return;
        }
        speed = totalBytes / elapsed;
        const remaining = totalSize - totalBytes;
        const eta = remaining / speed;
        const bar = progressBar(totalBytes, totalSize);

        process.stderr.write("\r\x1b[2K");
        process.stderr.write(`${bar} | ${(speed / (1024 * 1024)).toFixed(1)} MB/s | ETA: ${eta.toFixed(1)}s`);

        cb(null, chunk);
    },
});

const filterStream = (searchTerms: string[]) => {
    return new Transform({
        objectMode: true,
        transform(line, encoding, cb) {
            for (let word of searchTerms) {
                if ((line as string).toLowerCase().includes(word.toLowerCase())) {
                    lineCount++;
                    this.push(line + "\n");
                }
            }
            cb();
        },
    });
};

const terminalWriter = (searchTerms: string[]) => {
    return new Writable({
        objectMode: true,
        write(line, encoding, cb) {
            let formatted = line;

            for (const word of searchTerms) {
                const regex = new RegExp(word, "gi");
                formatted = formatted.replace(regex, (match: string) => {
                    return `\x1b[1m\x1b[31m${match}\x1b[0m`;
                });
            }

            matchLines.push(formatted.trim());
            cb();
        },
    });
};

const writeToFile = (filePath: string) => {
    return fs.createWriteStream(filePath, { flags: "a" });
};

export const processFile = async ({ file, output, terms }: Argv) => {
    try {
        startTime = Date.now();
        totalSize = fs.statSync(file).size;
        const writeableStream = output ? writeToFile(output) : terminalWriter(terms);
        await pipeline(readableStream(file), tracker, lineParser(), filterStream(terms), writeableStream);
        printStatus(matchLines, startTime, speed, lineCount, output);
    } catch (err: any) {
        //file not found
        if (err.code === "ENOENT") {
            process.stderr.write(`error: file not found — ${err.path}\n`);
            process.exit(1);
        }

        // permission denied
        if (err.code === "EACCES") {
            process.stderr.write(`error: permission denied — ${err.path}\n`);
            process.exit(1);
        }

        // anything else
        process.stderr.write(`error: ${err.message}\n`);
        process.exit(1);
    }
};
