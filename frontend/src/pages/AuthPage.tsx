// frontend/src/pages/AuthPage.tsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  //signInWithGoogle,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from "firebase/auth";

type Mode = "signin" | "signup";

const auth = getAuth();
const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [organization, setOrganization] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const resetErrors = () => setError(null);

  const handleGoogleSignIn = async () => {
    resetErrors();
    setLoading(true);
    try {
      await signInWithGoogle();
      navigate("/dashboard");
    } catch (err) {
      setError("Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetErrors();

    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        await createUserWithEmailAndPassword(auth, email, password);
        // TODO: after signup, call backend to create user profile row
        // (display_name, organization) in Cloud SQL, linked by firebase_uid
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
	  
	  // In AuthPage.tsx, update handleEmailSubmit's signup branch:
      const API_BASE = "https/www.gcpagent"
	  if (mode === "signup") {
		const cred = await createUserWithEmailAndPassword(auth, email, password);
		const idToken = await cred.user.getIdToken();

		await fetch(`${API_BASE}/users/profile`, {
			method: "POST",
			headers: {
			  "Content-Type": "application/json",
			  "Authorization": `Bearer ${idToken}`,
			},
			body: JSON.stringify({
			  display_name: displayName,
			  organization: organization || undefined,
			}),
		  });
	  }

      navigate("/dashboard");
    } catch (err: any) {
      setError(mapFirebaseError(err?.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Exzing Reservoir Agent</h1>
        <p className="auth-subtitle">
          {mode === "signin" ? "Sign in to your account" : "Create your account"}
        </p>

        <button
          type="button"
          className="google-signin-button"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          <GoogleIcon /> Continue with Google
        </button>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <form onSubmit={handleEmailSubmit} className="auth-form">
          {mode === "signup" && (
            <>
              <input
                type="text"
                placeholder="Full name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Organization (optional)"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
              />
            </>
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />

          {mode === "signup" && (
            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
            />
          )}

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading
              ? "Please wait..."
              : mode === "signin"
              ? "Sign in"
              : "Create account"}
          </button>
        </form>

        <p className="auth-toggle">
          {mode === "signin" ? (
            <>
              Don't have an account?{" "}
              <button type="button" onClick={() => { setMode("signup"); resetErrors(); }}>
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button type="button" onClick={() => { setMode("signin"); resetErrors(); }}>
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

function mapFirebaseError(code?: string): string {
  switch (code) {
    case "auth/email-already-in-use":
      return "An account with this email already exists.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Password is too weak — use at least 8 characters.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Incorrect email or password.";
    default:
      return "Something went wrong. Please try again.";
  }
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.85.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33z"/>
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"/>
    </svg>
  );
}