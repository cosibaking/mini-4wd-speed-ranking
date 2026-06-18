import type { Context } from 'koa';

import { success } from '../../shared/response.js';
import { boardService } from './board.service.js';

export async function listBoards(ctx: Context): Promise<void> {
  const data = await boardService.listBoards();
  ctx.body = success(data);
}
