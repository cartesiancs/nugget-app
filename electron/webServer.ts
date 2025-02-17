import http from "http";
import express from "express";
import path from "path";

export function runServer() {
  const staticDir = path.join(__dirname, "../app");

  const expressApp = express();

  expressApp.use(express.static(staticDir));

  expressApp.get("*", (req, res) => {
    res.sendFile(path.join(staticDir, "index.html"));
  });

  expressApp.listen(9825, () => {
    console.log("Static server running at http://localhost:9825");
  });
}
