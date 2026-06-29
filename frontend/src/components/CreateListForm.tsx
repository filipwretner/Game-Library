import { useState, type JSX } from 'react';
import { Button } from './Button.tsx';

interface CreateListFormProps {
  onCreate: (title: string) => void;
}

/**
 * "Create List" button that reveals a title input; submitting with a non-empty
 * title creates the list. Holds only ephemeral UI state.
 */
export function CreateListForm({ onCreate }: Readonly<CreateListFormProps>): JSX.Element {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');

  const submit = (): void => {
    const trimmed = title.trim();
    if (trimmed === '') return;
    onCreate(trimmed);
    setTitle('');
    setOpen(false);
  };

  if (!open) {
    return <Button onClick={() => setOpen(true)}>Create List</Button>;
  }

  return (
    <form
      className="flex flex-wrap gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <input
        autoFocus
        value={title}
        aria-label="List title"
        placeholder="List title…"
        onChange={(e) => setTitle(e.target.value)}
        className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-text placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      />
      <Button type="submit">Create</Button>
      <Button
        onClick={() => {
          setOpen(false);
          setTitle('');
        }}
      >
        Cancel
      </Button>
    </form>
  );
}
