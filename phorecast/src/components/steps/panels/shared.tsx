import glow from '../../../assets/steps/glow.svg';
import ribs from '../../../assets/steps/mark-ribs.svg';
import slices from '../../../assets/steps/mark-slices.svg';

/** The 3D wordmark behind each panel. Figma gives it a different box and
 *  opacity per slide, and the ribs/slices sit at their own insets inside it. */
export function Mark({ className }: { className: string }) {
  return (
    <div className={`steps__mark ${className}`} aria-hidden="true">
      <div className="steps__mark-clip">
        <img src={ribs} alt="" className="steps__mark-ribs" />
        <img src={slices} alt="" className="steps__mark-slices" />
      </div>
    </div>
  );
}

export function Glow({ className }: { className: string }) {
  return <img src={glow} alt="" className={`steps__glow ${className}`} aria-hidden="true" />;
}
