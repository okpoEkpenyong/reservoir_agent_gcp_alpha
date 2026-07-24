// frontend/src/components/FeedbackForm.tsx

import { useState } from "react";

type Deployment = "azure" | "gcp";

interface FeedbackPayload {
  name?: string;
  organization?: string;
  role?: string;
  rating: number;
  comment?: string;
  deployment: Deployment;
  consent_public_display: boolean;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

export default function FeedbackForm({ deployment }: { deployment: Deployment }) {
  const [rating, setRating] = useState(0);
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  const [role, setRole] = useState("");
  const [comment, setComment] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (rating < 1) {
      setError("Please select a rating.");
      return;
    }

    const payload: FeedbackPayload = {
      name: name || undefined,
      organization: organization || undefined,
      role: role || undefined,
      rating,
      comment: comment || undefined,
      deployment,
      consent_public_display: consent,
    };

    try {
      const res = await fetch(`${API_BASE}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Submission failed");
      setSubmitted(true);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    }
  };

  if (submitted) {
    return (
      <div className="feedback-thanks">
        <p>Thank you — your feedback has been recorded.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="feedback-form">
      <h3>Share your feedback</h3>

      <div className="rating-input">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            type="button"
            key={star}
            onClick={() => setRating(star)}
            aria-label={`${star} star`}
            className={star <= rating ? "star selected" : "star"}
          >
            ★
          </button>
        ))}
      </div>

      <input
        type="text"
        placeholder="Name (optional)"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        type="text"
        placeholder="Organization (optional)"
        value={organization}
        onChange={(e) => setOrganization(e.target.value)}
      />
      <input
        type="text"
        placeholder="Role (optional)"
        value={role}
        onChange={(e) => setRole(e.target.value)}
      />
      <textarea
        placeholder="Comments (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={1000}
      />

      <label className="consent-label">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
        />
        I agree this feedback may be displayed publicly
      </label>

      {error && <p className="error">{error}</p>}

      <button type="submit">Submit feedback</button>
    </form>
  );
}