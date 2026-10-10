import { INTERESTS, SKILLS } from '@crossroads/shared';
import { ChipPicker } from './ChipPicker';

const SUGGESTIONS = [...new Set<string>([...SKILLS, ...INTERESTS])];

/** Up to 5 tags, with suggestions from skills and interests. */
export function TagInput({ value, onChange, id }: { value: string[]; onChange: (v: string[]) => void; id?: string }) {
  return (
    <div>
      <ChipPicker
        id={id}
        value={value}
        onChange={onChange}
        options={SUGGESTIONS}
        max={5}
        placeholder="Add a tag, e.g. python"
      />
      <p className="mt-1 text-xs text-muted-foreground">Add up to 5 tags so the right seniors see it.</p>
    </div>
  );
}
