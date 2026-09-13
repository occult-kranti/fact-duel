'use client';
/**
 * The one-line door to the measurement screen, used by the Player screen.
 *
 * It lives here, next to the screen it opens, with its own small sheet, so neither the Player
 * screen's CSS nor the full analytics stylesheet has to know about the other.
 */
import { ChevronRight, Database } from 'lucide-react';
import './link-card.css';

export function MeasurementLink({ onOpen }: { onOpen: () => void }) {
  return (
    <button type="button" className="fd-an-link" onClick={onOpen}>
      <span className="fd-an-link-icon" aria-hidden="true">
        <Database />
      </span>
      <span className="fd-an-link-body">
        <span className="fd-an-link-title">Measurement and your data</span>
        <span className="fd-an-link-note">
          Sessions, active days and whether you came back — everything this app records about this device,
          with JSON and CSV exports.
        </span>
      </span>
      <ChevronRight className="fd-an-link-chev" aria-hidden="true" />
    </button>
  );
}
