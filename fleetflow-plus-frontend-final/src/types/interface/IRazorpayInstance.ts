export interface IRazorpayInstance {
  open: () => void;
  on: (event: string, handler: () => void) => void;
}
