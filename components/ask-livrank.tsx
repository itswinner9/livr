"use client";

import { askLivRank } from "@/lib/actions/ai";
import { useState } from "react";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";

const SUGGESTIONS = [
  "Are there maintenance complaints?",
  "How noisy is this building?",
  "What do renters say about management?",
  "What are the common problems?",
  "What rent are renters reporting?",
  "Do renters mention parking problems?",
];

export function AskLivRank({ propertyId }: { propertyId: string }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(q: string) {
    setPending(true);
    setError(null);
    const result = await askLivRank(propertyId, q);
    setPending(false);
    if (result.error) setError(result.error);
    else setAnswer(result.answer ?? null);
  }

  return (
    <div className="rounded-md bg-surface p-5 border border-rule md:p-6">
      <h2 className="text-xl font-bold text-ink">Ask LivRank</h2>
      <p className="mt-1 text-sm text-mute">
        Answers are grounded in published LivRank renter reviews for this property.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            className="rounded-md bg-muted px-3 py-1.5 text-xs font-medium text-mute hover:bg-rule hover:text-ink"
            onClick={() => {
              setQuestion(s);
              void submit(s);
            }}
          >
            {s}
          </button>
        ))}
      </div>
      <form
        className="mt-4 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          void submit(question);
        }}
      >
        <label className="sr-only" htmlFor="ask">
          Question
        </label>
        <Textarea
          id="ask"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={3}
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Asking…" : "Ask"}
        </Button>
      </form>
      {error ? <p className="mt-3 text-sm text-mute">{error}</p> : null}
      {answer ? (
        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-ink">{answer}</p>
      ) : null}
    </div>
  );
}
