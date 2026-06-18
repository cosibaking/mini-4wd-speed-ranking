import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BOARDS = [
  {
    id: 'track_event',
    name: '赛道/赛事专区',
    description: '赛道活动、赛事通知、圈速讨论',
    sortOrder: 1,
  },
  {
    id: 'newbie',
    name: '新手入门区',
    description: '入门教程、规则科普',
    sortOrder: 2,
  },
  {
    id: 'driver_chat',
    name: '车手交流区',
    description: '改装、手感、闲聊',
    sortOrder: 3,
  },
  {
    id: 'new_product',
    name: '新品发布区',
    description: '装备新品、开箱',
    sortOrder: 4,
  },
] as const;

async function main(): Promise<void> {
  for (const board of BOARDS) {
    await prisma.board.upsert({
      where: { id: board.id },
      update: {
        name: board.name,
        description: board.description,
        sortOrder: board.sortOrder,
      },
      create: board,
    });
  }

  console.log(`Seeded ${BOARDS.length} boards`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
