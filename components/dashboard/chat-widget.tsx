"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  isToolUIPart,
  lastAssistantMessageIsCompleteWithApprovalResponses,
} from "ai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ChatMarkdown from "@/components/dashboard/chat-markdown";
import ChatToolCard from "@/components/dashboard/chat-tool-card";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn, trpc } from "@/lib/utils";
import {
  MessageCircleIcon,
  SendIcon,
  SparklesIcon,
  XIcon,
} from "lucide-react";

const SUGGESTIONS = [
  "What's my weakest stage right now?",
  "Summarize my pipeline in a sentence.",
  "Which applications are going stale?",
];

const POSITION_STORAGE_KEY = "trackr:chat-widget-position";
// Keep at least this much vertical room above the button reserved, so
// dragging it near the top of the screen never leaves no room for the panel.
const MIN_PANEL_SPACE = 360;
const DRAG_THRESHOLD = 4;

type Position = { right: number; bottom: number };

const ChatWidget = () => {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [position, setPosition] = useState<Position | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    startRight: number;
    startBottom: number;
    moved: boolean;
  } | null>(null);
  const justDraggedRef = useRef(false);
  const invalidatedToolCallIds = useRef<Set<string>>(new Set());

  const utils = trpc.useUtils();

  const { messages, sendMessage, addToolApprovalResponse, status, error } =
    useChat({
      transport: new DefaultChatTransport({ api: "/api/assistant/chat" }),
      sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
    });

  // Only used to render human-readable "Frontend Engineer at Stripe" labels
  // on pending tool-call cards — the assistant's own data access happens
  // entirely server-side, this is display only.
  const { data: jobsForLookup } = trpc.jobs.board.useQuery();
  const jobLookup = useMemo(() => {
    const map = new Map<string, { company: string; role: string }>();
    for (const job of jobsForLookup ?? []) {
      map.set(job.id, { company: job.companyName, role: job.roleTitle });
    }
    return map;
  }, [jobsForLookup]);

  // Tool calls mutate through a server-side tRPC caller (see the route
  // handler), not through this component's `trpc` client — so React Query's
  // cache never hears about it on its own. Once a tool call finishes, tell
  // every screen reading job data to refetch. Guarded by toolCallId so a
  // completed call is only invalidated once, even though this effect reruns
  // on every streamed token while the rest of the message keeps arriving.
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

  const isBusy = status === "submitted" || status === "streaming";

  const clampPosition = (pos: Position): Position => {
    const rect = containerRef.current?.getBoundingClientRect();
    const width = rect?.width ?? 48;
    const height = rect?.height ?? 48;
    const maxRight = Math.max(0, window.innerWidth - width);
    const maxBottom = Math.max(
      0,
      window.innerHeight - height - MIN_PANEL_SPACE,
    );
    return {
      right: Math.min(Math.max(pos.right, 0), maxRight),
      bottom: Math.min(Math.max(pos.bottom, 0), maxBottom),
    };
  };

  useEffect(() => {
    if (!open) return;
    viewportRef.current?.scrollTo({
      top: viewportRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, open, isBusy]);

  useEffect(() => {
    const stored = localStorage.getItem(POSITION_STORAGE_KEY);
    if (!stored) return;
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reading persisted position from localStorage has no render-time equivalent (SSR-unsafe to read during render)
      setPosition(clampPosition(JSON.parse(stored)));
    } catch {
      // ignore malformed/stale stored value
    }
  }, []);

  useEffect(() => {
    const onResize = () => {
      setPosition((prev) => (prev ? clampPosition(prev) : prev));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (open || isMobile) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startRight: window.innerWidth - rect.right,
      startBottom: window.innerHeight - rect.bottom,
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
      drag.moved = true;
      justDraggedRef.current = true;
    }
    if (!drag.moved) return;
    setPosition(
      clampPosition({
        right: drag.startRight - dx,
        bottom: drag.startBottom - dy,
      }),
    );
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    dragRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
    if (drag?.moved) {
      setPosition((prev) => {
        if (prev) localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(prev));
        return prev;
      });
    }
  };

  const handleButtonClick = () => {
    if (justDraggedRef.current) {
      justDraggedRef.current = false;
      return;
    }
    setOpen((v) => !v);
  };

  const submit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isBusy) return;
    sendMessage({ text: trimmed });
    setInput("");
  };

  // Dragging is desktop-only (see handlePointerDown) — ignore any position
  // saved from a previous desktop session while on a mobile viewport, so
  // mobile always gets the plain, predictable default corner.
  const effectivePosition = isMobile ? null : position;

  return (
    <div
      ref={containerRef}
      className={cn(
        "fixed z-50 flex flex-col items-end gap-3",
        !effectivePosition && "bottom-5 right-3 sm:bottom-6 sm:right-6",
      )}
      style={
        effectivePosition
          ? { right: effectivePosition.right, bottom: effectivePosition.bottom }
          : undefined
      }
    >
      {open && (
        <div className="flex h-[calc(100vh-7rem)] w-[calc(100vw-1.5rem)] max-w-none flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl shadow-slate-300/40 sm:h-[32rem] sm:max-h-[calc(100vh-8rem)] sm:w-[calc(100vw-2.5rem)] sm:max-w-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <SparklesIcon className="h-4 w-4 text-blue-700 dark:text-blue-400" />
              <span className="text-sm font-semibold">Trackr Assistant</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>

          <div
            ref={viewportRef}
            className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
          >
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Ask about your pipeline — stats, weak spots, follow-ups.
                </p>
                <div className="flex flex-col gap-2">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => submit(suggestion)}
                      className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex flex-col gap-2 ${message.role === "user" ? "items-end" : "items-start"}`}
              >
                {message.parts.map((part, index) => {
                  if (part.type === "text") {
                    return (
                      <div
                        key={index}
                        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                          message.role === "user"
                            ? "bg-blue-700 text-white whitespace-pre-wrap"
                            : "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                        }`}
                      >
                        {message.role === "user" ? (
                          <span>{part.text}</span>
                        ) : (
                          <ChatMarkdown content={part.text} />
                        )}
                      </div>
                    );
                  }

                  if (isToolUIPart(part)) {
                    return (
                      <div key={index} className="w-full max-w-[85%]">
                        <ChatToolCard
                          part={part}
                          jobLookup={jobLookup}
                          onRespond={addToolApprovalResponse}
                        />
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            ))}

            {status === "submitted" && (
              <div className="flex justify-start">
                <div className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                  Thinking…
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
                Something went wrong. Try again.
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit(input);
            }}
            className="flex items-center gap-2 border-t border-slate-200 p-3 dark:border-slate-800"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question…"
              disabled={isBusy}
              className="bg-white dark:bg-slate-900"
            />
            <Button
              type="submit"
              size="icon"
              disabled={isBusy || !input.trim()}
              className="shrink-0 bg-blue-700 text-white hover:bg-blue-600"
              aria-label="Send"
            >
              <SendIcon className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}

      <Button
        size="icon"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={handleButtonClick}
        style={{ touchAction: "none" }}
        className={cn(
          "h-14 w-14 rounded-full bg-blue-700 text-white shadow-lg hover:bg-blue-600 sm:h-12 sm:w-12",
          !open && !isMobile && "cursor-grab active:cursor-grabbing",
        )}
        aria-label={
          open
            ? "Close assistant"
            : isMobile
              ? "Open assistant"
              : "Open assistant (drag to move)"
        }
      >
        {open ? (
          <XIcon className="h-6 w-6 sm:h-5 sm:w-5" />
        ) : (
          <MessageCircleIcon className="h-6 w-6 sm:h-5 sm:w-5" />
        )}
      </Button>
    </div>
  );
};

export default ChatWidget;
