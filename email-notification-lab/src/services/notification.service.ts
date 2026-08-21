import { db } from "../db";
import {
  sendVMStartedEmail,
  sendVMStoppedEmail,
  SendResult,
} from "./email.service";
import { renderVMStartedTemplate } from "../templates/vm-started.template";
import { renderVMStoppedTemplate } from "../templates/vm-stopped.template";

export interface VMNotificationInput {
  to: string;
  userName?: string;
  userId: number;
  vmName: string;
  status: string;
  type: "started" | "stopped";
}

export async function sendVMNotification(
  input: VMNotificationInput
): Promise<SendResult & { notificationId?: number }> {
  const { to, userName, userId, vmName, status, type } = input;

  const render =
    type === "started" ? renderVMStartedTemplate : renderVMStoppedTemplate;
  const { subject } = render({ userName, vmName, status });

  const [insert] = await db.execute(
    "INSERT INTO email_notifications (user_id, type, recipient, subject, resend_email_id, status) VALUES (?, ?, ?, ?, ?, ?)",
    [userId, `VM_${type.toUpperCase()}`, to, subject, null, "pending"]
  );
  const notificationId = (insert as any).insertId;

  const emailResult =
    type === "started"
      ? await sendVMStartedEmail({ to, userName, vmName, status })
      : await sendVMStoppedEmail({ to, userName, vmName, status });

  await db.execute(
    "UPDATE email_notifications SET resend_email_id = ?, status = ?, updated_at = NOW() WHERE id = ?",
    [emailResult.id || null, emailResult.success ? "sent" : "failed", notificationId]
  );

  return { ...emailResult, notificationId };
}
