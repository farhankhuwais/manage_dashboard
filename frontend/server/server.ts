import express from "express";
import authRoutes from "./routes/auth";
import membersRoutes from "./routes/members";
import duesRoutes from "./routes/dues";
import usersRoutes from "./routes/users";
import { authenticateToken } from "./middleware/authMiddleware";

const app = express();
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "OK" });
});

app.use("/api/auth", authRoutes);
app.use("/api/members", authenticateToken, membersRoutes);
app.use("/api/dues", authenticateToken, duesRoutes);
app.use("/api/users", authenticateToken, usersRoutes);

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
