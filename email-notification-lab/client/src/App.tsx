import { useEffect, useState } from "react";
import "./index.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface User {
  id: number;
  name: string;
  email: string;
}

interface Notification {
  id: number;
  user_id: number;
  type: string;
  recipient: string;
  subject: string;
  resend_email_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [to, setTo] = useState("delivered@resend.dev");
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; type: "ok" | "err" | "info" } | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [serverOk, setServerOk] = useState(false);

  const fetchAuth = async () => {
    try {
      const res = await fetch(`${API}/auth/me`, { credentials: "include" });
      if (!res.ok) {
        setUser(null);
        return;
      }
      const json = await res.json();
      if (json.success && json.user) {
        setUser(json.user);
        setUserName(json.user.name);
      }
    } catch {
      setUser(null);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API}/notifications`, { credentials: "include" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        console.error(json.message || "Failed to load notifications");
        setServerOk(false);
        setNotifications([]);
        return;
      }
      const json = await res.json();
      setNotifications(json.data || []);
      setServerOk(true);
    } catch {
      setServerOk(false);
      setNotifications([]);
    }
  };

  useEffect(() => {
    fetchAuth().then(() => {
      fetchNotifications();
      const id = setInterval(fetchNotifications, 3000);
      return () => clearInterval(id);
    });
  }, []);

  const showToast = (text: string, type: "ok" | "err" | "info") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 5000);
  };

  const send = async (action: "start" | "stop") => {
    setLoading(action);
    showToast(`Sending VM ${action} email...`, "info");
    try {
      const res = await fetch(`${API}/vms/123/${action}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, userName }),
      });
      const json = await res.json();
      if (json.notification?.success) {
        showToast(`VM ${action} email sent. Resend ID: ${json.notification.id}`, "ok");
      } else {
        showToast(json.notification?.message || "Email not sent", "err");
      }
      fetchNotifications();
    } catch (err: any) {
      showToast(String(err), "err");
    } finally {
      setLoading(null);
    }
  };

  const sendTest = async () => {
    setLoading("test");
    showToast("Sending test email...", "info");
    try {
      const res = await fetch(`${API}/test-email`, {
        method: "POST",
        credentials: "include",
      });
      const json = await res.json();
      if (json.status === "ok") {
        showToast(`Test email sent. Resend ID: ${json.id}`, "ok");
      } else {
        showToast(json.message || "Test email failed", "err");
      }
      fetchNotifications();
    } catch (err: any) {
      showToast(String(err), "err");
    } finally {
      setLoading(null);
    }
  };

  const logout = async () => {
    await fetch(`${API}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
    showToast("Logged out", "info");
  };

  if (!user) {
    return <Auth onAuth={setUser} showToast={showToast} />;
  }

  return (
    <div className="app">
      <main className="main">
        <header className="header">
          <h1>Email Notification Lab</h1>
          <p>
            <span className={`status-dot ${serverOk ? "dot-green" : "dot-red"}`}></span>
            {serverOk ? "Connected to backend" : "Backend not reachable"} at {API}
          </p>
          <p className="user-bar">
            Signed in as <strong>{user.name}</strong> ({user.email})
            <button className="btn-ghost" onClick={logout}>Logout</button>
          </p>
        </header>

        {toast && <div className={`toast ${toast.type}`}>{toast.text}</div>}

        <section className="card">
          <h2>Send VM Notification</h2>
          <div className="row">
            <div className="field">
              <label>Recipient email</label>
              <input
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="delivered@resend.dev"
              />
            </div>
            <div className="field">
              <label>User name</label>
              <input
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="John"
              />
            </div>
          </div>

          <div className="actions">
            <button className="btn-start" onClick={() => send("start")} disabled={!!loading}>
              {loading === "start" ? "..." : "Start VM & Email"}
            </button>
            <button className="btn-stop" onClick={() => send("stop")} disabled={!!loading}>
              {loading === "stop" ? "..." : "Stop VM & Email"}
            </button>
            <button className="btn-test" onClick={sendTest} disabled={!!loading}>
              {loading === "test" ? "..." : "Send Test Email"}
            </button>
          </div>
        </section>

        <section className="card docs">
          <h2>How it works</h2>
          <ol>
            <li>Sign up or log in.</li>
            <li>Enter a recipient and optionally edit the user name.</li>
            <li>Click <strong>Start VM & Email</strong> or <strong>Stop VM & Email</strong>.</li>
            <li>The backend stores the notification, sends a Resend email, and updates the record.</li>
            <li>Resend webhooks change the status to <em>delivered</em>, <em>bounced</em>, or <em>opened</em>.</li>
          </ol>
        </section>
      </main>

      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Notifications</h2>
          <span className="count">{notifications.length}</span>
        </div>
        <button className="btn-ghost" onClick={fetchNotifications}>↻ Refresh</button>

        {notifications.length === 0 && (
          <div className="empty">No notifications yet. Send a VM email to see it here.</div>
        )}

        {notifications.map((n) => (
          <div className="noti" key={n.id}>
            <div className="noti-header">
              <div>
                <div className="noti-subject">{n.subject}</div>
                <div className="noti-to">{n.recipient}</div>
              </div>
              <span className={`badge ${n.status}`}>{n.status}</span>
            </div>
            <div className="noti-meta">
              <span className="noti-time">{new Date(n.created_at).toLocaleString()}</span>
              <span className="noti-time mono">#{n.id}</span>
            </div>
          </div>
        ))}
      </aside>
    </div>
  );
}

interface AuthProps {
  onAuth: (user: User) => void;
  showToast: (text: string, type: "ok" | "err" | "info") => void;
}

function Auth({ onAuth, showToast }: AuthProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/signup";
      const body =
        mode === "login"
          ? { email, password }
          : { name, email, password };

      const res = await fetch(`${API}${endpoint}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();

      if (json.success && json.user) {
        onAuth(json.user);
        showToast(mode === "login" ? "Welcome back" : "Account created", "ok");
      } else {
        showToast(json.message || "Auth failed", "err");
      }
    } catch (err: any) {
      showToast(String(err), "err");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h1>Email Notification Lab</h1>

        <div className="auth-tabs">
          <button
            className={mode === "login" ? "active" : ""}
            onClick={() => setMode("login")}
          >
            Log in
          </button>
          <button
            className={mode === "signup" ? "active" : ""}
            onClick={() => setMode("signup")}
          >
            Sign up
          </button>
        </div>

        {mode === "signup" && (
          <div className="field">
            <label>Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Clara"
            />
          </div>
        )}

        <div className="field">
          <label>Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>

        <div className="field">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <button
          className="btn-test"
          onClick={submit}
          disabled={loading || !email || !password || (mode === "signup" && !name)}
        >
          {loading ? "..." : mode === "login" ? "Log in" : "Sign up"}
        </button>
      </div>
    </div>
  );
}

export default App;
