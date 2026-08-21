export interface VMStoppedTemplateData {
  userName?: string;
  vmName: string;
  status: string;
}

export function renderVMStoppedTemplate(
  data: VMStoppedTemplateData
): { subject: string; html: string } {
  const user = data.userName || "there";
  const status = data.status.charAt(0).toUpperCase() + data.status.slice(1);

  return {
    subject: "VM Stopped",
    html: `
      <p>Hello ${user},</p>
      <p>Your VM <strong>${data.vmName}</strong> has stopped.</p>
      <p>Status: ${status}</p>
    `.trim(),
  };
}
