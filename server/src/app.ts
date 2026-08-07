import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { errorHandler } from "./middleware/error.js";
import { apiLimiter } from "./middleware/rateLimiter.js";
import routes from "./routes/index.js";

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: false,
}));

app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(apiLimiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  logger.info(`[HTTP] ${req.method} ${req.originalUrl}`);
  next();
});

app.use("/api", routes);

app.get("/", (req, res) => {
  res.json({ message: "TimeForge Full-Stack API is active!" });
});

app.use(errorHandler);

const PORT = env.PORT;
app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
});

export default app;
