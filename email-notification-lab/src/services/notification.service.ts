import { supabase } from "../db";
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

  const { data: inserted, error: insertError } = await supabase
    .from("email_notifications")
    .insert({
      user_id: userId,
      type: `VM_${type.toUpperCase()}`,
      recipient: to,
      subject,
      resend_email_id: null,
      status: "pending",
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    throw new Error(insertError?.message || "Failed to create notification");
  }

  const notificationId = inserted.id;

  const emailResult =
    type === "started"
      ? await sendVMStartedEmail({ to, userName, vmName, status })
      : await sendVMStoppedEmail({ to, userName, vmName, status });

  const { error: updateError } = await supabase
    .from("email_notifications")
    .update({
      resend_email_id: emailResult.id || null,
      status: emailResult.success ? "sent" : "failed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", notificationId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return { ...emailResult, notificationId };
}
