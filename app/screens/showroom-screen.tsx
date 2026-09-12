'use client';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import ArcadeStage from '../arcade-stage';
import type { ShowroomScreenProps } from './types';

/* 3D showroom. Only ever mounted when no room is open (the orchestrator gates it); the scene
 * itself loads three.js lazily behind "Activate 3D". */
export function ShowroomScreen({ showArt, onShowArt, go }: ShowroomScreenProps) {
  return (
    <section className="arena-showroom">
      <Button variant="ghost" onClick={() => go('arena')}>
        <ArrowLeft />
        Back to play
      </Button>
      <div className="section-heading">
        <div>
          <p className="eyebrow">THE ARENA OBJECT</p>
          <h1>Take it for a spin.</h1>
        </div>
        <span className="tag">3D is optional</span>
      </div>
      {showArt ? <ArcadeStage /> : <Button onClick={() => onShowArt(true)}>Show arena artwork</Button>}
      <p className="small-note">
        Drag horizontally or use the rotate controls. Switch back to the static view whenever you like. The
        scene is removed before a match starts.
      </p>
    </section>
  );
}
