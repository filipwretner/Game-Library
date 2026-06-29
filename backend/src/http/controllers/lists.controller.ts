import type { CustomListService } from '../../services/customListService.js';
import type { AsyncRequestHandler } from '../middleware/asyncHandler.js';
import { parse } from '../parse.js';
import {
  addListEntrySchema,
  createListSchema,
  listEntryParamsSchema,
  listIdParamSchema,
  listReorderSchema,
} from '../validators/lists.validators.js';

const HTTP_CREATED = 201;
const HTTP_NO_CONTENT = 204;

export interface ListsController {
  list: AsyncRequestHandler;
  create: AsyncRequestHandler;
  remove: AsyncRequestHandler;
  entries: AsyncRequestHandler;
  addEntry: AsyncRequestHandler;
  removeEntry: AsyncRequestHandler;
  reorder: AsyncRequestHandler;
}

/** Thin controllers (spec §7.1): validate → call one service method → respond. */
export function makeListsController(service: CustomListService): ListsController {
  return {
    list: async (_req, res) => {
      res.json(await service.listLists());
    },
    create: async (req, res) => {
      const { title } = parse(createListSchema, req.body);
      res.status(HTTP_CREATED).json(await service.createList(title));
    },
    remove: async (req, res) => {
      const { id } = parse(listIdParamSchema, req.params);
      await service.deleteList(id);
      res.status(HTTP_NO_CONTENT).end();
    },
    entries: async (req, res) => {
      const { id } = parse(listIdParamSchema, req.params);
      res.json(await service.getEntries(id));
    },
    addEntry: async (req, res) => {
      const { id } = parse(listIdParamSchema, req.params);
      const { igdbId } = parse(addListEntrySchema, req.body);
      res.status(HTTP_CREATED).json(await service.addGame(id, igdbId));
    },
    removeEntry: async (req, res) => {
      const { id, entryId } = parse(listEntryParamsSchema, req.params);
      await service.removeEntry(id, entryId);
      res.status(HTTP_NO_CONTENT).end();
    },
    reorder: async (req, res) => {
      const { id } = parse(listIdParamSchema, req.params);
      const { orderedEntryIds } = parse(listReorderSchema, req.body);
      res.json(await service.reorder(id, orderedEntryIds));
    },
  };
}
