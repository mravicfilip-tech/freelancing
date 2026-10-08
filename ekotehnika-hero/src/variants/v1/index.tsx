// Variant 1, stub until built.
export default function Variant1({ reduced }: { reduced: boolean }) {
  return <div style={{ height: '100vh', display: 'grid', placeItems: 'center' }}>Varijanta 1 {reduced ? '(reduced)' : ''}</div>;
}
