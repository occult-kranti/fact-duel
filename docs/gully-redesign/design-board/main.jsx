import React from 'react';
import {createRoot} from 'react-dom/client';
import {Excalidraw} from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import sceneUrl from './gully-club.excalidraw?url';

const root=createRoot(document.getElementById('root'));
try {
  const response=await fetch(sceneUrl);
  if(!response.ok)throw new Error('Design board could not load.');
  const scene=await response.json();
  root.render(<Excalidraw initialData={{elements:scene.elements,appState:scene.appState,files:scene.files}}/>);
} catch(error) {
  root.render(<main style={{padding:32}}><h1>Design board could not open.</h1><p>{error.message}</p><p>Open gully-club.excalidraw in Excalidraw directly, or reload this page.</p></main>);
}
