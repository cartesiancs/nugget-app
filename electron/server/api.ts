import { Router, Response, Request } from "express";

const router = Router();

router.get("/test", async function (req: Request, res: Response) {
  res.status(200).send({
    test: true,
  });
});

export default router;
