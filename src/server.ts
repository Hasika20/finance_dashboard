
import app from './app';
import { env } from './config/env';
import { prisma } from './config/database';

const PORT = env.PORT;

async function startServer() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    const server = app.listen(PORT, () => {
      console.log(`\n🚀 Finance Dashboard API is running!`);
      console.log(`   Server:  http://localhost:${PORT}`);
      console.log(`   API:     http://localhost:${PORT}/api/health`);
      console.log(`   Docs:    http://localhost:${PORT}/api-docs`);
      console.log(`   Env:     ${env.NODE_ENV}\n`);
    });

    const shutdown = async (signal: string) => {
      console.log(`\n⏳ ${signal} received. Shutting down gracefully...`);

      server.close(async () => {
        await prisma.$disconnect();
        console.log('👋 Server shut down cleanly');
        process.exit(0);
      });

      setTimeout(() => {
        console.error('⚠️  Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

startServer();
