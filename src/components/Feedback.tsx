import { useEffect, useState } from "react";

import type { FeedbackValue, ViewerLabels } from "../types.js";
import { IconThumbDown, IconThumbUp } from "./Icons.js";

interface Props {
  question: string;
  labels: ViewerLabels;
  /** Changing this asks again — a new photo is a new question. */
  resetKey: unknown;
  onAnswer: (value: FeedbackValue) => void;
}

/** How long the acknowledgement stays before the bar gets out of the way. */
const THANKS_MS = 1600;

export function Feedback({ question, labels, resetKey, onAnswer }: Props) {
  const [answer, setAnswer] = useState<FeedbackValue | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setAnswer(null);
    setDismissed(false);
  }, [resetKey]);

  // Once answered the bar has nothing left to say, and it sits over the top of
  // the picture — so it thanks the user briefly and then gets out of the way.
  useEffect(() => {
    if (!answer || answer === "skip") return;
    const timer = window.setTimeout(() => setDismissed(true), THANKS_MS);
    return () => window.clearTimeout(timer);
  }, [answer]);

  function choose(value: FeedbackValue) {
    setAnswer(value);
    onAnswer(value);
    if (value === "skip") setDismissed(true);
  }

  if (dismissed) return null;

  if (answer) {
    return (
      <div className="riv-feedback" data-state="answered">
        <span className="riv-feedback-thanks">{labels.feedbackThanks}</span>
      </div>
    );
  }

  return (
    <div className="riv-feedback">
      <span className="riv-feedback-q">{question}</span>

      <button type="button" className="riv-feedback-btn" onClick={() => choose("yes")}>
        {labels.feedbackYes}
        <IconThumbUp />
      </button>

      <button type="button" className="riv-feedback-btn" onClick={() => choose("no")}>
        {labels.feedbackNo}
        <IconThumbDown />
      </button>

      <button type="button" className="riv-feedback-btn riv-feedback-skip" onClick={() => choose("skip")}>
        {labels.feedbackSkip}
      </button>
    </div>
  );
}
