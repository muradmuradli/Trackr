import {
  createTRPCClientProxy,
  createTRPCProxyClient,
  httpBatchLink,
} from "@trpc/client";
import { initTRPC } from "@trpc/server";
import z from "zod";

const t = initTRPC.create();

const userProcedure = t.procedure.input(z.object({ userId: z.string() }));

const userRouter = t.router({
  getUser: userProcedure.query((req) => {
    return { id: req.input, name: "James" };
  }),
});

const router = t.router({
  sayHi: t.procedure.query(() => {
    return "Hi";
  }),
  logToServer: t.procedure
    .input((v) => {
      if (typeof v === "string") return v;

      throw new Error("Not a string");
    })
    .mutation((req) => {
      console.log(req.input);
      return true;
    }),
  users: userRouter,
});

export type AppRouter = typeof router;

// Client code
const client = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: "http://localhost:3000/trpc",
    }),
  ],
});

async function main() {
  const result = await client.users.getUser.query(2);
}
