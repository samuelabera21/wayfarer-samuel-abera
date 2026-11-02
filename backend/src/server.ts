import express from "express";
import cors from "cors";

const app = express();

app.use(cors({
    origin: "http://localhost:3000"
}));

app.use(express.json());

app.get("/api/health", (_req, res) => {
    res.json({
        status: "ok",
        message: "Wayfarer API is running"
    });
});

const PORT = 4000;

app.listen(PORT, () => {
    console.log(`Wayfarer API running on port ${PORT}`);
});