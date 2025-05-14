export {};

declare global {
  interface Window {
    abillio_kyc?: {
      setOnEvent?: (cb: (event: string, response: unknown) => void) => void;
    };
  }
}
