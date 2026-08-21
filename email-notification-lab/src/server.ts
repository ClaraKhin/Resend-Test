import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { Resend } from "resend";

dotenv.config();

const app = express();
app.use(express.json());

const resend = new Resend(process.env.RESEND_API_KEY || "");

app.get("/", (req: Request, res: Response) => {
  res.json({ status: "ok", message: "Server is running" });
});

app.post("/test-email", async (req: Request, res: Response) => {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      res.status(500).json({
        status: "error",
        message: "RESEND_API_KEY is not configured",
      });
      return;
    }

    const { data, error } = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "delivered@resend.dev",
      subject: "Hello from Email Notification Lab",
      html: "<p>This email was sent using Resend.</p>",
    });

    if (error) {
      res.status(error.statusCode ?? 400).json({
        status: "error",
        message: error.message,
      });
      return;
    }

    res.status(200).json({
      status: "ok",
      message: "Test email sent",
      id: data?.id,
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({
      status: "error",
      message: err.message || "Unexpected error",
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
