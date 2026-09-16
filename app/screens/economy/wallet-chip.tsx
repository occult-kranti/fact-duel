'use client';
/**
 * WalletChip — the coin count in the top bar, and the door to the coins card.
 *
 * WHY A CHIP AND NOT A NUMBER. The competitor lane's strongest finding is "one currency, one
 * screen": the balance is always in the same place, and the only way to change it is the card
 * this chip opens (the 'coins' placement), where the price of an ad and every free path are
 * printed before any tap. The chip itself does nothing but count — mono digits, a count-up via
 * the juice counter, no other motion — and stays hidden until the wallet has loaded, so the
 * server render and the first client paint agree.
 *
 * The sheet is a native <dialog>: focus stays inside, Escape closes it, and it costs no library.
 */
import { useEffect, useRef, useState } from 'react';
import { Coins } from 'lucide-react';
import { NumberCounter } from '@/components/fx';
import { usePress } from '../vault/press';
import { useWalletContext } from '../../use-wallet';
import { AdCard } from './ad-card';
import './economy.css';

export function WalletChip() {
  const wallet = useWalletContext();
  const press = usePress();
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    else if (!open && el.open) el.close();
  }, [open]);

  if (!wallet || !wallet.loaded) return null;
  const coins = wallet.wallet.coins;
  return (
    <>
      <button
        type="button"
        className="fd-chip-top fd-chip-top--coins"
        title={`${coins.toLocaleString()} coins on this device`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onPointerDown={press}
        onClick={() => setOpen(true)}
      >
        <Coins aria-hidden="true" />
        <NumberCounter value={coins} duration={600} className="fd-chip-label" />
        <span className="sr-only">coins</span>
      </button>
      <dialog
        ref={dialog}
        className="fd-adsheet"
        aria-label="Your coins"
        onClose={() => setOpen(false)}
        onClick={(e) => {
          // A tap on the backdrop is the same neutral "not now" as the button.
          if (e.target === e.currentTarget) setOpen(false);
        }}
      >
        {open && <AdCard wallet={wallet} placement="coins" onClose={() => setOpen(false)} />}
      </dialog>
    </>
  );
}
