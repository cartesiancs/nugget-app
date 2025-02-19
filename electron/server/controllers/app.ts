import { app } from "electron";
import isDev from "electron-is-dev";
import { Router, Response, Request } from "express";

export const httpApp = {
  getTempPath: async function (req: Request, res: Response) {
    const path = app.getPath("temp");

    res.status(200).send({
      status: 1,
      path: path,
    });
  },
};
