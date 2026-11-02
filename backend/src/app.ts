
import express from "express";
import cors from "cors";

const app = express();

app.use(
    cors({
        origin: "http://localhost:3000",
    })
);

app.use(express.json());

app.get("/api/health", (_req, res) => {
    res.status(200).json({
        status: "ok",
        message: "Wayfarer API is running",
    });
});

export default app;
