function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function clean(value, maxLength = 1000) {
  return String(value ?? "")
    .replace(/\r/g, "")
    .trim()
    .slice(0, maxLength);
}

export async function onRequestPost({ request, env }) {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");

  if (origin) {
    const originUrl = new URL(origin);

    if (originUrl.host !== requestUrl.host) {
      return json({ ok: false, error: "bad_origin" }, 403);
    }
  }

  const length = Number(request.headers.get("content-length") ?? 0);

  if (length > 20000) {
    return json({ ok: false, error: "too_large" }, 413);
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "bad_json" }, 400);
  }

  const message = clean(body.message, 4000);
  const author = clean(body.author || "Anonymous", 120);
  const email = clean(body.email, 180);
  const articleTitle = clean(body.articleTitle || "Untitled article", 180);
  const articleUrl = clean(body.articleUrl || requestUrl.origin, 500);
  const articlePath = clean(body.articlePath || requestUrl.pathname, 240);

  if (message.length < 2) {
    return json({ ok: false, error: "empty_message" }, 400);
  }

  if (!env.RESEND_API_KEY || !env.COMMENT_NOTIFY_TO || !env.COMMENT_NOTIFY_FROM) {
    return json({ ok: false, error: "missing_env" }, 500);
  }

  const subjectPrefix = env.COMMENT_NOTIFY_SUBJECT_PREFIX || "[NEXUS COMMENT]";
  const subject = `${subjectPrefix} ${articleTitle}`;

  const text = [
    "New blog comment",
    "",
    `Article: ${articleTitle}`,
    `URL: ${articleUrl}`,
    `Path: ${articlePath}`,
    "",
    `Author: ${author}`,
    `Email: ${email || "(none)"}`,
    "",
    "Message:",
    message,
  ].join("\n");

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "authorization": `Bearer ${env.RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: env.COMMENT_NOTIFY_FROM,
      to: env.COMMENT_NOTIFY_TO.split(",").map((item) => item.trim()).filter(Boolean),
      reply_to: email || undefined,
      subject,
      text,
    }),
  });

  if (!resendResponse.ok) {
    return json({ ok: false, error: "send_failed" }, 502);
  }

  return json({ ok: true });
}

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequest() {
  return json({ ok: false, error: "method_not_allowed" }, 405);
}
