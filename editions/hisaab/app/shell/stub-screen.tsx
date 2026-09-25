/**
 * shell/stub-screen.tsx — the placeholder every screen module starts as, so the app runs end to end
 * before the screen lanes land. A lane replaces its screens/<name>/index.tsx and stops importing this.
 */
import type { ReactNode } from 'react';
import type { AppRoute } from '../router';
import { href } from '../router';
import { Button } from '../ui/button';
import { NotingSheet } from '../ui/noting-sheet';
import { Page, ScreenHeader } from '../ui/page';

export type StubScreenProps = {
  route: AppRoute;
  title: string;
  titleHi?: string;
  /** Bible section the lane builds from, e.g. '§11.2'. */
  spec: string;
  /** Owning lane and its dev port. */
  lane: string;
  children?: ReactNode;
};

const LINKS: ReadonlyArray<[string, string]> = [
  ['Home', href.home()],
  ['Files', href.files()],
  ['Money trail', href.money()],
  ['Today', href.aaj()],
  ['Duel', href.duel()],
  ['Receipts', href.receipts()],
  ['Me', href.me()],
  ['Rules', href.rules()],
];

export function StubScreen({ route, title, titleHi, spec, lane, children }: StubScreenProps) {
  const params = Object.entries(route.params);
  const query = Object.entries(route.query);
  return (
    <Page screen={route.name}>
      <ScreenHeader
        kicker={`F.No. STUB/${route.name.toUpperCase()}${route.view ? `/${route.view.toUpperCase()}` : ''}`}
        titleHi={titleHi}
        title={title}
        lead="Being built. This file is a stub — the screen lane is still typing it."
      />
      <NotingSheet title="Stub">
        <p>
          Spec: {spec}. Owner: {lane}. Route <code>{route.path}</code>
          {route.view ? (
            <>
              {' '}
              · view <code>{route.view}</code>
            </>
          ) : null}
          {params.length ? <> · {params.map(([k, v]) => `${k}=${v}`).join(', ')}</> : null}
          {query.length ? <> · query {query.map(([k, v]) => `${k}=${v}`).join(', ')}</> : null}
        </p>
      </NotingSheet>
      {children}
      <nav aria-label="Stub links" className="h-row">
        {LINKS.map(([label, to]) => (
          <Button key={to} href={to} variant="paper" size="s">
            {label}
          </Button>
        ))}
      </nav>
    </Page>
  );
}
