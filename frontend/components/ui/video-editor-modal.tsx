"use client";

import { useEffect, useRef, useState } from "react";
import { X, Volume2, VolumeX, Scissors, Loader2 } from "lucide-react";

// ffmpeg.wasm core is loaded on demand from a CDN at runtime so it never
// bloats the app bundle. Trim/mute use stream-copy (-c copy) — no re-encode,
// so it's fast, but trim snaps to the nearest keyframe rather than being frame-exact.
const CORE_BASE = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";

let ffmpegSingleton: import("@ffmpeg/ffmpeg").FFmpeg | null = null;
async function getFFmpeg() {
  if (ffmpegSingleton) return ffmpegSingleton;
  const { FFmpeg } = await import("@ffmpeg/ffmpeg");
  const { toBlobURL } = await import("@ffmpeg/util");
  const ffmpeg = new FFmpeg();
  await ffmpeg.load({
    coreURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, "application/wasm"),
  });
  ffmpegSingleton = ffmpeg;
  return ffmpeg;
}

export function VideoEditorModal({
  file,
  onCancel,
  onDone,
}: {
  file: File;
  onCancel: () => void;
  onDone: (editedFile: File) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [srcUrl] = useState(() => URL.createObjectURL(file));
  const [duration, setDuration] = useState(0);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [mute, setMute] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => URL.revokeObjectURL(srcUrl), [srcUrl]);

  const handleLoadedMetadata = () => {
    const d = videoRef.current?.duration ?? 0;
    setDuration(d);
    setEnd(d);
  };

  const trimmed = start > 0 || end < duration - 0.05;

  const handleSave = async () => {
    if (!trimmed && !mute) {
      onDone(file);
      return;
    }
    setProcessing(true);
    setError(null);
    try {
      const { fetchFile } = await import("@ffmpeg/util");
      const ffmpeg = await getFFmpeg();
      const inName = "in" + (file.name.match(/\.\w+$/)?.[0] || ".mp4");
      const outName = "out" + (file.name.match(/\.\w+$/)?.[0] || ".mp4");
      await ffmpeg.writeFile(inName, await fetchFile(file));

      const args = ["-i", inName];
      if (trimmed) {
        args.push("-ss", String(start), "-to", String(end));
      }
      args.push("-c", "copy");
      if (mute) {
        args.push("-an");
      }
      args.push(outName);

      await ffmpeg.exec(args);
      const data = await ffmpeg.readFile(outName);
      const blob = new Blob([data as BlobPart], { type: file.type || "video/mp4" });
      const editedFile = new File([blob], file.name, { type: file.type || "video/mp4" });

      await ffmpeg.deleteFile(inName);
      await ffmpeg.deleteFile(outName);

      onDone(editedFile);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not edit video");
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-medium text-[#3A2213]">Edit video</h3>
          <button onClick={onCancel} aria-label="Close" disabled={processing}>
            <X size={18} />
          </button>
        </div>

        <video
          ref={videoRef}
          src={srcUrl}
          controls
          muted={mute}
          onLoadedMetadata={handleLoadedMetadata}
          className="max-h-64 w-full rounded-lg bg-black"
        />

        {duration > 0 && (
          <div className="mt-4 space-y-3">
            <div>
              <div className="flex justify-between text-xs text-[#8B7A6E]">
                <span>Start: {start.toFixed(1)}s</span>
                <span>End: {end.toFixed(1)}s</span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <Scissors size={14} className="text-[#8B7A6E]" />
                <input
                  type="range"
                  min={0}
                  max={duration}
                  step={0.1}
                  value={start}
                  onChange={(e) => setStart(Math.min(Number(e.target.value), end - 0.1))}
                  className="w-full"
                  disabled={processing}
                />
                <input
                  type="range"
                  min={0}
                  max={duration}
                  step={0.1}
                  value={end}
                  onChange={(e) => setEnd(Math.max(Number(e.target.value), start + 0.1))}
                  className="w-full"
                  disabled={processing}
                />
              </div>
            </div>

            <button
              onClick={() => setMute((m) => !m)}
              disabled={processing}
              className="flex items-center gap-2 rounded-lg border border-[#3A2213]/12 px-3 py-1.5 text-sm text-[#3A2213]"
            >
              {mute ? <VolumeX size={16} /> : <Volume2 size={16} />}
              {mute ? "Muted" : "Mute video"}
            </button>
          </div>
        )}

        {error && <p className="mt-2 text-xs text-[#D94F70]">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={processing}
            className="rounded-lg px-4 py-2 text-sm text-[#8B7A6E]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={processing}
            className="flex items-center gap-2 rounded-lg bg-[#B17F5E] px-4 py-2 text-sm text-white"
          >
            {processing && <Loader2 size={14} className="animate-spin" />}
            {processing ? "Processing" : "Save & upload"}
          </button>
        </div>
      </div>
    </div>
  );
}
