import { Request, Response } from "express";
import { getSqlPool } from "../utils/db";
import router from "../routes/auth";

interface TotalRecord {
  totalRecord: number;
}

router.get("/get", async (req: Request, res: Response) => {
  const pool = await getSqlPool();
  const restotal = await pool
    .request()
    .query(`SELECT COUNT(postId) AS totalRecord FROM posts`);
  const record = restotal.recordset[0];
  const obj: TotalRecord = record;
  const recordCount: number = obj.totalRecord;

  if (!record) {
    return res.status(400).send({ error: "Invalid credentials" });
  }

  res.send({ TestApi: "success", status: true, totalRecord: recordCount });
});

module.exports = router;
