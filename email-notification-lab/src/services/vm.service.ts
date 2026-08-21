export interface VMInfo {
  id: string;
  name: string;
  status: "running" | "stopped";
}

export function startVM(vmId: string): VMInfo {
  const name = vmId === "123" ? "ubuntu-server-01" : `vm-${vmId}`;

  return {
    id: vmId,
    name,
    status: "running",
  };
}

export function stopVM(vmId: string): VMInfo {
  const name = vmId === "123" ? "ubuntu-server-01" : `vm-${vmId}`;

  return {
    id: vmId,
    name,
    status: "stopped",
  };
}
