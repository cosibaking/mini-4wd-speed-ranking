import { boardNotFoundError } from './errors.js';
import { postRepository } from './post.repository.js';

export interface BoardItem {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
}

export class BoardService {
  async listBoards(): Promise<{ list: BoardItem[] }> {
    const boards = await postRepository.listBoards();
    return {
      list: boards.map((board) => ({
        id: board.id,
        name: board.name,
        description: board.description,
        sortOrder: board.sortOrder,
      })),
    };
  }

  async getBoard(boardId: string): Promise<BoardItem> {
    const board = await postRepository.findBoardById(boardId);
    if (!board) {
      throw boardNotFoundError();
    }

    return {
      id: board.id,
      name: board.name,
      description: board.description,
      sortOrder: board.sortOrder,
    };
  }
}

export const boardService = new BoardService();
