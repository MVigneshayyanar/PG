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
 * Initializes or resets an invisible RecaptchaVerifier on the specified DOM element.
 */
export function initRecaptcha(containerId = "recaptcha-container"): RecaptchaVerifier {
  if (typeof window === "undefined") {
    throw new Error("reCAPTCHA can only be initialized on the client");
  }

  if (!auth) {
    throw new Error("Firebase Auth is not initialized. Please verify your Firebase environment variables.");
  }

  // Clear existing verifier if any to prevent stale widget state
  if (window.recaptchaVerifier) {
    try {
      window.recaptchaVerifier.clear();
    } catch (e) {
      console.warn("Error clearing previous recaptcha verifier:", e);
    }
    window.recaptchaVerifier = undefined;
  }

  const verifier = new RecaptchaVerifier(auth, containerId, {
    size: "invisible",
    callback: () => {
      // reCAPTCHA solved — will proceed with submit
    },
    "expired-callback": () => {
      console.warn("reCAPTCHA expired, resetting...");
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = undefined;
      }
    },
  });

  window.recaptchaVerifier = verifier;
  return verifier;
}

/**
 * Sends a real SMS verification code via Firebase Phone Authentication.
 * Automatically handles formatting to Indian E.164 (+91) format.
 */
export async function sendFirebaseOtp(
  phoneNumber: string,
  containerId = "recaptcha-container"
): Promise<ConfirmationResult> {
  if (!auth) {
    throw new Error("Firebase Auth is not configured. Check your environment variables.");
  }

  const cleanPhone = phoneNumber.replace(/[^0-9]/g, "").slice(-10);
  if (cleanPhone.length !== 10) {
    throw new Error("Please provide a valid 10-digit mobile number.");
  }

  const formattedPhone = `+91${cleanPhone}`;
  const appVerifier = initRecaptcha(containerId);

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
