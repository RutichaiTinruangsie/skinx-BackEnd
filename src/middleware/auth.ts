// import { Request, Response, NextFunction } from "express";
// import jwt from "jsonwebtoken";

// const auth = (req: Request, res: Response, next: NextFunction) => {
//   const token = req.header("Authorization")?.replace("Bearer ", "");
//   console.log(token);
//   const data = token?.split(":");
//   const accessToken = data[1];
//   const user = data[0];

//   console.log(data);
//   if (!token) {
//     return res.status(401).send({ error: "Access denied, no token provided." });
//   }
//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
//     (req as any).user = decoded;
//     next();
//   } catch (ex) {
//     res.status(400).send({ error: "Invalid token." });
//     console.log(ex);
//   }
// };

// export default auth;

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const auth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).send({ error: "Access denied, no token provided." });
  }

  const data = token.split(":");
  if (data.length !== 2) {
    return res.status(400).send({ error: "Invalid token format." });
  }

  const user = data[0];
  const accessToken = data[1];

  try {
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET as string);
    (req as any).user = decoded;
    next();
  } catch (ex) {
    res.status(400).send({ error: "Invalid token." });
  }
};

export default auth;
