import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes
  from "./routes/authRoutes.js";

dotenv.config();

const app =
  express();

app.use(express.json());

app.use(
  cors({
    origin:
      "http://localhost:5173",
  })
);

app.use(
  "/api/auth",
  authRoutes
);

app.listen(
  3000,
  () => {
    console.log(
      "Server Running"
    );
  }
);