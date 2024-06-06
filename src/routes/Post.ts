import { Request, Response } from "express";
import { getSqlPool } from "../utils/db";
import router from "./auth";
interface TotalRecord {
  totalRecord: number;
}

router.post("/get", async (req: Request, res: Response) => {
  console.log("Fetch Data Posts");
  const { offset, limit, search, section } = req.body;

  if (
    offset === undefined ||
    limit === undefined ||
    search === undefined ||
    section === undefined
  ) {
    return res.status(400).send({
      status: false,
      message: "Offset, Limit, Search and section are required",
    });
  }

  let sqlWhere: string = "";
  if (search !== "") {
    switch (section) {
      case "ID":
        sqlWhere = `WHERE postId LIKE '${search}%'`;
        break;
      case "Title":
        sqlWhere = `WHERE title LIKE '%${search}%'`;
        break;
      case "Content":
        sqlWhere = `WHERE content LIKE '%${search}%'`;
        break;
      case "Tags":
        sqlWhere = `WHERE postId IN (SELECT postId FROM tags WHERE tagsName LIKE '%${search}%')`;
        break;
      default:
        break;
    }
  }

  try {
    const pool = await getSqlPool();
    const result = await pool
      .request()
      .input("offset", offset)
      .input("limit", limit)
      .input("search", search)
      .query(
        `SELECT postId, title, [content], postedBy, postedAt FROM posts ${sqlWhere} ORDER BY postId OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`
      );

    const data = result.recordset;
    const restotal = await pool
      .request()
      .query(`SELECT COUNT(postId) AS totalRecord FROM posts`);
    const record = restotal.recordset[0];
    const obj: TotalRecord = record;
    const recordCount: number = obj.totalRecord;

    if (!data) {
      return res.status(400).send({ error: "Invalid credentials" });
    }

    res.send({ status: true, data: data, totalRecord: recordCount });
  } catch (err) {
    console.error(err);
    res.status(500).send({ status: false, message: "Server error" });
  }
});

router.post("/tags", async (req: Request, res: Response) => {
  const { postId } = req.body;

  if (postId === undefined) {
    return res
      .status(400)
      .send({ status: false, message: "postId is required" });
  }

  const pool = await getSqlPool();
  const result = await pool
    .request()
    .input("postId", postId)
    .query(`SELECT * FROM tags WHERE postId = @postId`);
  const data = result.recordset;

  if (!data) {
    return res.status(400).send({ error: "Invalid credentials" });
  }

  res.send({ status: true, data: data });
});

module.exports = router;
