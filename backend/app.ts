import "./env-bootstrap.js";
import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import analyseRoutes from "./routes/analyseRoutes.js";
import assignmentsRoute from "./routes/assignmentsRoute.js";
import authRoute from "./routes/authRoute.js";
import meRoute from "./routes/meRoute.js";
import usersRoutes from "./routes/usersRoutes.js";
import { env } from "./config/env.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = [
  "http://localhost:5173",
  "https://projet-lab-tech-38dy.vercel.app",
  env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
  })
);

app.use("/analyse", analyseRoutes);
app.use("/assignments", assignmentsRoute);
app.use("/auth", authRoute);
app.use("/users", usersRoutes);
app.use("/", meRoute);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("SERVER ERROR:", err);
  res.status(500).json({ error: "Erreur serveur", details: err.message });
});

app.listen(env.PORT, () => {
  console.log("Server running on port", env.PORT);
});
