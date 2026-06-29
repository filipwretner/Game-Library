import type { JSX, ReactNode } from 'react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { EntryWithGame } from '../types/index.ts';
import { EntryCard } from './EntryCard.tsx';

const DRAGGING_OPACITY = 0.6;

interface SortableListProps {
  entries: EntryWithGame[];
  onReorder: (orderedIds: number[]) => void;
  onDelete: (id: number) => void;
  /** Per-entry bottom-row actions for the current list. */
  renderActions?: (entry: EntryWithGame) => ReactNode;
}

/**
 * Drag-to-reorder list used by every view (spec §8.5). Owns all dnd wiring; the
 * cards stay presentational. On drop it computes the new id order and hands it
 * to onReorder.
 */
export function SortableList({
  entries,
  onReorder,
  onDelete,
  renderActions,
}: Readonly<SortableListProps>): JSX.Element {
  const sensors = useSensors(useSensor(PointerSensor));
  const ids = entries.map((e) => e.id);

  const handleDragEnd = (event: DragEndEvent): void => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(Number(active.id));
    const newIndex = ids.indexOf(Number(over.id));
    onReorder(arrayMove(ids, oldIndex, newIndex));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ol className="space-y-2">
          {entries.map((entry) => (
            <SortableEntryCard
              key={entry.id}
              entry={entry}
              onDelete={onDelete}
              actions={renderActions?.(entry)}
            />
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  );
}

interface SortableEntryCardProps {
  entry: EntryWithGame;
  onDelete: (id: number) => void;
  actions?: ReactNode;
}

/** Binds one card to dnd-kit; the markup stays in the presentational EntryCard. */
function SortableEntryCard({
  entry,
  onDelete,
  actions,
}: Readonly<SortableEntryCardProps>): JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: entry.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? DRAGGING_OPACITY : 1,
  };
  return (
    <EntryCard
      entry={entry}
      onDelete={onDelete}
      actions={actions}
      sortable={{ attributes, listeners, setNodeRef, style }}
    />
  );
}
