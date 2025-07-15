import { Router, Response, Request } from "express";
import { httpFilesystem } from "./controllers/filesystem";
import { httpFFmpeg } from "./controllers/ffmpeg";
import { httpRender } from "./controllers/render";
import { httpApp } from "./controllers/app";

const router = Router();

router.get("/test", async function (req: Request, res: Response) {
  res.status(200).send({
    test: true,
  });
});

router.get("/directory", (req: Request, res: Response) => {
  httpFilesystem.getDirectory(req, res);
});
router.get("/file", (req: Request, res: Response) => {
  httpFilesystem.getFile(req, res);
});
router.get("/file/metadata", (req: Request, res: Response) => {
  httpFFmpeg.getMetadata(req, res);
});

router.post("/render", (req: Request, res: Response) => {
  httpRender.start(req, res);
});

router.get("/path/temp", (req: Request, res: Response) => {
  httpApp.getTempPath(req, res);
});



export default router;
