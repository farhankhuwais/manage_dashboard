"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("./routes/auth"));
const members_1 = __importDefault(require("./routes/members"));
const dues_1 = __importDefault(require("./routes/dues"));
const users_1 = __importDefault(require("./routes/users"));
const authMiddleware_1 = require("./middleware/authMiddleware");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.get("/api/health", (req, res) => {
    res.json({ status: "OK" });
});
app.use("/api/auth", auth_1.default);
app.use("/api/members", authMiddleware_1.authenticateToken, members_1.default);
app.use("/api/dues", authMiddleware_1.authenticateToken, dues_1.default);
app.use("/api/users", authMiddleware_1.authenticateToken, users_1.default);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
exports.default = app;
//# sourceMappingURL=server.js.map