const ALLOWED_ORIGINS = new Set([
  "https://nekogaku.com",
  "https://www.nekogaku.com",
  "https://astro.navfolio.site",
  "http://localhost:4321",
]);

const FROM_ADDRESS = "noreply@nekogaku.com";

function cors(origin) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };

  if (ALLOWED_ORIGINS.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}

function response(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: cors(origin),
  });
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function clean(value, max = 10000) {
  return String(value ?? "").trim().slice(0, max);
}

function cleanHeader(value, max = 200) {
  return clean(value, max).replace(/[\r\n]+/g, " ");
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

async function sendBlogComment(data, env) {
  const name = cleanHeader(
    data.name || data.author || data.displayName || "Anonymous",
    100
  );

  const email = cleanHeader(data.email, 254);

  const comment = clean(
    data.comment || data.body || data.message || data.text,
    10000
  );

  const articleTitle = cleanHeader(
    data.articleTitle || data.postTitle || data.title || "Blog article",
    250
  );

  const articleUrl = clean(
    data.articleUrl || data.pageUrl || data.url || data.href,
    2000
  );

  if (!comment) {
    throw new Error("Comment is required");
  }

  const mail = {
    from: FROM_ADDRESS,
    to: String(env.COMMENT_NOTIFY_TO).trim(),
    subject: `[NEXUS COMMENT] ${articleTitle}`,
    text: [
      "New blog comment",
      "",
      `Name: ${name}`,
      email ? `Email: ${email}` : "",
      `Article: ${articleTitle}`,
      articleUrl ? `URL: ${articleUrl}` : "",
      "",
      "Comment:",
      comment,
    ].filter(Boolean).join("\n"),
    html: `
      <h2>New blog comment</h2>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      ${email ? `<p><strong>Email:</strong> ${escapeHtml(email)}</p>` : ""}
      <p><strong>Article:</strong> ${escapeHtml(articleTitle)}</p>
      ${
        articleUrl
          ? `<p><strong>URL:</strong> <a href="${escapeHtml(articleUrl)}">${escapeHtml(articleUrl)}</a></p>`
          : ""
      }
      <hr>
      <p style="white-space:pre-wrap">${escapeHtml(comment)}</p>
    `,
  };

  if (validEmail(email)) {
    mail.replyTo = email;
  }

  return env.SEND_EMAIL.send(mail);
}

async function sendContact(data, env) {
  const name = cleanHeader(data.name || "Anonymous", 100);
  const email = cleanHeader(data.email, 254);
  const subject = cleanHeader(data.subject || "New message", 200);
  const message = clean(data.message || data.body || data.text, 10000);

  if (!validEmail(email)) {
    throw new Error("Valid email is required");
  }

  if (!message) {
    throw new Error("Message is required");
  }

  return env.SEND_EMAIL.send({
    from: FROM_ADDRESS,
    to: String(env.COMMENT_NOTIFY_TO).trim(),
    replyTo: email,
    subject: `[NEXUS CONTACT] ${subject}`,
    text: [
      "New website contact",
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      `Subject: ${subject}`,
      "",
      "Message:",
      message,
    ].join("\n"),
    html: `
      <h2>New website contact</h2>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
      <hr>
      <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
    `,
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      if (origin && !ALLOWED_ORIGINS.has(origin)) {
        return response({ ok: false, error: "Origin not allowed" }, 403, origin);
      }

      return new Response(null, {
        status: 204,
        headers: cors(origin),
      });
    }

    if (request.method === "GET" && url.pathname === "/") {
      return response(
        {
          ok: true,
          service: "nexus-contact",
          endpoints: ["/blog-comment", "/contact"],
        },
        200,
        origin
      );
    }

    if (request.method !== "POST") {
      return response({ ok: false, error: "Method not allowed" }, 405, origin);
    }

    if (origin && !ALLOWED_ORIGINS.has(origin)) {
      return response({ ok: false, error: "Origin not allowed" }, 403, origin);
    }

    if (!env.SEND_EMAIL || !env.COMMENT_NOTIFY_TO) {
      return response(
        { ok: false, error: "Worker configuration is incomplete" },
        500,
        origin
      );
    }

    if (url.pathname !== "/blog-comment" && url.pathname !== "/contact") {
      return response({ ok: false, error: "Not found" }, 404, origin);
    }

    try {
      const raw = await request.text();

      if (raw.length > 20000) {
        return response({ ok: false, error: "Payload too large" }, 413, origin);
      }

      const data = JSON.parse(raw);

      const result =
        url.pathname === "/blog-comment"
          ? await sendBlogComment(data, env)
          : await sendContact(data, env);

      return response(
        {
          ok: true,
          messageId: result.messageId,
        },
        200,
        origin
      );
    } catch (error) {
      console.error("nexus-contact error:", error);

      return response(
        {
          ok: false,
          error: error?.code || "Request failed",
          message: error?.message || null,
        },
        400,
        origin
      );
    }
  },
};