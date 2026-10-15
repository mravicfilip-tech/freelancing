// The step names of a hero's scroll story, for screen readers. On screen the names are a label that
// crossfades with the scroll and is hidden from them, so the figure describes itself with this list.
export function StepList({ id, steps }: { id: string; steps: string[] }) {
  return (
    <ol id={id} className="sr-only">
      {steps.map((name) => (
        <li key={name}>{name}</li>
      ))}
    </ol>
  );
}
