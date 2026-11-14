(() => {
  if (window.__nexusWalineNotifyInstalled) return;
  window.__nexusWalineNotifyInstalled = true;

  const notifyEndpoint =
    "https://nexus-contact.catlogy110.workers.dev/blog-comment";

  const originalFetch = window.fetch.bind(window);

  function getUrl(input) {
    if (typeof input === "string") return input;
    if (input instanceof URL) return input.href;
    if (input instanceof Request) return input.url;
    return "";
  }

  function getMethod(input, init) {
    if (init?.method) return String(init.method).toUpperCase();
    if (input instanceof Request) {
      return String(input.method || "GET").toUpperCase();
    }
    return "GET";
  }

  async function getBody(input, init) {
    let body = init?.body;

    if (body == null && input instanceof Request) {
      try {
        body = await input.clone().text();
      } catch {
        return null;
      }
    }

    if (typeof body === "string") {
      try {
        return JSON.parse(body);
      } catch {
        return null;
      }
    }

    if (body instanceof URLSearchParams) {
      return Object.fromEntries(body.entries());
    }

    if (body instanceof FormData) {
      return Object.fromEntries(body.entries());
    }

    return null;
  }

  window.fetch = async function nexusFetch(input, init) {
    const requestUrl = getUrl(input);
    const method = getMethod(input, init);

    let pathname = "";

    try {
      pathname = new URL(requestUrl, window.location.href).pathname;
    } catch {
      pathname = "";
    }

    const isWalineCommentPost =
      method === "POST" &&
      pathname.endsWith("/api/comment") &&
      !requestUrl.includes("nexus-contact.catlogy110.workers.dev");

    const bodyPromise = isWalineCommentPost
      ? getBody(input, init)
      : Promise.resolve(null);

    const response = await originalFetch(input, init);

    if (!isWalineCommentPost || !response.ok) {
      return response;
    }

    let accepted = true;

    try {
      const result = await response.clone().json();

      if (
        result &&
        Object.prototype.hasOwnProperty.call(result, "errno") &&
        Number(result.errno) !== 0
      ) {
        accepted = false;
      }
    } catch {
      // HTTP successなら続行
    }

    if (!accepted) {
      return response;
    }

    const payload = await bodyPromise;

    if (!payload?.comment) {
      return response;
    }

    const pageType = window.location.pathname.startsWith("/portfolio")
      ? "portfolio"
      : "blog";

    const notification = {
      name: payload.nick || "Anonymous",
      email: payload.mail || "",
      comment: payload.comment,
      articleTitle: document.title || "NEXUS",
      articleUrl: window.location.href,
      pageType
    };

    originalFetch(notifyEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(notification)
    }).catch((error) => {
      console.error("NEXUS comment notification failed:", error);
    });

    return response;
  };
})();