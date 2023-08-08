"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const path = require('path');
const commander = require('commander');
const viewer = require('../lib/viewer.js');
const program = commander
    .usage(`<bundleStatsFile> [bundleDir] [options]
    
      Arguments:
    
        bundleStatsFile  Path to Webpack Stats JSON file.
        bundleDir        Directory containing all generated bundles.
                         You should provided it if you want analyzer to show you the real parsed module sizes.
                         By default a directory of stats file is used.`)
    .option("-m, --mode <mode>", "Analyzer mode. Should be `server`,`static` or `json`.\n" +
    "In `server` mode analyzer will start HTTP server to show bundle report.\n"
    +
        "In `static` mode single HTML file with bundle report will be generated.\n"
    +
        "In `json` mode single JSON file with bundle report will be generated.\n", "static")
    .option('-l, --level <level>')
    .parse(process.argv);
let [bundleStatsFile, bundleDir] = program.args;
let { mode, open: openBrowser, title: reportTitle, level, } = program.opts();
bundleStatsFile = path.resolve(bundleStatsFile);
bundleStatsFile = path.join(bundleStatsFile, "package.json");
parseAndAnalyse(bundleStatsFile);
function parseAndAnalyse(bundleStatsFile) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const bundleStats = require(bundleStatsFile);
            if (mode === 'server') {
                viewer.startServer({ bundleStats, bundleStatsFile, level });
            }
            else if (mode === 'static') {
            }
        }
        catch (err) {
            console.log('代码报错，强制退出，出错原因为：', err);
            process.exit(1);
        }
    });
}
module.exports = {};
