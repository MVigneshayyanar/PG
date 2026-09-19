import { auth } from "./client";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from "firebase/auth";

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    recaptchaWidgetId?: number;
  }
}

/**
 * Initializes a visible RecaptchaVerifier ("I'm not a robot" checkbox) on the specified DOM element.
 * Safe for React re-renders and single-page navigation.
 */
export async function initRecaptcha(
  containerId = "recaptcha-container",
  onSolved?: () => void
): Promise<RecaptchaVerifier> {
  if (typeof window === "undefined") {
    throw new Error("reCAPTCHA can only be initialized on the client");
  }

  if (!auth) {
    throw new Error(
      "Firebase Auth is not initialized. Please verify your Firebase environment variables in Vercel/local .env."
    );
  }

  // Clear existing verifier if any to prevent duplicate or stale widgets
  if (window.recaptchaVerifier) {
    try {
      window.recaptchaVerifier.clear();
    } catch (e) {
      console.warn("Error clearing previous recaptcha verifier:", e);
    }
    window.recaptchaVerifier = undefined;
  }

  // Ensure target container element is present in the DOM
  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error(`reCAPTCHA container #${containerId} not found in the DOM.`);
  }

  // Clear any existing children inside container to prevent duplicate iframes
  container.innerHTML = "";

  const verifier = new RecaptchaVerifier(auth, containerId, {
    size: "normal", // Visible "I'm not a robot" checkbox
    callback: () => {
      if (onSolved) onSolved();
    },
    "expired-callback": () => {
      console.warn("reCAPTCHA expired, please check the box again.");
    },
  });

  await verifier.render();
  window.recaptchaVerifier = verifier;
  return verifier;
}

/**
 * Sends a real SMS verification code via Firebase Phone Authentication.
 * Automatically formats to Indian E.164 (+91) format and reuses the visible checkbox verifier.
 */
export async function sendFirebaseOtp(
  phoneNumber: string,
  containerId = "recaptcha-container"
): Promise<ConfirmationResult> {
  if (!auth) {
    throw new Error(
      "Firebase Auth is not configured. Check your environment variables (NEXT_PUBLIC_FIREBASE_*)."
    );
  }

  const cleanPhone = phoneNumber.replace(/[^0-9]/g, "").slice(-10);
  if (cleanPhone.length !== 10) {
    throw new Error("Please provide a valid 10-digit mobile number.");
  }

  const formattedPhone = `+91${cleanPhone}`;

  // Use the existing rendered verifier or initialize a fresh one
  let appVerifier = window.recaptchaVerifier;
  if (!appVerifier) {
    appVerifier = await initRecaptcha(containerId);
  }

  return await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
}

/**
 * Verifies the 6-digit OTP code against Firebase Auth and retrieves the verified ID token.
 */
export async function confirmFirebaseOtp(
  confirmationResult: ConfirmationResult,
  otpCode: string
): Promise<{ idToken: string; phoneNumber: string | null }> {
  if (!confirmationResult) {
    throw new Error("No active OTP session. Please request a new OTP.");
  }

  const cleanOtp = otpCode.trim();
  if (cleanOtp.length < 6) {
    throw new Error("Please enter the full 6-digit verification code.");
  }

  const userCredential = await confirmationResult.confirm(cleanOtp);
  const idToken = await userCredential.user.getIdToken();

  return {
    idToken,
    phoneNumber: userCredential.user.phoneNumber,
  };
}
