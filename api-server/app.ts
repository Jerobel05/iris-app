import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import router from "./routes";

const app: Express = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PYTHON_BACKEND = "http://localhost:8000";

async function forwardToPython(req: Request, res: Response) {
  try {
    const targetUrl = `${PYTHON_BACKEND}${req.originalUrl}`;
    const headers: Record<string, string> = { "Content-Type": "application/json" };

    const fetchOptions: RequestInit = {
      method: req.method,
      headers,
    };

    if (req.method !== "GET" && req.method !== "HEAD") {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, fetchOptions);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(502).json({ detail: "Backend Python inaccessible", error: String(err) });
  }
}

app.use("/api/gmail", forwardToPython);
app.use("/api/auth", forwardToPython);
app.use("/api/emails", forwardToPython);
app.use("/api/calendar", forwardToPython);

app.use("/api", router);

export default app;
