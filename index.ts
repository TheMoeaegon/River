#!/usr/bin/env node

import fs from "node:fs";
import { createReadStream } from "node:fs";
import { Transform, Writable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { progressBar } from "./src/utility.ts";

let lineCount = 0;
const totalSize = fs.statSync("./app.log").size;
const startTime = Date.now();
let totalBytes = 0;
const matchLines = [];

const readableStream = createReadStream("./app.log");

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
        const speed = totalBytes / elapsed;
        const remaining = totalSize - totalBytes;
        const eta = remaining / speed;
        const bar = progressBar(totalBytes, totalSize);

        process.stderr.write("\r\x1b[2K");
        process.stderr.write(
            `${bar} | ${(speed / (1024 * 1024)).toFixed(1)} MB/s | ETA: ${eta.toFixed(1)}s`,
        );
        cb(null, chunk);
    },
});

const filterStream = (searchTerm: string) => {
    return new Transform({
        objectMode: true,
        transform(line, encoding, cb) {
            if ((line as string).includes(searchTerm)) {
                this.push(line);
            }
            cb();
        },
    });
};

const drain = new Writable({
    objectMode: true,
    write(line, encoding, cb) {
        lineCount++;
        matchLines.push(line);
        cb();
    },
});

const processFile = async () => {
    try {
        console.log("reading the file");

        await pipeline(
            readableStream,
            tracker,
            lineParser(),
            filterStream("WARN"),
            drain,
        );
        process.stdout.write("\n");
        process.stdout.write(matchLines.join("\n") + "\n");
    } catch (error) {
        console.error(error);
    }
};

processFile();
