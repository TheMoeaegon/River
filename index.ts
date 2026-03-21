#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { processFile } from "./src/fileProcessing.ts";

const argv = yargs(hideBin(process.argv))
    .usage("Usage: river <terms...> -f <file> [options]")
    .example("river ERROR -f app.log", "find all ERROR lines in app.log")
    .example("river WARN ERROR -f app.log", "find WARN and ERROR lines")
    .example("river ERROR -f app.log -o errors.log", "write results to file")
    .option("output", {
        alias: "o",
        type: "string",
        describe: "Path to output file",
    })
    .command(
        "$0 <terms...>",
        "Search for terms in file",
        (yargs) =>
            yargs
                .positional("terms", {
                    describe: "One or more terms to search for",
                    type: "string",
                })
                .option("file", {
                    alias: "f",
                    type: "string",
                    describe: "The filename to search within",
                    demandOption: "You must provide a file with -f",
                }),
        (argv) => {
            processFile({ file: argv.file, output: argv.output, terms: [...argv.terms] });
        },
    )
    .epilog("River — a fast file search tool")
    .parse();
