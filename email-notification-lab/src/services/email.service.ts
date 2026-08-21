import dotenv from "dotenv";
import { Resend } from "resend";
import { renderVMStartedTemplate } from "../templates/vm-started.template";
import { renderVMStoppedTemplate } from "../templates/vm-stopped.template";

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY || "");

export interface SendVMStartedEmailInput {
  to: string;
  userName?: string;
  vmName: string;
  status: string;
}

export interface SendVMStoppedEmailInput {
  to: string;
  userName?: string;
  vmName: string;
  status: string;
}

export interface SendResult {
  success: boolean;
  message: string;
  id?: string;
}

export async function sendVMStartedEmail({
  to,
  userName,
  vmName,
  status,
}: SendVMStartedEmailInput): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      message: "RESEND_API_KEY is not configured",
    };
  }

  const { subject, html } = renderVMStartedTemplate({ userName, vmName, status });

  const { data, error } = await resend.emails.send({
    from: "onboarding@resend.dev",
    to,
    subject,
    html,
  });

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  return {
    success: true,
    message: "VM started email sent",
    id: data?.id,
  };
}

export async function sendVMStoppedEmail({
  to,
  userName,
  vmName,
  status,
}: SendVMStoppedEmailInput): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      message: "RESEND_API_KEY is not configured",
    };
  }

  const { subject, html } = renderVMStoppedTemplate({ userName, vmName, status });

  const { data, error } = await resend.emails.send({
    from: "onboarding@resend.dev",
    to,
    subject,
    html,
  });

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  return {
    success: true,
    message: "VM stopped email sent",
    id: data?.id,
  };
}
