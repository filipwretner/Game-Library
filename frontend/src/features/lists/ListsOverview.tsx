import type { JSX } from 'react';
import { useCustomLists } from '../../hooks/queries/useCustomLists.ts';
import { useCreateList, useDeleteList } from '../../hooks/mutations/useCustomListMutations.ts';
import { CreateListForm } from '../../components/CreateListForm.tsx';
import { ListHeader } from '../../components/ListHeader.tsx';
import { Button } from '../../components/Button.tsx';
import { Loading } from '../../components/Loading.tsx';
import { ErrorBanner, firstErrorMessage } from '../../components/ErrorBanner.tsx';

interface ListsOverviewProps {
  onSelect: (id: number) => void;
}

/** The custom-lists landing: create a list and pick one to open. */
export function ListsOverview({ onSelect }: Readonly<ListsOverviewProps>): JSX.Element {
  const { data: lists, isPending, isError } = useCustomLists();
  const createList = useCreateList();
  const deleteList = useDeleteList();
  const actionError = firstErrorMessage([createList, deleteList]);

  return (
    <section className="space-y-4">
      <ListHeader title="Lists" />
      <CreateListForm onCreate={createList.mutate} />
      <ErrorBanner message={actionError} />

      {isPending && <Loading />}
      <ErrorBanner message={isError ? 'Could not load your lists.' : null} />
      {lists && lists.length === 0 && (
        <p className="text-muted">No lists yet — create one above.</p>
      )}
      {lists && lists.length > 0 && (
        <ul className="space-y-2">
          {lists.map((list) => (
            <li
              key={list.id}
              className="flex items-center justify-between rounded-lg border border-border bg-surface p-3"
            >
              <Button
                onClick={() => onSelect(list.id)}
                className="border-0 bg-transparent font-medium hover:bg-transparent hover:text-accent"
              >
                {list.title}
              </Button>
              <Button
                aria-label={`Delete ${list.title}`}
                onClick={() => deleteList.mutate(list.id)}
              >
                Delete
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
