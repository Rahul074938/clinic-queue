import { type NextRequest } from "next/server";
import { getLiveQueue } from "@/lib/queue";

/**
 * Server-Sent Events stream for real-time queue updates.
 * Broadcasts the full queue state every 5 seconds.
 */
export async function GET(_req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let active = true;

      const send = async () => {
        if (!active) return;
        try {
          const queue = await getLiveQueue();
          const data = JSON.stringify(queue);
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch {
          controller.enqueue(encoder.encode(`data: {"error":"fetch_failed"}\n\n`));
        }
      };

      // Send immediately on connect
      await send();

      // Then poll every 5 seconds
      const interval = setInterval(() => {
        void send();
      }, 5000);

      // Cleanup on disconnect
      void _req.signal.addEventListener("abort", () => {
        active = false;
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
