'use client';
/**
 * A single Vault fact: difficulty-tinted finish, topic tag, question, the answer, an expandable
 * explanation (first open awards XP and floats it) and a bookmark toggle (a save bursts a gem).
 * Every dispatch is passed in by the Vault screen; this component only adds the feedback.
 */
import { useRef } from 'react';
import { Bookmark, ChevronRight, Check, ExternalLink } from 'lucide-react';
import { useJuice } from '@/components/fx';
import { XP } from '@/lib/progression.mjs';
import { finishOf, FINISH_LABEL } from './difficulty';
import { usePress } from './press';

export type FactCardProps = {
  fact: any;
  saved: boolean;
  /** This fact has never been opened, so opening it will award XP.open. */
  openAwards: boolean;
  onOpen: (roundId: string) => void;
  onSave: (question: string) => void;
};

export function FactCard({ fact, saved, openAwards, onOpen, onSave }: FactCardProps) {
  const juice = useJuice();
  const press = usePress();
  const summaryRef = useRef<HTMLElement | null>(null);
  const finish = finishOf(fact.difficulty);
  return (
    <article className="fd-fact" data-finish={finish}>
      <div className="fd-fact__head">
        <span className="fd-tag">{fact.topic}</span>
        {finish !== 'plain' && <span className="fd-badge">{FINISH_LABEL[finish]}</span>}
        <button
          type="button"
          className="fd-icon-btn"
          aria-label={saved ? 'Remove saved fact' : 'Save fact'}
          aria-pressed={saved}
          onPointerDown={press}
          onClick={(e) => {
            const el = e.currentTarget;
            const adding = !saved;
            onSave(fact.question);
            if (adding) {
              juice.burst(el, 'gem');
              juice.floatText(el, `+${XP.save} XP`, 'var(--gold-text)');
            }
          }}
        >
          <Bookmark fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>
      <h3 className="fd-fact__q">{fact.question}</h3>
      <p className="fd-fact__a">
        <Check aria-hidden="true" />
        <span>{fact.correctAnswer}</span>
      </p>
      <details
        className="fd-disclose"
        onToggle={(e) => {
          if (!e.currentTarget.open) return;
          onOpen(fact.id);
          juice.sound('reveal');
          if (openAwards && summaryRef.current) juice.floatText(summaryRef.current, `+${XP.open} XP`);
        }}
      >
        <summary ref={summaryRef} onPointerDown={press}>
          <ChevronRight className="fd-caret" aria-hidden="true" />
          Explanation &amp; source
        </summary>
        <div className="fd-disclose__body">
          <p>{fact.explanation}</p>
          <a className="fd-source" href={fact.sourceUrl} target="_blank" rel="noopener noreferrer">
            {fact.sourceLabel}
            <ExternalLink aria-hidden="true" />
          </a>
        </div>
      </details>
    </article>
  );
}
