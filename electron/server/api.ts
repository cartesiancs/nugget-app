import { Router, Response, Request } from "express";
import { httpFilesystem } from "./controllers/filesystem";
import { httpFFmpeg } from "./controllers/ffmpeg";
import { httpRender } from "./controllers/render";

const router = Router();

router.get("/test", async function (req: Request, res: Response) {
  res.status(200).send({
    test: true,
  });
});

router.get("/directory", httpFilesystem.getDirectory);
router.get("/file", httpFilesystem.getFile);
router.get("/file/metadata", httpFFmpeg.getMetadata);

router.post("/render", httpRender.start);

export default router;
