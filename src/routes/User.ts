import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { getSqlPool } from "../utils/db";
import dotenv from "dotenv";
import router from "./auth";
dotenv.config();

export const register = async (req: Request, res: Response) => {
  const { userid, password } = req.body;
  try {
    const pool = await getSqlPool();
    const result = await pool
      .request()
      .input("userid", userid)
      .query("SELECT userid FROM users WHERE userid = @userid");

    if (result.recordset.length > 0) {
      return res.status(400).send({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool
      .request()
      .input("userid", userid)
      .input("password", hashedPassword)
      .query(
        "INSERT INTO Users (userid, password) VALUES (@userid, @password)"
      );

    res.status(201).send({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).send({ error: "Database error" });
  }
};

router.post("/login", async (req: Request, res: Response) => {
  const { userid, password } = req.body;
  try {
    const pool = await getSqlPool();
    const result = await pool
      .request()
      .input("userid", userid)
      .query("SELECT userid, password FROM users WHERE userid = @userid");
    const user = result.recordset[0];
    if (!user) {
      return res.status(400).send({ error: "Invalid credentials" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).send({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ userid: user.userid }, process.env.JWT_SECRET!, {
      expiresIn: "1h",
    });

    res.status(201).send({ status: true, token });
  } catch (err) {
    res.status(500).send({ error: "Database error" });
  }
});

module.exports = router;
