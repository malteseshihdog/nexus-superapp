import { STUN_SERVERS } from "./webrtc";

export interface GroupParticipant {
  id: string;
  name: string;
  avatar: string;
  color: string;
  stream: MediaStream | null;
  audioEnabled: boolean;
  videoEnabled: boolean;
  isSpeaking: boolean;
  isLocal: boolean;
}

type GroupEvent =
  | "local-stream"
  | "peer-joined"
  | "peer-left"
  | "stream"
  | "disconnected"
  | "error";

type Listener = (...args: any[]) => void;

function preferAV1(sdp: string): string {
  if (!sdp) return sdp;
  const lines = sdp.split("\r\n");
  const vidIdx = lines.findIndex((l) => l.startsWith("m=video"));
  if (vidIdx === -1) return sdp;
  const av1: string[] = [];
  lines.forEach((l) => {
    const m = l.match(/a=rtpmap:(\d+) AV1\//i);
    if (m) av1.push(m[1]);
  });
  if (av1.length === 0) return sdp;
  const mLine = lines[vidIdx].split(" ");
  const rest = mLine.slice(3).filter((p) => !av1.includes(p));
  lines[vidIdx] = [...mLine.slice(0, 3), ...av1, ...rest].join(" ");
  return lines.join("\r\n");
}

export class GroupCallEngine {
  private pcs = new Map<string, RTCPeerConnection>();
  private pendingCandidates = new Map<string, RTCIceCandidateInit[]>();
  private streams = new Map<string, MediaStream>();
  private localStream: MediaStream | null = null;
  private ws: WebSocket | null = null;
  private myId = "";
  private roomId = "";
  private listeners = new Map<GroupEvent, Listener[]>();

  readonly available: boolean;

  constructor() {
    this.available =
      typeof RTCPeerConnection !== "undefined" &&
      typeof navigator !== "undefined" &&
      typeof navigator.mediaDevices !== "undefined";
  }

  on(event: GroupEvent, fn: Listener) {
    const arr = this.listeners.get(event) ?? [];
    arr.push(fn);
    this.listeners.set(event, arr);
  }

  private emit(event: GroupEvent, ...args: any[]) {
    (this.listeners.get(event) ?? []).forEach((fn) => fn(...args));
  }

  async init(myId: string, roomId: string, videoEnabled: boolean): Promise<void> {
    this.myId = myId;
    this.roomId = roomId;

    if (this.available) {
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
          video: videoEnabled
            ? { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } }
            : false,
        });
        this.emit("local-stream", this.localStream);
      } catch (e) {
        console.warn("[GroupCall] getUserMedia failed:", e);
      }

      this.connectSignaling();
    }
  }

  private connectSignaling() {
    try {
      const base = (globalThis as any).__EXPO_PUBLIC_DOMAIN
        ? `wss://${(globalThis as any).__EXPO_PUBLIC_DOMAIN}`
        : "ws://localhost:5000";
      const proto =
        typeof location !== "undefined" && location.protocol === "https:"
          ? "wss"
          : "ws";
      const host =
        typeof location !== "undefined" ? location.host : "localhost:5000";
      const url = `${proto}://${host}/ws/signal`;

      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.ws!.send(
          JSON.stringify({ type: "join", roomId: this.roomId, peerId: this.myId })
        );
      };

      this.ws.onmessage = async (evt) => {
        try {
          const msg = JSON.parse(evt.data as string);
          await this.handleMessage(msg);
        } catch {}
      };

      this.ws.onerror = () => this.emit("error", "signaling-failed");
      this.ws.onclose = () => this.emit("disconnected");
    } catch {}
  }

  private async handleMessage(msg: any) {
    switch (msg.type) {
      case "peer-joined": {
        const { peerId } = msg;
        if (peerId === this.myId) break;
        const isCaller = this.myId < peerId;
        if (isCaller) {
          const pc = this.getOrCreatePC(peerId);
          const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
          offer.sdp = preferAV1(offer.sdp ?? "");
          await pc.setLocalDescription(offer);
          this.sendSignal({ type: "offer", sdp: offer.sdp, to: peerId, from: this.myId, roomId: this.roomId });
        } else {
          this.getOrCreatePC(peerId);
        }
        this.emit("peer-joined", { peerId });
        break;
      }

      case "offer": {
        const { from, sdp } = msg;
        const pc = this.getOrCreatePC(from);
        await pc.setRemoteDescription(new RTCSessionDescription({ type: "offer", sdp: preferAV1(sdp) }));

        const pending = this.pendingCandidates.get(from) ?? [];
        for (const c of pending) {
          try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch {}
        }
        this.pendingCandidates.delete(from);

        const answer = await pc.createAnswer();
        answer.sdp = preferAV1(answer.sdp ?? "");
        await pc.setLocalDescription(answer);
        this.sendSignal({ type: "answer", sdp: answer.sdp, to: from, from: this.myId });
        break;
      }

      case "answer": {
        const { from, sdp } = msg;
        const pc = this.pcs.get(from);
        if (pc) await pc.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp: preferAV1(sdp) }));
        break;
      }

      case "ice-candidate": {
        const { from, candidate } = msg;
        if (!candidate) break;
        const pc = this.pcs.get(from);
        if (pc && pc.remoteDescription) {
          try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
        } else {
          const arr = this.pendingCandidates.get(from) ?? [];
          arr.push(candidate);
          this.pendingCandidates.set(from, arr);
        }
        break;
      }

      case "peer-left": {
        const { peerId } = msg;
        this.pcs.get(peerId)?.close();
        this.pcs.delete(peerId);
        this.streams.delete(peerId);
        this.pendingCandidates.delete(peerId);
        this.emit("peer-left", { peerId });
        break;
      }
    }
  }

  private getOrCreatePC(peerId: string): RTCPeerConnection {
    if (this.pcs.has(peerId)) return this.pcs.get(peerId)!;

    const pc = new RTCPeerConnection({ iceServers: STUN_SERVERS });

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        this.sendSignal({
          type: "ice-candidate",
          candidate: candidate.toJSON(),
          to: peerId,
          from: this.myId,
        });
      }
    };

    pc.ontrack = (e) => {
      const [stream] = e.streams;
      if (stream) {
        this.streams.set(peerId, stream);
        this.emit("stream", { peerId, stream });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed" || pc.connectionState === "closed") {
        this.emit("peer-left", { peerId });
      }
    };

    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => pc.addTrack(t, this.localStream!));
    }

    this.pcs.set(peerId, pc);
    return pc;
  }

  private sendSignal(msg: object) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  toggleMic(enabled: boolean) {
    this.localStream?.getAudioTracks().forEach((t) => (t.enabled = enabled));
  }

  toggleCamera(enabled: boolean) {
    this.localStream?.getVideoTracks().forEach((t) => (t.enabled = enabled));
  }

  getStream(peerId: string): MediaStream | null {
    return this.streams.get(peerId) ?? null;
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  destroy() {
    this.pcs.forEach((pc) => pc.close());
    this.pcs.clear();
    this.localStream?.getTracks().forEach((t) => t.stop());
    this.localStream = null;
    this.ws?.close();
    this.ws = null;
    this.streams.clear();
    this.pendingCandidates.clear();
    this.listeners.clear();
  }
}
