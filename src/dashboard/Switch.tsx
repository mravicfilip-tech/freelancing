/**
 * A switch: a track and a knob, on the dashboard's field ground when off and
 * the accent when on. A real `role="switch"` button, so it takes Space and
 * Enter and reads its state out. The label is the switch's own, clicking it
 * toggles too.
 */
export function Switch({ checked, onChange, label, id, disabled }: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: React.ReactNode;
  id?: string;
  disabled?: boolean;
}) {
  return (
    <label className="switch" data-on={checked || undefined}>
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        className="switch__track"
        disabled={disabled}
        onClick={() => onChange(!checked)}
      >
        <span className="switch__knob" aria-hidden="true" />
      </button>
      <span className="switch__label">{label}</span>
    </label>
  );
}
