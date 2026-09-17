import mark from '../assets/brand/mark.svg';
import './Logo.css';

export function Logo({ className = '' }: { className?: string }) {
  return (
    <a href="#top" className={`logo ${className}`} aria-label="Phorcast home">
      <img src={mark} alt="" width={30.5} height={35.6} className="logo__mark" />
      <span className="logo__word">Phorcast</span>
    </a>
  );
}
