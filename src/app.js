import "dotenv/config";
import fastify from "fastify";
import { registerRoutes } from './routes.js'

const server = fastify({
  logger: true,
});

await registerRoutes(server);

server.listen({
  port: parseInt(process.env.PORT || 8080),
  host: process.env.HOST || 'localhost',
})