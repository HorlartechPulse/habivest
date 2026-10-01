import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import routes from "./routes/index.js";

const app = express();
const PORT = Number(process.env.PORT) || 4600;

app.use(helmet());
app.use(
  cors({
    origin: [process.env.FRONTEND_URL || "http://localhost:3000"],
    credentials: true,
  })
);
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));
app.use(express.json({ limit: "1mb" }));
app.use("/api/v1", routes);
app.use((_req, res) => res.status(404).json({ success: false, message: "Not found" }));
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("[habivest]", err);
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === "development" ? err.message : "Server error",
    });
  }
);

app.listen(PORT, () => {
  console.log(`
  🏠 Habivest API
  ➜ http://localhost:${PORT}/api/v1
  ➜ Portfolio property platform — fictional data · mock payments
  `);
});

export default app;
