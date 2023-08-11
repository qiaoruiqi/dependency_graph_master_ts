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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors = require("cors");
const path_1 = __importDefault(require("path"));
const { exec } = require('child_process');
const express = require("express");
const app = express();
const analyzer = require('../lib/analyze.js');
// 打开服务器
function startServer({ bundleStats, bundleStatsFile, level }) {
    const port = 3000;
    const port_ = 4000;
    console.log(__dirname);
    // const __dirname = 'C:\\Users\\rqqiao\\Desktop\\dependency\\dependency_graph_ts';
    app.use(cors());
    app.use(express.static('C:\\Users\\rqqiao\\Desktop\\dependency\\dependency_graph_ts\\build'));
    app.get("/search", (req, res) => __awaiter(this, void 0, void 0, function* () {
        const param1 = req.query.param1;
        try {
            const level_ = parseInt(level);
            const data = yield analyzer.getViewerData({ bundleStats, bundleStatsFile, param1, level_ });
            res.json(data);
        }
        catch (err) {
            debugger;
            // 错误处理
            res.status(500).json({ error: "Internal Server Error" });
        }
    }));
    // 打开默认浏览器并访问 React 应用
    exec(`start http://localhost:3000`);
    app.get('*', (req, res) => {
        res.sendFile(path_1.default.join(__dirname, 'build', 'index.html'));
    });
    app.listen(port, () => {
        console.log("服务器正在运行，端口：4000");
        // exec(`explorer http://localhost:${port_}`);
    });
}
module.exports = {
    startServer
};
