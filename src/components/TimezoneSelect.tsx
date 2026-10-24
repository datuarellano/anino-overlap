import { useMemo } from 'react';
import { allTimezones, tzLabel } from '../lib/time';

interface Props {
  id?: string;
  value: string;
  onChange: (tz: string) => void;
  className?: string;
}

export function TimezoneSelect({ id, value, onChange, className = 'select' }: Props) {
  const zones = useMemo(() => {
    const list = allTimezones();
    return list.includes(value) ? list : [value, ...list];
  }, [value]);
  return (
    <select id={id} className={className} value={value} onChange={(e) => onChange(e.target.value)}>
      {zones.map((z) => (
        <option key={z} value={z}>
          {tzLabel(z)}
        </option>
      ))}
    </select>
  );
}
