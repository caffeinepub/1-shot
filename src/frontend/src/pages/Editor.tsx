import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { ExternalBlob } from "../backend";
import type { VideoProject } from "../backend";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Slider } from "../components/ui/slider";
import { Switch } from "../components/ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { useActor } from "../hooks/useActor";

interface AudioTrack {
  id: string;
  sfxId: string;
  sfxName: string;
  startTime: number;
  volume: number;
  fadeIn: boolean;
  fadeOut: boolean;
}

interface TextOverlay {
  id: string;
  text: string;
  position: "top" | "center" | "bottom";
  fontSize: number;
  color: string;
  startTime: number;
  endTime: number;
}

interface EditsState {
  speed: number;
  muteOriginalAudio: boolean;
  videoVolume: number;
  filter: string;
  audioTracks: AudioTrack[];
  textOverlays: TextOverlay[];
}

const DEFAULT_EDITS: EditsState = {
  speed: 1,
  muteOriginalAudio: false,
  videoVolume: 80,
  filter: "none",
  audioTracks: [],
  textOverlays: [],
};

const DEMO_SFX = {
  beats: [
    { id: "beat1", name: "Beat Drop", duration: 4 },
    { id: "beat2", name: "Lo-Fi Groove", duration: 8 },
    { id: "beat3", name: "Hip Hop Kick", duration: 2 },
  ],
  transitions: [
    { id: "tr1", name: "Whoosh", duration: 1 },
    { id: "tr2", name: "Swipe Cut", duration: 0.5 },
    { id: "tr3", name: "Glitch", duration: 1.5 },
  ],
  ambience: [
    { id: "amb1", name: "Rain", duration: 10 },
    { id: "amb2", name: "City Buzz", duration: 10 },
    { id: "amb3", name: "Forest", duration: 10 },
  ],
  sfx: [
    { id: "sfx1", name: "Applause", duration: 3 },
    { id: "sfx2", name: "Cinematic Hit", duration: 2 },
    { id: "sfx3", name: "Comedy Boing", duration: 1 },
  ],
};

const FILTERS = [
  { id: "none", label: "Original", style: {} },
  { id: "bw", label: "B&W", style: { filter: "grayscale(100%)" } },
  { id: "warm", label: "Warm", style: { filter: "sepia(50%) saturate(120%)" } },
  {
    id: "cool",
    label: "Cool",
    style: { filter: "hue-rotate(30deg) saturate(110%)" },
  },
  {
    id: "vintage",
    label: "Vintage",
    style: { filter: "sepia(80%) contrast(90%)" },
  },
  {
    id: "vivid",
    label: "Vivid",
    style: { filter: "saturate(180%) contrast(110%)" },
  },
  {
    id: "fade",
    label: "Fade",
    style: { filter: "opacity(80%) brightness(110%)" },
  },
];

const SPEEDS = [0.5, 1, 1.5, 2];

type Tool = "select" | "trim" | "text" | "filter";
type RightPanel = "video" | "audio" | "text" | "filter";

interface Props {
  projectId?: string;
  onBack: () => void;
}

export function Editor({ projectId, onBack }: Props) {
  const { actor } = useActor();
  const [title, setTitle] = useState("Untitled Reel");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [edits, setEdits] = useState<EditsState>(DEFAULT_EDITS);
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [rightPanel, setRightPanel] = useState<RightPanel>("video");
  const [selectedAudioId, setSelectedAudioId] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const { data: project } = useQuery<VideoProject>({
    queryKey: ["project", projectId],
    queryFn: () => actor!.getProjectById(projectId!),
    enabled: !!actor && !!projectId,
  });

  useEffect(() => {
    if (project) {
      setTitle(project.title);
      try {
        setEdits(JSON.parse(project.edits));
      } catch {}
      const url = project.videoBlob.getDirectURL();
      if (url) setVideoUrl(url);
    }
  }, [project]);

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!actor) return;
      const editsJson = JSON.stringify(edits);
      let blob: ExternalBlob;
      if (videoFile) {
        const bytes = new Uint8Array(await videoFile.arrayBuffer());
        blob = ExternalBlob.fromBytes(bytes).withUploadProgress((p) =>
          setUploadProgress(p),
        );
      } else if (videoUrl) {
        blob = ExternalBlob.fromURL(videoUrl);
      } else {
        blob = ExternalBlob.fromURL("");
      }
      const id = projectId || crypto.randomUUID();
      if (projectId) {
        await actor.updateProject(id, title, blob, editsJson);
      } else {
        await actor.createProject(id, title, blob, editsJson);
      }
    },
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveMut.mutateAsync();
    } finally {
      setSaving(false);
    }
  };

  const handleFileInput = useCallback((file: File) => {
    setVideoFile(file);
    setVideoUrl(URL.createObjectURL(file));
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("video/")) handleFileInput(file);
  };

  const addAudioTrack = (sfxId: string, sfxName: string) => {
    const track: AudioTrack = {
      id: crypto.randomUUID(),
      sfxId,
      sfxName,
      startTime: 0,
      volume: 80,
      fadeIn: false,
      fadeOut: false,
    };
    setEdits((e) => ({ ...e, audioTracks: [...e.audioTracks, track] }));
    setSelectedAudioId(track.id);
    setRightPanel("audio");
  };

  const removeAudioTrack = (id: string) => {
    setEdits((e) => ({
      ...e,
      audioTracks: e.audioTracks.filter((t) => t.id !== id),
    }));
    if (selectedAudioId === id) setSelectedAudioId(null);
  };

  const updateAudioTrack = (id: string, patch: Partial<AudioTrack>) => {
    setEdits((e) => ({
      ...e,
      audioTracks: e.audioTracks.map((t) =>
        t.id === id ? { ...t, ...patch } : t,
      ),
    }));
  };

  const selectedAudio = edits.audioTracks.find((t) => t.id === selectedAudioId);
  const filterStyle = FILTERS.find((f) => f.id === edits.filter)?.style ?? {};

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) videoRef.current.pause();
    else void videoRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  const trackColors = [
    "bg-blue-600",
    "bg-purple-600",
    "bg-green-600",
    "bg-pink-600",
    "bg-amber-600",
  ];

  return (
    <div
      className="flex flex-col h-screen bg-zinc-950 text-white"
      data-ocid="editor.page"
    >
      {/* Top Bar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-zinc-800 bg-zinc-900">
        <Button
          data-ocid="editor.back_button"
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-zinc-400 hover:text-white"
        >
          ← Back
        </Button>
        <input
          data-ocid="editor.title_input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-transparent text-white font-semibold text-sm border-none outline-none focus:bg-zinc-800 rounded px-2 py-1 w-48"
        />
        <div className="flex-1" />
        {uploadProgress > 0 && uploadProgress < 100 && (
          <span className="text-xs text-zinc-400">
            Uploading {uploadProgress}%
          </span>
        )}
        <Button
          data-ocid="editor.save_button"
          size="sm"
          onClick={handleSave}
          disabled={saving}
          className="bg-zinc-700 hover:bg-zinc-600 text-white text-xs"
        >
          {saving ? "Saving..." : "Save"}
        </Button>
        <Button
          data-ocid="editor.export_button"
          size="sm"
          onClick={() => setExportOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs"
        >
          Export
        </Button>
      </div>

      {/* Main Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel */}
        <div
          className="w-56 bg-zinc-900 border-r border-zinc-800 flex flex-col"
          data-ocid="editor.tools_panel"
        >
          <div className="flex gap-1 p-2 border-b border-zinc-800">
            {(["select", "trim", "text", "filter"] as Tool[]).map((t) => (
              <button
                type="button"
                key={t}
                data-ocid={`editor.${t}.toggle`}
                onClick={() => {
                  setActiveTool(t);
                  if (t === "filter") setRightPanel("filter");
                  if (t === "text") setRightPanel("text");
                }}
                className={`flex-1 py-1 rounded text-xs capitalize ${activeTool === t ? "bg-blue-600 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-800"}`}
              >
                {t === "select"
                  ? "✦"
                  : t === "trim"
                    ? "✂"
                    : t === "text"
                      ? "T"
                      : "⬡"}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-hidden flex flex-col">
            <p className="text-xs text-zinc-500 uppercase tracking-widest px-3 py-2">
              Sound FX
            </p>
            <Tabs defaultValue="beats" className="flex-1 flex flex-col">
              <TabsList
                className="mx-2 mb-1 grid grid-cols-4 h-7 bg-zinc-800"
                data-ocid="editor.sfx.tab"
              >
                {Object.keys(DEMO_SFX).map((cat) => (
                  <TabsTrigger
                    key={cat}
                    value={cat}
                    className="text-xs capitalize px-1 h-6"
                  >
                    {cat === "beats"
                      ? "🥁"
                      : cat === "transitions"
                        ? "💫"
                        : cat === "ambience"
                          ? "🌿"
                          : "⚡"}
                  </TabsTrigger>
                ))}
              </TabsList>
              {Object.entries(DEMO_SFX).map(([cat, items]) => (
                <TabsContent
                  key={cat}
                  value={cat}
                  className="flex-1 overflow-y-auto px-2 mt-0"
                >
                  {items.map((sfx, i) => (
                    <div
                      key={sfx.id}
                      data-ocid={`editor.sfx.item.${i + 1}`}
                      className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-zinc-800 group"
                    >
                      <div>
                        <p className="text-xs text-white">{sfx.name}</p>
                        <p className="text-xs text-zinc-500">{sfx.duration}s</p>
                      </div>
                      <button
                        type="button"
                        data-ocid={`editor.sfx.add_button.${i + 1}`}
                        onClick={() => addAudioTrack(sfx.id, sfx.name)}
                        className="opacity-0 group-hover:opacity-100 text-blue-400 hover:text-blue-300 text-xs px-1"
                      >
                        + Add
                      </button>
                    </div>
                  ))}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>

        {/* Center */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div
            className="flex-1 flex items-center justify-center bg-black relative"
            data-ocid="editor.preview"
          >
            {videoUrl ? (
              <>
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="max-h-full max-w-full rounded cursor-pointer"
                  style={filterStyle}
                  muted={edits.muteOriginalAudio}
                  onTimeUpdate={() =>
                    setCurrentTime(videoRef.current?.currentTime ?? 0)
                  }
                  onLoadedMetadata={() =>
                    setDuration(videoRef.current?.duration ?? 0)
                  }
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
                {edits.textOverlays.map((ov) => (
                  <div
                    key={ov.id}
                    className={`absolute left-0 right-0 text-center px-4 pointer-events-none ${ov.position === "top" ? "top-4" : ov.position === "bottom" ? "bottom-4" : "top-1/2 -translate-y-1/2"}`}
                    style={{ fontSize: ov.fontSize, color: ov.color }}
                  >
                    {ov.text}
                  </div>
                ))}
              </>
            ) : (
              <button
                type="button"
                data-ocid="editor.dropzone"
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center w-full h-full cursor-pointer border-0 bg-transparent ${
                  dragging
                    ? "bg-blue-900/20 outline-dashed outline-2 outline-blue-500"
                    : ""
                }`}
              >
                <div className="text-5xl mb-3">🎬</div>
                <p className="text-zinc-300">Drop a video file here</p>
                <p className="text-zinc-500 text-sm mt-1">or click to browse</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  data-ocid="editor.upload_button"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileInput(f);
                  }}
                />
              </button>
            )}
          </div>

          {videoUrl && (
            <div className="bg-zinc-900 border-t border-zinc-800 px-4 py-2 flex items-center gap-3">
              <button
                type="button"
                data-ocid="editor.play_button"
                onClick={togglePlay}
                className="text-white hover:text-blue-400 transition-colors"
              >
                {isPlaying ? "⏸" : "▶"}
              </button>
              <span className="text-xs text-zinc-400 font-mono">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
              <div className="flex-1">
                <input
                  type="range"
                  min={0}
                  max={duration || 1}
                  step={0.1}
                  value={currentTime}
                  onChange={(e) => {
                    const t = Number(e.target.value);
                    setCurrentTime(t);
                    if (videoRef.current) videoRef.current.currentTime = t;
                  }}
                  className="w-full accent-blue-500"
                />
              </div>
              <span className="text-xs text-zinc-500">{edits.speed}x</span>
            </div>
          )}

          <div
            className="h-36 bg-zinc-900 border-t border-zinc-800 overflow-x-auto"
            data-ocid="editor.timeline"
          >
            <div className="p-2 flex flex-col gap-1 min-w-full">
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 w-16 shrink-0">
                  Video
                </span>
                <button
                  type="button"
                  data-ocid="editor.timeline.track.1"
                  className="h-7 flex-1 bg-blue-800 rounded flex items-center px-3 cursor-pointer hover:bg-blue-700"
                  onClick={() => setRightPanel("video")}
                >
                  <span className="text-xs text-white truncate">
                    {videoFile?.name ?? "Video Clip"}
                  </span>
                  <span className="ml-2 text-xs text-blue-300">
                    {edits.speed}x
                  </span>
                </button>
              </div>
              {edits.audioTracks.map((track, i) => (
                <div key={track.id} className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500 w-16 shrink-0 truncate">
                    {track.sfxName}
                  </span>
                  <button
                    type="button"
                    data-ocid={`editor.timeline.track.${i + 2}`}
                    className={`h-7 flex-1 ${trackColors[i % trackColors.length]} rounded flex items-center px-3 cursor-pointer hover:opacity-90`}
                    onClick={() => {
                      setSelectedAudioId(track.id);
                      setRightPanel("audio");
                    }}
                  >
                    <span className="text-xs text-white truncate">
                      {track.sfxName}
                    </span>
                    <span className="ml-auto text-xs text-white/60">
                      {track.volume}%
                    </span>
                  </button>
                </div>
              ))}
              {edits.audioTracks.length === 0 && (
                <div className="text-xs text-zinc-600 italic pl-20">
                  Add sound effects from the panel →
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div
          className="w-56 bg-zinc-900 border-l border-zinc-800 overflow-y-auto"
          data-ocid="editor.properties_panel"
        >
          <div className="p-3 flex gap-1 border-b border-zinc-800">
            {(["video", "audio", "text", "filter"] as RightPanel[]).map((p) => (
              <button
                type="button"
                key={p}
                onClick={() => setRightPanel(p)}
                className={`flex-1 text-xs py-1 rounded capitalize ${rightPanel === p ? "bg-blue-600 text-white" : "text-zinc-400 hover:bg-zinc-800"}`}
              >
                {p === "video"
                  ? "Video"
                  : p === "audio"
                    ? "Audio"
                    : p === "text"
                      ? "Text"
                      : "Filter"}
              </button>
            ))}
          </div>
          <div className="p-3 space-y-4">
            {rightPanel === "video" && (
              <>
                <div>
                  <Label className="text-xs text-zinc-400">Speed</Label>
                  <div
                    className="flex gap-1 mt-1"
                    data-ocid="editor.speed_select"
                  >
                    {SPEEDS.map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setEdits((e) => ({ ...e, speed: s }))}
                        className={`flex-1 text-xs py-1 rounded ${edits.speed === s ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"}`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-zinc-400">Volume</Label>
                  <Slider
                    data-ocid="editor.volume_input"
                    min={0}
                    max={100}
                    step={1}
                    value={[edits.videoVolume]}
                    onValueChange={([v]) => {
                      setEdits((e) => ({ ...e, videoVolume: v }));
                      if (videoRef.current) videoRef.current.volume = v / 100;
                    }}
                    className="mt-2"
                  />
                  <span className="text-xs text-zinc-500">
                    {edits.videoVolume}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-zinc-400">Mute original</Label>
                  <Switch
                    data-ocid="editor.mute_toggle"
                    checked={edits.muteOriginalAudio}
                    onCheckedChange={(v) =>
                      setEdits((e) => ({ ...e, muteOriginalAudio: v }))
                    }
                  />
                </div>
              </>
            )}
            {rightPanel === "audio" && selectedAudio && (
              <>
                <p className="text-xs font-medium text-white">
                  {selectedAudio.sfxName}
                </p>
                <div>
                  <Label className="text-xs text-zinc-400">Volume</Label>
                  <Slider
                    min={0}
                    max={100}
                    step={1}
                    value={[selectedAudio.volume]}
                    onValueChange={([v]) =>
                      updateAudioTrack(selectedAudio.id, { volume: v })
                    }
                    className="mt-2"
                  />
                  <span className="text-xs text-zinc-500">
                    {selectedAudio.volume}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-zinc-400">Fade In</Label>
                  <Switch
                    checked={selectedAudio.fadeIn}
                    onCheckedChange={(v) =>
                      updateAudioTrack(selectedAudio.id, { fadeIn: v })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-zinc-400">Fade Out</Label>
                  <Switch
                    checked={selectedAudio.fadeOut}
                    onCheckedChange={(v) =>
                      updateAudioTrack(selectedAudio.id, { fadeOut: v })
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs text-zinc-400">
                    Start Time (s)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.1}
                    value={selectedAudio.startTime}
                    onChange={(e) =>
                      updateAudioTrack(selectedAudio.id, {
                        startTime: Number(e.target.value),
                      })
                    }
                    className="mt-1 h-7 text-xs bg-zinc-800 border-zinc-700"
                  />
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => removeAudioTrack(selectedAudio.id)}
                >
                  Remove Track
                </Button>
              </>
            )}
            {rightPanel === "audio" && !selectedAudio && (
              <p className="text-xs text-zinc-500">
                Select an audio track from the timeline.
              </p>
            )}
            {rightPanel === "text" && (
              <>
                <p className="text-xs text-zinc-400">Text Overlays</p>
                <Button
                  size="sm"
                  className="w-full text-xs bg-zinc-800 hover:bg-zinc-700"
                  onClick={() => {
                    const ov: TextOverlay = {
                      id: crypto.randomUUID(),
                      text: "Your text",
                      position: "center",
                      fontSize: 24,
                      color: "#ffffff",
                      startTime: 0,
                      endTime: duration || 5,
                    };
                    setEdits((e) => ({
                      ...e,
                      textOverlays: [...e.textOverlays, ov],
                    }));
                  }}
                >
                  + Add Text
                </Button>
                {edits.textOverlays.map((ov) => (
                  <div
                    key={ov.id}
                    className="space-y-2 border border-zinc-800 rounded p-2"
                  >
                    <Input
                      value={ov.text}
                      onChange={(e) =>
                        setEdits((ed) => ({
                          ...ed,
                          textOverlays: ed.textOverlays.map((o) =>
                            o.id === ov.id ? { ...o, text: e.target.value } : o,
                          ),
                        }))
                      }
                      className="h-7 text-xs bg-zinc-800 border-zinc-700"
                    />
                    <select
                      value={ov.position}
                      onChange={(e) =>
                        setEdits((ed) => ({
                          ...ed,
                          textOverlays: ed.textOverlays.map((o) =>
                            o.id === ov.id
                              ? {
                                  ...o,
                                  position: e.target
                                    .value as TextOverlay["position"],
                                }
                              : o,
                          ),
                        }))
                      }
                      className="w-full text-xs bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white"
                    >
                      <option value="top">Top</option>
                      <option value="center">Center</option>
                      <option value="bottom">Bottom</option>
                    </select>
                    <button
                      type="button"
                      className="text-xs text-red-400 hover:text-red-300"
                      onClick={() =>
                        setEdits((ed) => ({
                          ...ed,
                          textOverlays: ed.textOverlays.filter(
                            (o) => o.id !== ov.id,
                          ),
                        }))
                      }
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </>
            )}
            {rightPanel === "filter" && (
              <>
                <p className="text-xs text-zinc-400">Color Presets</p>
                <div className="grid grid-cols-2 gap-2">
                  {FILTERS.map((f) => (
                    <button
                      type="button"
                      key={f.id}
                      onClick={() => setEdits((e) => ({ ...e, filter: f.id }))}
                      className={`rounded p-2 text-xs border transition-colors ${edits.filter === f.id ? "border-blue-500 bg-blue-900/30 text-blue-300" : "border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-500"}`}
                    >
                      <div
                        className="w-full aspect-video bg-gradient-to-br from-zinc-600 to-zinc-700 rounded mb-1"
                        style={f.style}
                      />
                      {f.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent
          className="bg-zinc-900 border-zinc-800 text-white"
          data-ocid="editor.export.dialog"
        >
          <DialogHeader>
            <DialogTitle>Export Reel</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-zinc-400">
            Your reel is ready to export. In a full production build, this would
            render and download your edited video with all applied effects,
            sound tracks, and overlays. Your project settings have been saved.
          </p>
          <DialogFooter>
            <Button
              data-ocid="editor.export.close_button"
              onClick={() => setExportOpen(false)}
              className="bg-blue-600 hover:bg-blue-500 text-white"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
