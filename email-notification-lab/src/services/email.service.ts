import dotenv from "dotenv";
import { Resend } from "resend";

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY || "");

export interface SendVMStartedEmailInput {
  to: string;
  vmName: string;
}

export interface SendResult {
  success: boolean;
  message: string;
  id?: string;
}

export async function sendVMStartedEmail({
  to,
  vmName,
}: SendVMStartedEmailInput): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      message: "RESEND_API_KEY is not configured",
    };
  }

  const { data, error } = await resend.emails.send({
    from: "onboarding@resend.dev",
    to,
    subject: "VM Started",
    html: `<p>VM <strong>${vmName}</strong> has started successfully.</p>`,
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
