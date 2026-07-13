import express from "express";
import authRouter from "./routes/auth";
import membersRouter from "./routes/members";
import duesRouter from "./routes/dues";
import { authenticateToken } from "./middleware/authMiddleware";

const app = express();
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "OK" });
});

app.use("/api/auth", authRouter);
app.use("/api/members", authenticateToken, membersRouter);
app.use("/api/dues", authenticateToken, duesRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
