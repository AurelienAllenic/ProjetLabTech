import express, { type Request, type Response, type NextFunction } from "express";
import dotenv from "dotenv";
import cors from "cors";
import analyseSammaryRoute from "./routes/analyseSammaryRoute.js";
import authRoute from "./routes/authRoute.js";
import usersRoute from "./routes/usersRoute.js";
import assignmentsRoute from "./routes/assignmentsRoute.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = [
  "http://localhost:5173",
  "https://projet-lab-tech-38dy.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("❌ Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "DELETE"],
  })
);

app.use("/analyse", analyseSammaryRoute);
app.use("/auth", authRoute);
app.use("/users", usersRoute);
app.use("/assignments", assignmentsRoute);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("SERVER ERROR:", err);
  res.status(500).json({ error: "Erreur serveur", details: err.message });
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
