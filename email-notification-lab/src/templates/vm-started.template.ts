export interface VMStartedTemplateData {
  userName?: string;
  vmName: string;
  status: string;
}

export function renderVMStartedTemplate(
  data: VMStartedTemplateData
): { subject: string; html: string } {
  const user = data.userName || "there";
  const status = data.status.charAt(0).toUpperCase() + data.status.slice(1);

  return {
    subject: "VM Started",
    html: `
      <p>Hello ${user},</p>
      <p>Your VM <strong>${data.vmName}</strong> has successfully started.</p>
      <p>Status: ${status}</p>
    `.trim(),
  };
}
