import bodyParser from "body-parser";
import { sqlConnect } from "../src/utils/db";
import cors from "cors";
import auth from "./middleware/auth";
import express, { Request, Response } from "express";
import fs from "fs/promises";
import { getSqlPool } from "../src/utils/db";

const app = express();
const PORT = process.env.PORT!;

app.use(cors());

let clients: Response[] = [];

// Endpoint สำหรับ SSE connections
app.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  clients.push(res);

  req.on("close", () => {
    clients = clients.filter((client) => client !== res);
  });
});

const sendEvent = (message: string) => {
  clients.forEach((client) => client.write(`data: ${message}\n\n`));
};

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    limit: "50mb",
    extended: true,
    parameterLimit: 50000,
  })
);

const url = "/api";

app.use(url + "/user", require("./routes/User"));
app.use(url + "/posts", auth, require("./routes/Post"));
app.use(url + "/test", require("../src/testapi/Testapi"));

const BATCH_SIZE = 500; // เพิ่มขนาด batch เพื่อให้เร็วขึ้น
const CONCURRENT_BATCHES = 1; // จำนวน batch ที่ทำงานพร้อมกัน

app.get("/insert", async (req: Request, res: Response) => {
  interface Post {
    id: number;
    title: string;
    content: string;
    postedAt: string;
    postedBy: string;
    tags: string[];
  }

  try {
    const pool = await getSqlPool();

    const dataJson = await fs.readFile("post.json", "utf8");
    const posts: Post[] = JSON.parse(dataJson);
    const totalPosts = posts.length;

    if (totalPosts > 0) {
      await pool.request().query("DELETE FROM posts");
      await pool.request().query("DELETE FROM tags");

      const insertBatch = async (batch: Post[], startIndex: number) => {
        const postPromises = batch.map((post, index) => {
          const postID = startIndex + index + 1;
          return pool
            .request()
            .input("postID", postID)
            .input("title", post.title)
            .input("content", post.content)
            .input("postedAt", post.postedAt)
            .input("postedBy", post.postedBy)
            .query(
              "INSERT INTO posts (postID, title, [content], postedAt, postedBy) VALUES (@postId, @title, @content, @postedAt, @postedBy)"
            )
            .then(() => {
              const tagPromises = post.tags.map((tag) => {
                return pool
                  .request()
                  .input("postID", postID)
                  .input("postedBy", post.postedBy)
                  .input("tagsname", tag)
                  .query(
                    "INSERT INTO tags (postID, postedBy, tagsname) VALUES (@postId, @postedBy, @tagsname)"
                  );
              });
              return Promise.all(tagPromises);
            })
            .then(() => {
              sendEvent(
                `{"message": "ข้อความ #${postID}", "totalPosts": ${totalPosts}}`
              );
            })
            .catch((err) => {
              console.log(
                `เกิดข้อผิดพลาดในการเพิ่มข้อมูลโพสต์ #${postID}`,
                err
              );
            });
        });

        await Promise.all(postPromises);
      };

      const batchPromises = [];
      for (let i = 0; i < totalPosts; i += BATCH_SIZE) {
        const batch = posts.slice(i, i + BATCH_SIZE);
        batchPromises.push(insertBatch(batch, i));

        if (batchPromises.length >= CONCURRENT_BATCHES) {
          await Promise.all(batchPromises);
          batchPromises.length = 0;
        }
      }

      if (batchPromises.length > 0) {
        await Promise.all(batchPromises);
      }
    }

    res
      .status(201)
      .send({ status: true, message: "เพิ่มข้อมูล seed จาก post.json สำเร็จ" });
  } catch (err) {
    console.error("เกิดข้อผิดพลาดในฐานข้อมูล", err);
    res.status(500).send({ error: "เกิดข้อผิดพลาดในฐานข้อมูล" });
  }
});

sqlConnect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to database:", err);
  });
