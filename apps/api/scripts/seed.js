/* eslint-disable no-console */
import { connectMongo, disconnectMongo } from '../src/db/mongoose.js';
import { User, Board, Page } from '../src/models/index.js';

async function main() {
  await connectMongo();
  const email = 'demo@excalidrow.local';
  let user = await User.findOne({ email });
  if (!user) {
    const passwordHash = await User.hashPassword('demo1234');
    user = await User.create({ name: 'Demo', email, passwordHash });
    console.log('created demo user');
  }
  const exists = await Board.findOne({ ownerId: user._id });
  if (!exists) {
    const board = await Board.create({
      ownerId: user._id,
      title: 'Welcome to Excalidrow',
      description: 'Your first board — drag, draw, brainstorm.',
      mode: 'free',
      tags: ['welcome'],
      pageCount: 1,
    });
    await Page.create({
      boardId: board._id,
      ownerId: user._id,
      title: 'Page 1',
      index: 0,
    });
    console.log('seeded welcome board');
  }
  await disconnectMongo();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
