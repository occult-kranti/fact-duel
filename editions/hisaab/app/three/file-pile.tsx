/**
 * three/file-pile.tsx — FILE PILE, six files dropping onto a desk at a route finish (bible §10).
 * STUB: final props API + the 2D fallback (six tabs with verdict edges, a tape band and the stamp).
 *
 *   <FilePile results={['pass','pass','fail','pass','wait','pass']} title="Uttar Pradesh" score={{ got: 18, max: 24 }} />
 */
import { Stamp } from '../ui/stamp';
import { SceneHost, type SceneComponent } from './scene-host';

export type FileResult = 'pass' | 'fail' | 'wait';

export type FilePileProps = {
  /** The six cards' TRUE results, in order. */
  results: readonly FileResult[];
  /** The file's name ('Uttar Pradesh', 'Seedha Khaate Mein · 2020–26'). */
  title: string;
  /** Run score for the stamp: FILE CLEARED · 18/24. */
  score?: { got: number; max: number };
  height?: number;
  scene?: SceneComponent<{ results: readonly FileResult[]; title: string; stamp: string }>;
  className?: string;
};

const WORD: Record<FileResult, string> = { pass: 'SAHI', fail: 'GALAT', wait: 'PENDING' };

export const filePileStamp = (score?: { got: number; max: number }) => (score ? `FILE CLEARED · ${score.got}/${score.max}` : 'FILE CLEARED');

export function filePileLabel(title: string, results: readonly FileResult[], score?: { got: number; max: number }) {
  const right = results.filter((r) => r === 'pass').length;
  return `File cleared: ${title}, ${score ? `${score.got} of ${score.max}` : `${right} of ${results.length} right`}.`;
}

export function FilePileArt({ results, title, score }: Pick<FilePileProps, 'results' | 'title' | 'score'>) {
  return (
    <div className="h-pile" aria-hidden="true">
      <div className="h-pile__stack">
        {results.map((r, i) => (
          <span key={i} className={`h-pile__file h-pile__file--${r}`}>
            <span>F.No. {i + 1}/6</span>
            <span>{WORD[r]}</span>
          </span>
        ))}
        <span className="h-pile__tape" />
      </div>
      <p className="h-pile__title">{title}</p>
      <Stamp kind="noted" seed={`pile-${title}`} text={filePileStamp(score)} size="l" animate />
    </div>
  );
}

export function FilePile({ results, title, score, height, scene, className }: FilePileProps) {
  return (
    <SceneHost
      label={filePileLabel(title, results, score)}
      fallback={<FilePileArt results={results} title={title} score={score} />}
      scene={scene}
      props={{ results, title, stamp: filePileStamp(score) }}
      height={height}
      className={className}
    />
  );
}
