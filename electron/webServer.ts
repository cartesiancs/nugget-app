import http from "http";
import express from "express";
import path from "path";
import api from "./server/api";
import bodyParser from "body-parser";

export function runServer() {
  const staticDir = path.join(__dirname, "../app");

  const app = express();

  app.set("trust proxy", 1);
  app.disable("x-powered-by");

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  app.use("/api", api);
  app.use(express.static(staticDir));

  app.get("/", (req, res) => {
    res.sendFile(path.join(staticDir, "index.html"));
  });

  app.listen(9825, () => {
    console.log("Static server running at http://localhost:9825");
  });
}
