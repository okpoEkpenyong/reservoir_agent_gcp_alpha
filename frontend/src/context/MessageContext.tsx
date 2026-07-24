// context/MessageContext.ts

import { createContext } from "react";

export interface FeedbackSubmission {
  fullName: string;
  email: string;
  phoneNumber: string;
  message: string;
  rating: number | null;
  consentPublicDisplay: boolean;
}

export interface MessageContextValue {
  message: string;
  setMessage: (msg: string) => void;
  submitting: boolean;
  submitError: string | null;
  submitFeedback: (
    fullName: string,
    email: string,
    phoneNumber: string,
    messageText: string,
    rating: number,
    consentPublic: boolean
  ) => Promise<boolean>;
}

// context/MessageProvider.tsx

import { useMemo, useState, ReactNode } from "react";
import { app } from "../firebase_config.ts";
import { getDatabase, ref, push, serverTimestamp } from "firebase/database";
//import { MessageContext, MessageContextValue } from "./MessageContext";

export const MessageProvider = ({ children }: { children: ReactNode }) => {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const contextValue: MessageContextValue = useMemo(
    () => ({
      message,
      setMessage,
      submitting,
      submitError,
      submitFeedback: async (
        fullName,
        email,
        phoneNumber,
        messageText,
        rating,
        consentPublic
      ) => {
        setSubmitting(true);
        setSubmitError(null);
        try {
          const db = getDatabase(app);
          const feedbackRef = ref(db, "contact_messages");
          await push(feedbackRef, {
            fullName,
            email,
            phoneNumber,
            message: messageText,
            rating: rating || null,
            consentPublicDisplay: !!consentPublic,
            approvedForDisplay: false,
            createdAt: serverTimestamp(),
          });
          return true;
        } catch (error) {
          console.error("Feedback submission failed:", error);
          setSubmitError("Something went wrong. Please try again.");
          return false;
        } finally {
          setSubmitting(false);
        }
      },
    }),
    [message, submitting, submitError]
  );

  return (
    <MessageContext.Provider value={contextValue}>
      {children}
    </MessageContext.Provider>
  );
};

export const MessageContext = createContext<MessageContextValue | undefined>(undefined);