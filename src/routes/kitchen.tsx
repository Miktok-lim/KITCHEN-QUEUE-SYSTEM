import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  Ban,
  CheckCircle2,
  ChefHat,
  Clock,
  Mic,
  MicOff,
  PackageCheck,
  PackageX,
  Play,
  RotateCcw,
  Settings2,
  ShieldAlert,
  Sliders,
  Sparkles,
  Square,
  Trash2,
  Upload,
  Utensils,
  Volume2,
  VolumeX,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  money,
  remaining,
  setOrderStatus,
  updateMenuItem,
  useCanteen,
  type MenuItem,
  type Order,
  type OrderStatus,
} from "@/lib/canteen-store";

export const Route = createFileRoute("/kitchen")({
  head: () => ({
    meta: [
      { title: "Kitchen Staff Orders & Custom Voice — College Kitchen" },
      {
        name: "description",
        content:
          "Live incoming orders with custom voice speech announcements, audio recorder, and menu stock controls.",
      },
      { property: "og:title", content: "Kitchen Staff Orders & Custom Voice — College Kitchen" },
      {
        property: "og:description",
        content: "Incoming orders, custom voice engine, and sold-out controls for canteen staff.",
      },
    ],
  }),
  component: KitchenBoard,
});

export type VoiceConfig = {
  voiceURI: string;
  rate: number;
  pitch: number;
  prefixPhrase: string;
  customAudioBase64?: string | undefined;
  useCustomAudioFirst: boolean;
};

const DEFAULT_VOICE_CONFIG: VoiceConfig = {
  voiceURI: "",
  rate: 1.0,
  pitch: 1.0,
  prefixPhrase: "New order! Token",
  useCustomAudioFirst: false,
};

const VOICE_CONFIG_KEY = "college-canteen-custom-voice-v1";

function loadVoiceConfig(): VoiceConfig {
  if (typeof window === "undefined") return DEFAULT_VOICE_CONFIG;
  try {
    const raw = window.localStorage.getItem(VOICE_CONFIG_KEY);
    if (raw) return { ...DEFAULT_VOICE_CONFIG, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_VOICE_CONFIG;
}

function saveVoiceConfig(config: VoiceConfig) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(VOICE_CONFIG_KEY, JSON.stringify(config));
  } catch {}
}

// Sound chime generator using Web Audio API
function playOrderChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const now = ctx.currentTime;
    // Tone 1: 587 Hz (D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    // Tone 2: 880 Hz (A5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, now + 0.15);
    gain2.gain.setValueAtTime(0.3, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.5);
  } catch (e) {
    /* ignore audio context restrictions */
  }
}

// Custom Audio & Speech Synthesizer
async function speakOrderAnnouncement(order: Order, config: VoiceConfig) {
  if (typeof window === "undefined") return;

  const itemsSummary = order.lines.map((l) => `${l.qty} ${l.name}`).join(", and ");
  const textToSpeak = `${config.prefixPhrase} ${order.token}. ${itemsSummary}.`;

  // Step 1: If staff uploaded/recorded custom audio clip, play it first!
  if (config.customAudioBase64 && config.useCustomAudioFirst) {
    try {
      const audio = new Audio(config.customAudioBase64);
      await new Promise<void>((resolve) => {
        audio.onended = () => resolve();
        audio.onerror = () => resolve();
        audio.play().catch(() => resolve());
      });
    } catch {
      playOrderChime();
    }
  } else {
    playOrderChime();
  }

  // Step 2: Text-To-Speech Synthesis
  if (!("speechSynthesis" in window)) return;

  try {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = Math.max(0.5, Math.min(2.0, config.rate));
    utterance.pitch = Math.max(0.5, Math.min(1.5, config.pitch));
    utterance.volume = 1.0;

    const voices = window.speechSynthesis.getVoices();
    if (config.voiceURI) {
      const selected = voices.find((v) => v.voiceURI === config.voiceURI);
      if (selected) utterance.voice = selected;
    } else {
      const naturalVoice =
        voices.find(
          (v) =>
            v.lang.startsWith("en") &&
            (v.name.includes("Google") ||
              v.name.includes("Natural") ||
              v.name.includes("Samantha")),
        ) || voices.find((v) => v.lang.startsWith("en"));
      if (naturalVoice) utterance.voice = naturalVoice;
    }

    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 200);
  } catch (err) {
    console.error("Speech synthesis failed:", err);
  }
}

function KitchenBoard() {
  const orders = useCanteen((s) => s.orders);
  const menu = useCanteen((s) => s.menu);
  const currentUser = useCanteen((s) => s.currentUser);

  // Voice notification state
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voiceConfig, setVoiceConfig] = useState<VoiceConfig>(DEFAULT_VOICE_CONFIG);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Track orders that have already been announced to avoid duplicate voice alerts
  const announcedRef = useRef<Set<string>>(new Set());
  const initialMountRef = useRef(true);

  const queuedOrders = orders.filter((o) => o.status === "queued" || o.status === "preparing");
  const readyOrders = orders.filter((o) => o.status === "ready");

  // Load available speech voices and config
  useEffect(() => {
    const saved = loadVoiceConfig();
    setVoiceConfig(saved);

    const updateVoices = () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        const vList = window.speechSynthesis.getVoices();
        setAvailableVoices(vList);
      }
    };

    updateVoices();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  // On first load, record existing order IDs
  useEffect(() => {
    if (initialMountRef.current) {
      queuedOrders.forEach((o) => announcedRef.current.add(o.id));
      initialMountRef.current = false;
    }
  }, []);

  // Listen for newly arrived incoming orders and trigger voice speech
  useEffect(() => {
    if (initialMountRef.current) return;

    queuedOrders.forEach((order) => {
      if (!announcedRef.current.has(order.id)) {
        announcedRef.current.add(order.id);
        if (voiceEnabled) {
          speakOrderAnnouncement(order, voiceConfig);
          toast.info(`🔔 New Order Announcement: Token #${order.token}`, {
            description: order.lines.map((l) => `${l.qty}× ${l.name}`).join(", "),
          });
        }
      }
    });
  }, [queuedOrders, voiceEnabled, voiceConfig]);

  // Audio Recording Handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          const updated = {
            ...voiceConfig,
            customAudioBase64: base64data,
            useCustomAudioFirst: true,
          };
          setVoiceConfig(updated);
          saveVoiceConfig(updated);
          toast.success("Voice recording saved! It will play when new orders arrive.");
        };
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.info("🎙️ Recording your voice... Speak your alert message now!");
    } catch (err) {
      toast.error("Microphone access denied or not supported in this browser.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      toast.error("Please select a valid audio file (e.g. .mp3, .wav, .m4a).");
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      const base64 = reader.result as string;
      const updated = { ...voiceConfig, customAudioBase64: base64, useCustomAudioFirst: true };
      setVoiceConfig(updated);
      saveVoiceConfig(updated);
      toast.success(`Audio file "${file.name}" uploaded and set as custom order alert!`);
    };
  };

  const handleTestVoice = () => {
    const dummyOrder: Order = {
      id: "test-voice",
      token: 105,
      lines: [
        { itemId: "m1", name: "Veg Momo (10 pcs)", price: 100, qty: 2 },
        { itemId: "m2", name: "Milk Tea", price: 25, qty: 1 },
      ],
      total: 225,
      payment: "wallet",
      status: "queued",
      placedAt: Date.now(),
    };
    speakOrderAnnouncement(dummyOrder, voiceConfig);
    toast.success(`Testing voice with Token 105: 2 Veg Momo, and 1 Milk Tea`);
  };

  // Role guard: Only Staff & Admin
  if (currentUser && currentUser.role === "student") {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold">Kitchen Staff Access Only</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Students can track their own meal tokens directly from the{" "}
          <strong>Student Dashboard</strong>.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/dashboard">
            <Button>Go to My Dashboard</Button>
          </Link>
          <Link to="/login">
            <Button variant="outline">Switch Account</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleToggleSoldOut = (item: MenuItem, isAvailable: boolean) => {
    updateMenuItem(item.id, { available: isAvailable });
    if (isAvailable) {
      toast.success(`"${item.name}" marked as AVAILABLE (Serving).`);
    } else {
      toast.error(`"${item.name}" marked as SOLD OUT (Raw materials finished).`);
    }
  };

  const soldOutCount = menu.filter((m) => !m.available || remaining(m) === 0).length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
      {/* Header with Custom Voice Controls */}
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <ChefHat className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">Kitchen Order & Stock Board</h1>
              <Badge
                className={
                  voiceEnabled ? "bg-green-600 text-white" : "bg-muted text-muted-foreground"
                }
              >
                {voiceEnabled ? "🔊 Voice Alert ON" : "🔇 Voice Alert Muted"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {queuedOrders.length} incoming orders · {readyOrders.length} ready for pickup ·{" "}
              {soldOutCount} items sold out
            </p>
          </div>
        </div>

        {/* Voice Announcement Toggle & Settings Button */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={voiceEnabled ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setVoiceEnabled(!voiceEnabled);
              toast(
                voiceEnabled ? "🔇 Kitchen Voice Alerts Muted" : "🔊 Kitchen Voice Alerts Enabled",
              );
            }}
            className="gap-1.5"
          >
            {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            <span>{voiceEnabled ? "Voice Alerts: Active" : "Voice Alerts: Muted"}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSettingsOpen(true)}
            className="gap-1.5 border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:hover:bg-purple-950/40"
          >
            <Sliders className="h-3.5 w-3.5" /> Customize Voice
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleTestVoice}
            className="gap-1.5"
            title="Test current voice settings"
          >
            <Play className="h-3.5 w-3.5" /> Test Voice
          </Button>
        </div>
      </header>

      {/* Raw Material & Sold Out Fast Controls Section */}
      <section className="rounded-2xl border border-amber-200/80 bg-amber-50/30 p-5 dark:border-amber-900/50 dark:bg-amber-950/20 shadow-sm">
        <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <PackageX className="h-5 w-5 text-amber-600" />
              <h2 className="text-base font-bold text-foreground">
                Raw Material & Item Availability
              </h2>
              {soldOutCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {soldOutCount} Sold Out
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              If raw materials/ingredients run out, mark dishes as <strong>Sold Out</strong> below.
              Students will not be able to order them.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {menu.map((item) => {
            const left = remaining(item);
            const isSoldOut = !item.available || left === 0;

            return (
              <div
                key={item.id}
                className={`flex flex-col justify-between rounded-xl border p-3.5 transition-all ${
                  isSoldOut
                    ? "border-red-300 bg-red-50/80 dark:border-red-900 dark:bg-red-950/40"
                    : "border-border bg-card shadow-xs"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-foreground text-sm leading-tight">
                      {item.name}
                    </span>
                    <span
                      className={`mt-0.5 size-2 shrink-0 rounded-full ${item.veg ? "bg-green-600" : "bg-red-600"}`}
                      title={item.veg ? "Vegetarian" : "Non-vegetarian"}
                    />
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {money(item.price)} · {item.category}
                    </span>
                    <span>{left} left</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t pt-2.5">
                  <span
                    className={`text-xs font-semibold ${isSoldOut ? "text-red-700 dark:text-red-400" : "text-green-700 dark:text-green-400"}`}
                  >
                    {isSoldOut ? "🔴 SOLD OUT" : "🟢 Available"}
                  </span>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={item.available && left > 0}
                      onCheckedChange={(checked) => handleToggleSoldOut(item, checked)}
                      aria-label={`Toggle availability for ${item.name}`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2-Column Kitchen Order Queue */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Column 1: Incoming Orders */}
        <section className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <h2 className="text-base font-bold text-foreground">Incoming Orders</h2>
            </div>
            <Badge
              variant="outline"
              className="border-amber-400 bg-amber-50 text-amber-800 font-bold"
            >
              {queuedOrders.length} Pending
            </Badge>
          </div>

          <div className="space-y-3">
            {queuedOrders.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">
                <Clock className="mx-auto mb-2 h-10 w-10 opacity-30" />
                <p className="text-sm font-medium">No pending orders right now.</p>
                <p className="text-xs">
                  New orders placed by students will be announced by voice and appear here.
                </p>
              </div>
            ) : (
              queuedOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  next="ready"
                  action="✓ Mark Ready for Pickup"
                  actionVariant="default"
                  onAnnounce={() => speakOrderAnnouncement(order, voiceConfig)}
                />
              ))
            )}
          </div>
        </section>

        {/* Column 2: Ready for Pickup */}
        <section className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <h2 className="text-base font-bold text-foreground">Ready for Pickup</h2>
            </div>
            <Badge className="bg-green-600 font-bold text-white">{readyOrders.length} Ready</Badge>
          </div>

          <div className="space-y-3">
            {readyOrders.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">
                <CheckCircle2 className="mx-auto mb-2 h-10 w-10 opacity-30" />
                <p className="text-sm font-medium">No trays waiting at counter.</p>
                <p className="text-xs">Mark incoming orders as ready when prepared.</p>
              </div>
            ) : (
              readyOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  next="served"
                  action="Collected / Clear"
                  actionVariant="outline"
                />
              ))
            )}
          </div>
        </section>
      </div>

      {/* Custom Voice & Audio Recorder Dialog Modal */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Sliders className="h-5 w-5 text-purple-600" /> Customize Kitchen Voice & Audio
            </DialogTitle>
            <DialogDescription>
              Record your own voice, upload custom audio chimes, or customize speech pitch, speed,
              and accent.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="speech" className="space-y-4 py-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="speech" className="gap-2">
                <Volume2 className="h-4 w-4" /> Text-to-Speech Engine
              </TabsTrigger>
              <TabsTrigger value="recording" className="gap-2">
                <Mic className="h-4 w-4" /> Record / Upload Audio
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Text-to-Speech Customization */}
            <TabsContent value="speech" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="voiceSelect">Select Voice / Accent</Label>
                <Select
                  value={voiceConfig.voiceURI}
                  onValueChange={(val) => {
                    const updated = { ...voiceConfig, voiceURI: val };
                    setVoiceConfig(updated);
                    saveVoiceConfig(updated);
                  }}
                >
                  <SelectTrigger id="voiceSelect">
                    <SelectValue placeholder="System Default Voice" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="">System Default Voice (Auto)</SelectItem>
                    {availableVoices.map((v) => (
                      <SelectItem key={v.voiceURI} value={v.voiceURI}>
                        {v.name} ({v.lang})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prefix">Announcement Greeting / Prefix</Label>
                <Input
                  id="prefix"
                  value={voiceConfig.prefixPhrase}
                  onChange={(e) => {
                    const updated = { ...voiceConfig, prefixPhrase: e.target.value };
                    setVoiceConfig(updated);
                    saveVoiceConfig(updated);
                  }}
                  placeholder="e.g. New order! Token"
                />
                <p className="text-[11px] text-muted-foreground">
                  Preview: <em>"{voiceConfig.prefixPhrase} 105. 2 Veg Momo, and 1 Milk Tea."</em>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Speed / Rate: {voiceConfig.rate}x</span>
                  </div>
                  <Slider
                    min={0.5}
                    max={1.8}
                    step={0.05}
                    value={[voiceConfig.rate]}
                    onValueChange={([val]) => {
                      if (val !== undefined) {
                        const updated = { ...voiceConfig, rate: val };
                        setVoiceConfig(updated);
                        saveVoiceConfig(updated);
                      }
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Pitch: {voiceConfig.pitch}x</span>
                  </div>
                  <Slider
                    min={0.5}
                    max={1.5}
                    step={0.05}
                    value={[voiceConfig.pitch]}
                    onValueChange={([val]) => {
                      if (val !== undefined) {
                        const updated = { ...voiceConfig, pitch: val };
                        setVoiceConfig(updated);
                        saveVoiceConfig(updated);
                      }
                    }}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Tab 2: Custom Voice Recording & Audio Upload */}
            <TabsContent value="recording" className="space-y-4">
              <div className="rounded-xl border p-4 bg-muted/30 space-y-3">
                <h4 className="font-semibold text-sm">🎙️ Record Your Own Kitchen Alert Voice</h4>
                <p className="text-xs text-muted-foreground">
                  Record your own voice (e.g. <em>"Attention chef, new order incoming!"</em>) using
                  your microphone.
                </p>

                <div className="flex items-center gap-3">
                  {!isRecording ? (
                    <Button
                      onClick={startRecording}
                      className="gap-2 bg-red-600 hover:bg-red-700 text-white"
                    >
                      <Mic className="h-4 w-4" /> Start Recording
                    </Button>
                  ) : (
                    <Button
                      onClick={stopRecording}
                      variant="destructive"
                      className="gap-2 animate-pulse"
                    >
                      <Square className="h-4 w-4" /> Stop & Save Recording
                    </Button>
                  )}
                </div>
              </div>

              <div className="rounded-xl border p-4 bg-muted/30 space-y-3">
                <h4 className="font-semibold text-sm">
                  📁 Or Upload Custom Audio File (.mp3 / .wav)
                </h4>
                <p className="text-xs text-muted-foreground">
                  Upload an audio bell, custom recorded voice, or kitchen chime file.
                </p>
                <Input type="file" accept="audio/*" onChange={handleFileUpload} />
              </div>

              {voiceConfig.customAudioBase64 && (
                <div className="flex items-center justify-between rounded-xl border border-green-300 bg-green-50/70 p-3 text-xs dark:border-green-900 dark:bg-green-950/40">
                  <div className="flex items-center gap-2 text-green-800 dark:text-green-300 font-medium">
                    <CheckCircle2 className="h-4 w-4" /> Custom Voice / Audio is active
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const audio = new Audio(voiceConfig.customAudioBase64);
                        audio.play();
                      }}
                      className="h-7 text-xs"
                    >
                      <Play className="h-3 w-3 mr-1" /> Play Clip
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const updated = {
                          ...voiceConfig,
                          customAudioBase64: undefined,
                          useCustomAudioFirst: false,
                        };
                        setVoiceConfig(updated);
                        saveVoiceConfig(updated);
                        toast.info("Custom audio clip removed.");
                      }}
                      className="h-7 text-xs text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="flex justify-between sm:justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setVoiceConfig(DEFAULT_VOICE_CONFIG);
                saveVoiceConfig(DEFAULT_VOICE_CONFIG);
                toast.success("Voice settings reset to default.");
              }}
            >
              Reset to Default
            </Button>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleTestVoice}>
                <Play className="h-3.5 w-3.5 mr-1" /> Test Voice
              </Button>
              <Button onClick={() => setSettingsOpen(false)}>Done</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OrderCard({
  order,
  next,
  action,
  actionVariant,
  onAnnounce,
}: {
  order: Order;
  next?: OrderStatus;
  action?: string;
  actionVariant?: "default" | "outline";
  onAnnounce?: () => void;
}) {
  return (
    <Card className="border shadow-sm transition-all hover:shadow-md">
      <CardContent className="space-y-3 pt-5">
        <div className="flex items-baseline justify-between border-b pb-2">
          <div className="flex items-center gap-2">
            <span className="font-display text-3xl font-black text-primary">#{order.token}</span>
            {onAnnounce && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={onAnnounce}
                title="Replay voice announcement"
              >
                <Volume2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {new Date(order.placedAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        <div>
          <p className="text-sm font-bold text-foreground">
            {order.customerName ?? "Walk-in Customer"}
            {order.studentId && (
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                ({order.studentId})
              </span>
            )}
          </p>
        </div>

        <ul className="space-y-1 rounded-lg bg-muted/40 p-2.5 text-sm font-medium">
          {order.lines.map((l) => (
            <li key={l.itemId} className="flex justify-between">
              <span>
                {l.qty} × {l.name}
              </span>
            </li>
          ))}
        </ul>

        {order.note ? (
          <p className="rounded-md border border-amber-200 bg-amber-50/70 p-2 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            ⚠️ <strong>Note:</strong> {order.note}
          </p>
        ) : null}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{money(order.total)}</span>
          <Badge variant="outline" className="text-[10px]">
            {order.payment === "wallet" ? "Meal Plan" : "Cash at Counter"}
          </Badge>
        </div>

        {next && action ? (
          <Button
            className={`w-full font-bold ${
              actionVariant === "outline"
                ? "border-green-600 text-green-700 hover:bg-green-50 dark:hover:bg-green-950/40"
                : "bg-primary hover:bg-primary/90"
            }`}
            variant={actionVariant || "default"}
            size="sm"
            onClick={() => setOrderStatus(order.id, next)}
          >
            {action}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
