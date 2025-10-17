// Polyfill Buffer for browser compatibility (needed for circomlibjs/Poseidon ZK proofs)
import { Buffer } from 'buffer';
(window as any).Buffer = Buffer;
if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer;
}

import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
