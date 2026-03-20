#!/usr/bin/env node

import fs from "node:fs";
import { createReadStream } from "node:fs";
import { Transform, Writable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { printStatus, progressBar } from "./src/utility.ts";

let lineCount = 0;
const totalSize = fs.statSync("./moee.log").size;
let startTime: number;
let totalBytes = 0;
let speed: number;
const matchLines = [];

const readableStream = createReadStream("./moee.log");

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

const filterStream = (searchTerm: string) => {
    return new Transform({
        objectMode: true,
        transform(line, encoding, cb) {
            if ((line as string).includes(searchTerm)) {
                this.push(line.split(searchTerm).join(`\x1b[1m\x1b[31m${searchTerm}\x1b[0m`));
            }
            cb();
        },
    });
};

const collector = new Writable({
    objectMode: true,
    write(line, encoding, cb) {
        lineCount++;
        matchLines.push(line);
        cb();
    },
});

const processFile = async () => {
    try {
        startTime = Date.now();
        await pipeline(readableStream, tracker, lineParser(), filterStream("WARN"), collector);
        printStatus(matchLines, startTime, speed, lineCount);
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

processFile();
