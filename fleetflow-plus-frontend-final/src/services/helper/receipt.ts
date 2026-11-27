import { shipmentApi } from "../api/shipmentApi";
export async function downloadReceipt(
  id: string,
  paymentId: string,
  number: string,
) {
  const blob = await shipmentApi.receipt(id, paymentId);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${number}-${paymentId}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
export async function printReceipt(id: string, paymentId: string) {
  const tab = window.open("about:blank", "_blank");
  if (!tab) throw new Error("Allow popups to open the printable receipt.");
  try {
    tab.opener = null;
    const blob = await shipmentApi.receipt(id, paymentId);
    const url = URL.createObjectURL(blob);
    tab.location.href = url;
    setTimeout(() => URL.revokeObjectURL(url), 300000);
  } catch (e) {
    tab.close();
    throw e;
  }
}
