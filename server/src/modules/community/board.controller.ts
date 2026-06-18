import type { HttpContext } from '../../lib/http/index.js';

import { success } from '../../shared/response.js';
import { boardService } from './board.service.js';

export async function listBoards(ctx: HttpContext): Promise<void> {
  const data = await boardService.listBoards();
  ctx.body = success(data);
}
