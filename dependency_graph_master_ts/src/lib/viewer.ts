const cors = require("cors");
import path from 'path';
const { exec } = require('child_process');
const express = require("express");
const app = express();
const analyzer = require('../lib/analyze.js');

interface paramProps {
  bundleStats:object,
  bundleStatsFile:string,
  level:string
}

// 打开服务器
function startServer({bundleStats, bundleStatsFile, level}:paramProps) {
  const port = 3000;
  const port_ = 4000;
  console.log(__dirname)
  // const __dirname = 'C:\\Users\\rqqiao\\Desktop\\dependency\\dependency_graph_ts';
  app.use(cors());
  app.use(express.static('C:\\Users\\rqqiao\\Desktop\\dependency\\dependency_graph_ts\\build'));

  app.get("/search", async (req:any, res:any) => {
    const param1 = req.query.param1;
    try {
      const level_ = parseInt(level);
      const data = await analyzer.getViewerData({bundleStats, bundleStatsFile, param1, level_});
      res.json(data);
    } catch (err) {
      debugger;
      // 错误处理
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
  // 打开默认浏览器并访问 React 应用
  exec(`start http://localhost:3000`);
  
  app.get('*', (req:any, res:any) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });

  app.listen(port, () => {
    console.log("服务器正在运行，端口：4000");
    // exec(`explorer http://localhost:${port_}`);
  });
}

module.exports = {
  startServer
};