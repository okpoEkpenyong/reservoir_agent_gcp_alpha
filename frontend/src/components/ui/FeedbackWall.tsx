// components/FeedbackWall.tsx

import { useEffect, useState } from "react";
import { getDatabase, ref, query, orderByChild, equalTo, get } from "firebase/database";
import { app } from "../../firebase_config";
import { Star } from "lucide-react";

interface PublicFeedback {
  fullName?: string;
  rating?: number | null;
  message: string;
  createdAt: number;
  approvedForDisplay: boolean;
  consentPublicDisplay: boolean;
}

export function FeedbackWall() {
  const [items, setItems] = useState<PublicFeedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeedback = async () => {
      const db = getDatabase(app);
      // Realtime DB can only equalTo on one indexed field at a time —
      // filter by approvedForDisplay server-side, consentPublicDisplay client-side.
      const feedbackQuery = query(
        ref(db, "contact_messages"),
        orderByChild("approvedForDisplay"),
        equalTo(true)
      );
      const snapshot = await get(feedbackQuery);
      if (snapshot.exists()) {
        const data = snapshot.val() as Record<string, PublicFeedback>;
        const filtered = Object.values(data)
          .filter((item) => item.consentPublicDisplay)
          .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
        setItems(filtered);
      }
      setLoading(false);
    };
    fetchFeedback();
  }, []);

  if (loading) return <div className="text-petroleum-400 text-xs font-mono">Loading feedback...</div>;
  if (items.length === 0) return <div className="text-petroleum-400 text-xs font-mono">No public feedback yet.</div>;

  return (
    <div className="space-y-3 mt-6">
      {items.map((item, i) => (
        <div key={i} className="p-4 rounded-xl bg-petroleum-900 border border-petroleum-800">
          {item.rating ? (
            <div className="flex gap-0.5 mb-2">
              {Array.from({ length: 5 }).map((_, idx) => (
                <Star
                  key={idx}
                  size={14}
                  className={idx < item.rating! ? "text-amber-400 fill-amber-400" : "text-petroleum-700"}
                />
              ))}
            </div>
          ) : null}
          <p className="text-xs text-petroleum-200">{item.message}</p>
          <p className="text-[10px] text-petroleum-500 font-mono mt-2">
            {item.fullName || "Anonymous"}
          </p>
        </div>
      ))}
    </div>
  );
}