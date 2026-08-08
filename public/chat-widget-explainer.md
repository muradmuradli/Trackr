# How Trackr's Chat Widget Works

A from-scratch explanation of the AI assistant feature — what it is, why it's built the way it is, and how the pieces fit together. Written so you can explain it to someone else, not just use it.

---

## TL;DR (the one-paragraph version)

When you type a question, the browser streams it to a Next.js API route on our server. That route pulls your job data out of the database, stuffs it into a text block ("here's what this user's pipeline looks like"), and sends the whole thing — your question plus that data block — to Groq, which runs an open-source LLM (Llama) and streams the answer back token by token. If you ask it to *do* something (change a status, add a note), the model doesn't touch the database directly — it asks our server to run one of two narrow, pre-defined functions, and our server refuses to run either one until you click "Confirm" in the UI.

That's it. There's no "AI brain" living inside the app — it's an HTTP call to someone else's model, wrapped in code that decides what to tell it and what to let it do.

---

## 1. The concepts you need before any of the code makes sense

### An LLM API call is just... an HTTP request

Groq (the company) runs large language models (Llama, etc.) on their servers and exposes them over an API that looks almost identical to OpenAI's. When our server "talks to the AI," it's making a normal `fetch`-style HTTP request: here's a system prompt, here's the conversation so far, here's my API key, send me back a response. The model has **no memory** between requests and **no access to anything** except what's literally inside the text we send it. It cannot reach into our database, read our filesystem, or know anything about Trackr except what we type into the prompt.

This is the single most important fact for understanding the security properties of this feature: **the model's "knowledge" is exactly the size of the text we hand it, every single time.**

### Streaming

A full LLM response can take several seconds to generate. Rather than making you stare at a blank box until the *entire* answer is ready, the API can send it back **as it's generated** — word by word — over a single long-lived HTTP response. The browser reads that response incrementally and repaints the message bubble as new text arrives. That's "streaming," and it's why the chat widget's replies appear to type themselves out.

### The system prompt

Every request to the model includes two things: a **system prompt** (instructions from *us*, the developers — "you are Trackr's assistant, here is the user's data, here are the rules") and the **conversation** (what the user and the assistant have said so far). The system prompt is invisible to the end user but is the actual mechanism by which the assistant "knows" anything about your pipeline — we build it fresh on every request.

### Tool calling (a.k.a. function calling)

Normally a model can only produce text. **Tool calling** lets us also hand it a menu of functions it's allowed to request — each with a name, a description, and a strict schema for what arguments it takes. The model can't actually *run* these functions; it can only emit "I'd like to call `updateJobStatus` with `{jobId: "abc", status: "interview"}`." Our server is the one that decides whether to actually run it, runs it, and reports the result back to the model so it can tell you what happened.

This is the mechanism behind "mark this application as Interview" actually updating your database.

---

## 2. The pieces, and how they talk to each other

```
Browser (ChatWidget)                  Our Server                          Groq
─────────────────────                 ──────────────                     ──────
useChat() hook          ──POST──▶     app/api/assistant/chat/route.ts
  - tracks messages                     - checks you're logged in
  - renders the UI                      - fetches your job data (tRPC)
                                         - builds the system prompt
                                         - calls streamText(...)          ──▶  Llama model
                                                                           ◀──  streamed tokens
                         ◀─stream──      - re-streams the response back
  - repaints bubbles                     - if the model wants to call
    as tokens arrive                       a tool, pauses and asks the
  - if a tool call needs                   browser for approval first
    approval, shows a
    Confirm/Decline card
```

Files involved:

| File | Role |
|---|---|
| `app/api/assistant/chat/route.ts` | The server endpoint. Fetches your data, builds the prompt, defines the two tools, talks to Groq, streams the answer back. |
| `components/dashboard/chat-widget.tsx` | The floating button + panel. Owns the conversation state via `useChat`, renders messages, handles drag-to-reposition. |
| `components/dashboard/chat-tool-card.tsx` | Renders one pending/completed tool call as a little card with Confirm/Decline buttons. |
| `components/dashboard/chat-markdown.tsx` | Turns the assistant's markdown-formatted replies (bullets, bold, etc.) into styled HTML instead of showing raw `**asterisks**`. |
| `server/trpc.ts` / `server/routers/_app.ts` | A small addition (`createCaller`) that lets the route handler call our existing database queries directly, server-side, without going over HTTP. |

---

## 3. The backend, step by step (`app/api/assistant/chat/route.ts`)

### Step 1 — Prove you're actually you

```ts
const session = await auth.api.getSession({ headers: req.headers });
if (!session) {
  return new Response("Unauthorized", { status: 401 });
}
```

Same session-cookie check every other protected page/route in the app uses. No session, no response — this is what stops a stranger from hitting this endpoint directly and asking about *your* jobs.

### Step 2 — Fetch your data, server-side

```ts
const caller = createCaller({ session });
const [stats, analytics, jobs] = await Promise.all([
  caller.jobs.stats(),
  caller.jobs.analytics(),
  caller.jobs.board(),
]);
```

This is a neat trick worth understanding: `jobs.stats`, `jobs.analytics`, and `jobs.board` are the *exact same* tRPC procedures the dashboard and analytics pages already use. Instead of writing a second copy of those SQL queries for the assistant, `createCaller` (defined once in `server/routers/_app.ts`) lets server-side code call them **directly, in-process** — no HTTP round trip, no duplicated logic, and critically, the same `userId`-scoping safety checks those procedures already have apply here too. If `jobs.stats` only ever returns *your* stats when you call it from the dashboard, it only ever returns *your* stats when the assistant calls it too — same function, same guarantee.

### Step 3 — Turn that data into text the model can read

```ts
const jobSummaries = jobs.map((job) => ({
  id: job.id,
  company: job.companyName,
  role: job.roleTitle,
  status: STATUS_LABELS[job.status],
  ...
}));
```

The model doesn't get a database connection — it gets a JSON blob. This is where "the model only knows what we tell it" becomes concrete: `jobSummaries` is deliberately a *reshaped, minimal* view (labels instead of raw enum values, no internal fields like `createdAt`/`updatedAt`/`lastReminderSentAt`) — not a raw dump of the table.

### Step 4 — Build the system prompt

```ts
const system = `You are the in-app assistant for Trackr...
...
Summary: ${JSON.stringify(stats)}
Funnel: ${JSON.stringify(analytics.funnel)}
...
All ${jobSummaries.length} applications: ${JSON.stringify(jobSummaries)}`;
```

Literally a template string. This — plus whatever text you typed — is the *entirety* of what the model has access to on any given request. There's no hidden channel, no ambient permission, nothing else it can see. This is why the answer to "could someone trick it into revealing an API key" is structural, not a matter of trusting the model to behave: **the key was never in this string, so there's nothing to leak.**

### Step 5 — Define the two tools

```ts
const tools = {
  updateJobStatus: tool({
    description: "Change the status of exactly one job application, identified by its id...",
    inputSchema: z.object({
      jobId: z.string().describe("The id of the job application..."),
      status: z.enum(STATUS_VALUES).describe("The new status to set."),
    }),
    execute: async ({ jobId, status }) => {
      const job = jobsById.get(jobId);
      if (!job) return { error: "No application with that id exists for this user." };
      const updated = await caller.jobs.update({ id: jobId, ...buildUpdatePayload(job, { status }) });
      return { company: updated.companyName, role: updated.roleTitle, status: STATUS_LABELS[updated.status] };
    },
  }),
  addNote: tool({ /* same shape, appends to notes instead */ }),
};
```

Three deliberate design choices here, all aimed at the same worry: *what's the worst a misfired action could do?*

1. **`inputSchema` only accepts one `jobId` and one field to change.** There is no "delete" tool, and no tool that accepts a filter, a status, or a date range instead of a specific ID. The model literally cannot construct a request that touches more than one row — the shape of the function makes bulk action impossible, not just discouraged.
2. **`jobId` must come from the applications list we handed it in the system prompt.** `jobsById.get(jobId)` returns nothing (and the tool politely reports "no application with that id") for anything the model invents, guesses, or mis-remembers.
3. **`execute` calls `caller.jobs.update`** — the same tRPC mutation the edit-job dialog uses, which independently re-checks that the row belongs to the logged-in user. So even in a worst-case scenario where something upstream went wrong, the mutation itself is still scoped to your own data.

### Step 6 — Require a human to say yes

```ts
toolApproval: {
  updateJobStatus: "user-approval",
  addNote: "user-approval",
},
experimental_toolApprovalSecret: toolApprovalSecret,
```

This is the actual answer to "what if it misreads a request and does something unwanted." The Vercel AI SDK (the library wrapping all of this — more below) has a built-in **human-in-the-loop** mechanism: when the model wants to call a tool marked `"user-approval"`, the SDK *doesn't run it*. It pauses, sends the browser a description of the proposed call, and waits. Nothing happens to your database until you click a button. Only then does the SDK actually invoke `execute`.

`experimental_toolApprovalSecret` cryptographically signs that pending request (an HMAC, derived from an existing app secret so no new one had to be generated). Without it, a technically-savvy attacker manipulating raw network requests could theoretically replay an approval against *different* arguments than what you actually saw. With it, the signature is checked before anything executes — the approved action has to be byte-for-byte what was proposed.

### Step 7 — Actually call the model and stream the answer back

```ts
const result = streamText({
  model: groq(process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile"),
  system,
  messages: await convertToModelMessages(messages, { tools }),
  tools,
  stopWhen: stepCountIs(5),
  toolApproval: { ... },
});

return result.toUIMessageStreamResponse();
```

- `groq(modelId)` — points at a specific model hosted on Groq's infrastructure.
- `messages` — the conversation so far, sent by the browser, converted from the UI's internal format into the plain `{role, content}` shape models actually expect (`convertToModelMessages`).
- `stopWhen: stepCountIs(5)` — a safety valve. Tool-calling can loop (call a tool → read the result → decide to call another tool → ...); this caps it at 5 steps so a confused model can't spin forever.
- `toUIMessageStreamResponse()` — packages everything (text tokens, tool-call events, approval requests) into one streamed HTTP response the frontend knows how to unpack.

---

## 4. The frontend (`chat-widget.tsx`)

### `useChat` — the hook that does the heavy lifting

```ts
const { messages, sendMessage, addToolApprovalResponse, status, error } = useChat({
  transport: new DefaultChatTransport({ api: "/api/assistant/chat" }),
  sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
});
```

`useChat` (from Vercel's AI SDK) is the client-side counterpart to `streamText` on the server. It POSTs your message to the given `api`, reads the streamed response, and turns it into reactive state: `messages` (the whole conversation), `status` (`"ready" | "submitted" | "streaming" | "error"`), and helper functions like `sendMessage`.

`sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses` is the other half of the approval story: once you click Confirm/Decline on a pending tool card, this tells `useChat` "the conversation is ready to continue — automatically send another request now" rather than making you manually resend something.

### A message isn't just a string — it's a list of "parts"

This is the biggest mental shift from a naive chatbot: an assistant message isn't one blob of text. It's an ordered array of **parts**, because a single reply can interleave text and tool calls — "Let me check... [tool call] ...done, I've updated it, here's what changed." The widget renders `message.parts` in order:

```tsx
{message.parts.map((part, index) => {
  if (part.type === "text") {
    return <ChatMarkdown content={part.text} />;   // prose
  }
  if (isToolUIPart(part)) {
    return <ChatToolCard part={part} ... />;        // a proposed/completed action
  }
})}
```

### The approval card is a state machine

A tool part moves through states as the exchange progresses, and `chat-tool-card.tsx` renders something different at each one:

```
input-streaming → approval-requested → approval-responded → output-available
                         │                                          │
                    (Confirm/Decline                          ("Marked Frontend
                     buttons shown)                            Engineer at Stripe
                                                                 as Interview")
                         └──────────── output-denied ──────────────┘
                              (if you clicked Decline)
```

The Confirm button calls `addToolApprovalResponse({ id: part.approval.id, approved: true })`. That's a client-side function that queues the response and (thanks to `sendAutomaticallyWhen`) triggers the automatic follow-up request that actually lets the server run `execute`.

### The cache-invalidation gotcha (and the fix)

Here's a subtlety worth understanding, because it's a general lesson about this architecture, not just a one-off bug: when the tool's `execute` function runs, it calls `caller.jobs.update(...)` — but `caller` is that server-side tRPC caller from earlier, **not** the normal browser tRPC client the rest of the app uses. The dashboard table's data comes from React Query, a caching layer that only refetches when *it* is told something changed (usually because a `useMutation` call on the same page succeeded). A mutation that happens inside an API route, triggered by an LLM tool call, is invisible to that cache — so without extra work, the table would keep showing the old status until you manually refreshed the page.

The fix, in the widget:

```ts
useEffect(() => {
  for (const message of messages) {
    for (const part of message.parts) {
      if (
        isToolUIPart(part) &&
        part.state === "output-available" &&
        !invalidatedToolCallIds.current.has(part.toolCallId)
      ) {
        invalidatedToolCallIds.current.add(part.toolCallId);
        utils.jobs.invalidate();
      }
    }
  }
}, [messages, utils]);
```

Whenever a tool call finishes successfully, this tells React Query "everything under `jobs.*` might be stale, please refetch" — so the table, the board, and the stats panels all pick up the change immediately. The `invalidatedToolCallIds` set exists so this only fires *once* per completed tool call (this effect actually reruns on every streamed token, since `messages` changes constantly while text is arriving — without the guard, it would call `invalidate()` dozens of times per action).

### Markdown rendering

The model naturally writes replies with markdown formatting (`**bold**`, bullet lists) — that's just how these models are trained to write. `chat-markdown.tsx` wraps the `react-markdown` library with styling that matches the rest of the app, so a reply renders as an actual bulleted list instead of literal asterisks and hyphens.

### Draggable positioning

Separate from the AI plumbing — the floating button can be dragged anywhere on screen (pointer events tracking `right`/`bottom` offsets, clamped so it can't go off-screen, saved to `localStorage` so it stays put across reloads). This is ordinary UI state management; nothing about it talks to the model.

---

## 5. Why Groq, and why the Vercel AI SDK?

- **Groq** is an inference provider — it runs open-source models (Llama, etc.) on very fast custom hardware and offers a free tier. It's *not* Anthropic/OpenAI; it exposes an OpenAI-compatible API surface, which is why the integration code looks similar to what you'd see for any other model provider.
- **The Vercel AI SDK** (`ai`, `@ai-sdk/react`, `@ai-sdk/groq`) is a provider-agnostic library that gives us `streamText` (server) and `useChat` (client) so we don't hand-roll streaming, message-part parsing, or the tool-approval protocol ourselves. Swapping Groq for a different provider later would mostly mean changing one import and one model string — the rest of the plumbing (tools, approval, streaming) stays the same.

---

## 6. Glossary (quick reference)

| Term | Meaning here |
|---|---|
| **System prompt** | Developer-written instructions + data sent with every request; invisible to the end user, but the only way the model "knows" anything about the app. |
| **Streaming** | The model's response arrives incrementally over one HTTP connection instead of all at once. |
| **Tool / function calling** | A model can request a predefined function be run, with structured arguments — it never runs the function itself. |
| **`toolApproval: "user-approval"`** | A tool that requires explicit human confirmation before it's allowed to execute. |
| **`UIMessage` / message parts** | The frontend's representation of a message as an ordered list of typed pieces (text, tool calls, etc.), not a single string. |
| **`streamText`** | The server-side AI SDK function that calls the model and returns a streaming result. |
| **`useChat`** | The client-side AI SDK hook that manages conversation state and talks to our route handler. |
| **`createCaller`** | Lets server-side code call our existing tRPC procedures directly, without an HTTP round trip — used so the assistant reuses the same data-fetching and mutation logic as the rest of the app. |

---

## 7. The one-sentence security pitch, if someone asks

*"The model never touches the database and never sees secrets — it only ever sees a text summary we build fresh each time, it can only propose one of two narrow, single-row actions, and nothing executes until the user clicks Confirm."*
