export {};

declare global {
  interface Window {
    abillio_kyc?: {
      setOnEvent?: (cb: (event: string, response: any) => void) => void;
    };
  }
}
