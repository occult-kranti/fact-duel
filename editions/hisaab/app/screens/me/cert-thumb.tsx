/**
 * screens/me/cert-thumb.tsx — a true thumbnail of the certificate: the frame is laid out at its export
 * proportions (540px wide, where every size is a share of the width) and scaled down as one picture,
 * so the thumbnail is the certificate in miniature rather than a squeezed re-layout. Decorative: the
 * link around it carries the name ("Open your certificate").
 */
import { Certificate, type CertificateProps } from '../../ui/certificate';

const FRAME_W = 540;
/** 4:5 card (534 × 667.5 inside the 6px shadow margin) plus the shadow. */
const FRAME_H = 674;

export function CertThumb({ width, ...cert }: CertificateProps & { width: number }) {
  const scale = width / FRAME_W;
  return (
    <div className="h-certthumb" style={{ width, height: Math.ceil(FRAME_H * scale) }} aria-hidden="true">
      <div className="h-certthumb__inner" style={{ width: FRAME_W, transform: `scale(${scale})` }}>
        <Certificate {...cert} />
      </div>
    </div>
  );
}
