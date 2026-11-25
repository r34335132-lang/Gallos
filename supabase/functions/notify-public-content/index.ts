// Envia una notificacion push a la app publica cuando se publica una noticia o un evento.
// Se invoca desde los triggers de news y events (migracion 202610070002) con el header
// x-webhook-secret igual al secret PUSH_WEBHOOK_SECRET.
import { createClient } from "jsr:@supabase/supabase-js@2";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const EXPO_BATCH_SIZE = 100;
const PUBLISHED_STATUSES = ["publicada", "activa"];

type Row = Record<string, unknown> | null;

type WebhookPayload = {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: Row;
  old_record: Row;
};

type PushContent = { title: string; body: string; data: { url: string } };

function isPublished(row: Row) {
  const status = row?.status;
  return typeof status !== "string" || PUBLISHED_STATUSES.includes(status);
}

function buildContent({ type, table, record, old_record }: WebhookPayload): PushContent | null {
  if (!record || type === "DELETE" || !isPublished(record)) return null;
  // En UPDATE solo se notifica la transicion de borrador a publicado.
  if (type === "UPDATE" && isPublished(old_record)) return null;

  const title = String(record.title ?? "").trim();
  if (!title) return null;

  if (table === "news") {
    return { title: "Nueva noticia", body: title, data: { url: `/noticia/${record.id}` } };
  }
  if (table === "events") {
    return { title: "Nuevo evento", body: title, data: { url: "/eventos" } };
  }
  return null;
}

Deno.serve(async (req) => {
  const secret = Deno.env.get("PUSH_WEBHOOK_SECRET");
  if (!secret || req.headers.get("x-webhook-secret") !== secret) {
    return new Response("Unauthorized", { status: 401 });
  }

  const payload = (await req.json()) as WebhookPayload;
  const content = buildContent(payload);
  if (!content) {
    return Response.json({ sent: 0, skipped: true });
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: subscriptions, error } = await supabase.from("public_push_subscriptions").select("token");
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const tokens = (subscriptions ?? []).map((row) => row.token as string);
  const invalidTokens: string[] = [];
  let sent = 0;

  for (let i = 0; i < tokens.length; i += EXPO_BATCH_SIZE) {
    const batch = tokens.slice(i, i + EXPO_BATCH_SIZE);
    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(batch.map((to) => ({ to, sound: "default", ...content }))),
    });
    if (!response.ok) continue;

    const { data: tickets = [] } = await response.json();
    tickets.forEach((ticket: { status: string; details?: { error?: string } }, index: number) => {
      if (ticket.status === "ok") sent++;
      if (ticket.status === "error" && ticket.details?.error === "DeviceNotRegistered") {
        invalidTokens.push(batch[index]);
      }
    });
  }

  if (invalidTokens.length > 0) {
    await supabase.from("public_push_subscriptions").delete().in("token", invalidTokens);
  }

  return Response.json({ sent, removed: invalidTokens.length });
});
