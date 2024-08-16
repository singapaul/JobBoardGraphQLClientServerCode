import cors from "cors";
import express from "express";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware as apolloMiddleware } from "@apollo/server/express4";
import { authMiddleware, handleLogin } from "./auth.js";
import { resolvers } from "./resolvers.js";
import { readFile } from "node:fs/promises";
import { getUser } from "./db/users.js";
import { createCompanyLoader } from "./db/companies.js";
const PORT = 9000;

const app = express();
app.use(cors(), express.json(), authMiddleware);

app.post("/login", handleLogin);

const typeDefs = await readFile("./schema.graphql", "utf-8");

const apolloServer = new ApolloServer({ typeDefs, resolvers });

// We use the context to pass arbitary valus to our resolvers
async function getContext({ req }) {
  // we are getting access to our request in this middleware
  const companyLoader = createCompanyLoader();
  const context = { companyLoader };
  if (req.auth) {
    context.user = await getUser(req.auth.sub);
  }
  return context;
}

await apolloServer.start();
// intended for binding middlewares to application
app.use("/graphql", apolloMiddleware(apolloServer, { context: getContext }));

app.listen({ port: PORT }, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Graph QL endpoint at http://localhost:${PORT}/graphql `);
});

app.po;
