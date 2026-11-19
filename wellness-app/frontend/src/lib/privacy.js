// Optional app PIN lock (stored only on this device).
// This keeps casual snoopers out. It is not the same as account security.

const PIN_KEY = "bloom_pin";
const UNLOCK_KEY = "bloom_unlocked"; // sessionStorage: clears when the tab closes
const RESET_KEY = "bloom_reset_pin"; // sessionStorage flag used by "Forgot PIN"

const toHex = (buf) =>
  [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

const hashPin = async (pin, salt) => {
  const data = new TextEncoder().encode(`${salt}:${pin}`);
  return toHex(await crypto.subtle.digest("SHA-256", data));
};

export const hasPin = () => !!localStorage.getItem(PIN_KEY);

export const setPin = async (pin) => {
  const salt = toHex(crypto.getRandomValues(new Uint8Array(16)));
  const hash = await hashPin(pin, salt);
  localStorage.setItem(PIN_KEY, JSON.stringify({ salt, hash }));
  sessionStorage.setItem(UNLOCK_KEY, "1");
};

export const verifyPin = async (pin) => {
  try {
    const stored = JSON.parse(localStorage.getItem(PIN_KEY) || "null");
    if (!stored) return true;
    return (await hashPin(pin, stored.salt)) === stored.hash;
  } catch {
    return false;
  }
};

export const clearPin = () => localStorage.removeItem(PIN_KEY);

export const isUnlocked = () => !hasPin() || sessionStorage.getItem(UNLOCK_KEY) === "1";
export const unlock = () => sessionStorage.setItem(UNLOCK_KEY, "1");
export const lock = () => sessionStorage.removeItem(UNLOCK_KEY);

// "Forgot PIN": log out, and the next login removes the PIN.
export const requestPinReset = () => sessionStorage.setItem(RESET_KEY, "1");
export const consumePinReset = () => {
  const flagged = sessionStorage.getItem(RESET_KEY) === "1";
  sessionStorage.removeItem(RESET_KEY);
  return flagged;
};