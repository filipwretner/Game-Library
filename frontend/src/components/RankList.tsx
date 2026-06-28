import type { JSX } from 'react';
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
import { RankRow } from './RankRow.tsx';

const DRAGGING_OPACITY = 0.6;

interface RankListProps {
  entries: EntryWithGame[];
  onReorder: (orderedIds: number[]) => void;
  onDelete: (id: number) => void;
}

/**
 * The ranked Played list (spec §8.5). Owns all drag-and-drop wiring; rows stay
 * presentational. On drop it computes the new id order and hands it to onReorder.
 */
export function RankList({ entries, onReorder, onDelete }: Readonly<RankListProps>): JSX.Element {
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
            <SortableRankRow key={entry.id} entry={entry} onDelete={onDelete} />
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  );
}

interface SortableRankRowProps {
  entry: EntryWithGame;
  onDelete: (id: number) => void;
}

/** Binds one row to dnd-kit; the row markup stays in the presentational RankRow. */
function SortableRankRow({ entry, onDelete }: Readonly<SortableRankRowProps>): JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: entry.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? DRAGGING_OPACITY : 1,
  };
  return (
    <RankRow
      entry={entry}
      onDelete={onDelete}
      sortable={{ attributes, listeners, setNodeRef, style }}
    />
  );
}
