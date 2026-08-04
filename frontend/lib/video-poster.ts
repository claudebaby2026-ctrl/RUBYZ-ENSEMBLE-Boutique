// Cart line items store a single flat `image` string (see ApiCartItem in
// lib/api.ts) that's rendered with a plain <img>, so a video URL can't be
// dropped in directly the way it can on a card. Instead, when a product
// has no images but does have a video, we grab a still frame from that
// video and store *that* (as a data URL) as the cart item's "image" — a
// static-looking preview frame, exactly like the card fallback, just
// captured once up front instead of rendered live.
export function captureVideoPosterFrame(videoUrl: string): Promise<string | undefined> {
  return new Promise((resolve) => {
    if (typeof document === "undefined") {
      resolve(undefined);
      return;
    }

    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.preload = "metadata";
    video.src = videoUrl;

    const cleanup = () => {
      video.removeEventListener("loadeddata", onLoaded);
      video.removeEventListener("error", onError);
    };

    const onError = () => {
      cleanup();
      resolve(undefined);
    };

    const onLoaded = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 320;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          cleanup();
          resolve(undefined);
          return;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        cleanup();
        resolve(dataUrl);
      } catch {
        // Most likely a cross-origin canvas taint (video served without
        // permissive CORS headers) — fail soft, cart item just won't have
        // a thumbnail, same as a product with no media at all.
        cleanup();
        resolve(undefined);
      }
    };

    video.addEventListener("loadeddata", onLoaded);
    video.addEventListener("error", onError);
  });
}
