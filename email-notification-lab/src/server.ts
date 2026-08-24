import "dotenv/config";

import express, { Request, Response } from "express";
import cors from "cors";
import session from "express-session";
import { Resend } from "resend";
import { startVM, stopVM } from "./services/vm.service";
import { sendVMNotification } from "./services/notification.service";
import { signUp, login, getUserById } from "./services/auth.service";
import { supabase } from "./db";

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

const resend = new Resend(process.env.RESEND_API_KEY || "");

app.get("/", (req: Request, res: Response) => {
  res.json({ status: "ok", message: "Server is running" });
});

app.post("/auth/signup", async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      res.status(400).json({
        success: false,
        message: "Email, password, and name are required",
      });
      return;
    }

    const user = await signUp(email, password, name);
    req.session.userId = user.id;
    res.status(201).json({ success: true, user });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message || "Unexpected error",
    });
  }
});

app.post("/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
      return;
    }

    const user = await login(email, password);
    req.session.userId = user.id;
    res.status(200).json({ success: true, user });
  } catch (err: any) {
    console.error(err);
    res.status(401).json({
      success: false,
      message: err.message || "Invalid credentials",
    });
  }
});

app.get("/auth/me", async (req: Request, res: Response) => {
  try {
    if (!req.session.userId) {
      res.status(401).json({ success: false, message: "Not logged in" });
      return;
    }

    const user = await getUserById(req.session.userId);
    if (!user) {
      res.status(401).json({ success: false, message: "User not found" });
      return;
    }

    res.status(200).json({ success: true, user });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message || "Unexpected error",
    });
  }
});

app.post("/auth/logout", (req: Request, res: Response) => {
  req.session.destroy(() => {
    res.status(200).json({ success: true, message: "Logged out" });
  });
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

app.post("/vms/:id/start", async (req: Request, res: Response) => {
  try {
    const vm = startVM(req.params.id);
    const to = req.body?.to;
    const userName = req.body?.userName;
    const userId = req.session?.userId ?? Number(req.body?.userId) ?? 1;

    const notification = to
      ? await sendVMNotification({
          to,
          userName,
          userId,
          vmName: vm.name,
          status: vm.status,
          type: "started",
        })
      : { success: false, message: "No recipient email provided" };

    res.status(200).json({ success: true, vm, notification });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message || "Unexpected error",
    });
  }
});

app.post("/vms/:id/stop", async (req: Request, res: Response) => {
  try {
    const vm = stopVM(req.params.id);
    const to = req.body?.to;
    const userName = req.body?.userName;
    const userId = req.session?.userId ?? Number(req.body?.userId) ?? 1;

    const notification = to
      ? await sendVMNotification({
          to,
          userName,
          userId,
          vmName: vm.name,
          status: vm.status,
          type: "stopped",
        })
      : { success: false, message: "No recipient email provided" };

    res.status(200).json({ success: true, vm, notification });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message || "Unexpected error",
    });
  }
});

app.get("/notifications", async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from("email_notifications")
      .select("*")
      .order("id", { ascending: false })
      .limit(50);

    if (error) {
      res.status(500).json({ status: "error", message: error.message });
      return;
    }

    res.status(200).json({ status: "ok", data });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ status: "error", message: err.message });
  }
});

app.post("/webhooks/resend", async (req: Request, res: Response) => {
  try {
    const eventType = req.body?.type || "unknown";
    const emailId = req.body?.data?.email_id || null;
    const payload = req.body || {};

    if (emailId) {
      const status = mapResendEventToStatus(eventType);

      const { error: insertError } = await supabase
        .from("webhook_events")
        .insert({
          resend_email_id: emailId,
          event_type: eventType,
          payload,
        });

      if (insertError) {
        console.error("webhook insert error", insertError);
      }

      const { error: updateError } = await supabase
        .from("email_notifications")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("resend_email_id", emailId);

      if (updateError) {
        console.error("webhook update error", updateError);
      }
    }

    res.sendStatus(200);
  } catch (err: any) {
    console.error(err);
    res.sendStatus(200);
  }
});

function mapResendEventToStatus(eventType: string): string {
  switch (eventType) {
    case "email.delivered":
      return "delivered";
    case "email.bounced":
      return "bounced";
    case "email.opened":
      return "opened";
    case "email.clicked":
      return "clicked";
    case "email.complained":
      return "complained";
    case "email.sent":
      return "sent";
    default:
      return "unknown";
  }
}

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    const { error } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true });

    if (error) {
      console.error("Could not connect to Supabase.");
      console.error("Project URL being used:", process.env.SUPABASE_URL?.trim());
      console.error("Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env");
      console.error("Error:", error.message);
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (err: any) {
    console.error("Supabase connection test crashed:", err.message);
    process.exit(1);
  }
})();
