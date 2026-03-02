import { Platform } from "react-native";

export type QualityTier = "4K UHD" | "Full HD" | "HD 720p" | "SD 480p" | "Low";

export interface QualityConfig {
  label: QualityTier;
  width: number;
  height: number;
  fps: number;
  maxBitrate: number;
  minBandwidthKbps: number;
}

export const QUALITY_TIERS: QualityConfig[] = [
  {
    label: "4K UHD",
    width: 3840,
    height: 2160,
    fps: 30,
    maxBitrate: 20_000_000,
    minBandwidthKbps: 8000,
  },
  {
    label: "Full HD",
    width: 1920,
    height: 1080,
    fps: 30,
    maxBitrate: 5_000_000,
    minBandwidthKbps: 2500,
  },
  {
    label: "HD 720p",
    width: 1280,
    height: 720,
    fps: 30,
    maxBitrate: 2_500_000,
    minBandwidthKbps: 1000,
  },
  {
    label: "SD 480p",
    width: 854,
    height: 480,
    fps: 15,
    maxBitrate: 1_000_000,
    minBandwidthKbps: 400,
  },
  {
    label: "Low",
    width: 640,
    height: 360,
    fps: 15,
    maxBitrate: 500_000,
    minBandwidthKbps: 0,
  },
];

export const STUN_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun.cloudflare.com:3478" },
];

function preferAV1InSDP(sdp: string): string {
  const lines = sdp.split("\r\n");
  const videoSectionIndex = lines.findIndex((l) => l.startsWith("m=video"));
  if (videoSectionIndex === -1) return sdp;

  const av1Payloads: string[] = [];
  const vp9Payloads: string[] = [];
  const vp8Payloads: string[] = [];
  const h264Payloads: string[] = [];

  lines.forEach((line) => {
    if (/a=rtpmap:\d+ AV1\//i.test(line)) {
      const m = line.match(/a=rtpmap:(\d+)/);
      if (m) av1Payloads.push(m[1]);
    } else if (/a=rtpmap:\d+ VP9\//i.test(line)) {
      const m = line.match(/a=rtpmap:(\d+)/);
      if (m) vp9Payloads.push(m[1]);
    } else if (/a=rtpmap:\d+ VP8\//i.test(line)) {
      const m = line.match(/a=rtpmap:(\d+)/);
      if (m) vp8Payloads.push(m[1]);
    } else if (/a=rtpmap:\d+ H264\//i.test(line)) {
      const m = line.match(/a=rtpmap:(\d+)/);
      if (m) h264Payloads.push(m[1]);
    }
  });

  const priorityOrder = [...av1Payloads, ...vp9Payloads, ...vp8Payloads, ...h264Payloads];
  if (priorityOrder.length === 0) return sdp;

  const mLine = lines[videoSectionIndex];
  const mParts = mLine.split(" ");
  const prefix = mParts.slice(0, 3);
  const existingPayloads = mParts.slice(3);

  const reordered = [
    ...priorityOrder.filter((p) => existingPayloads.includes(p)),
    ...existingPayloads.filter((p) => !priorityOrder.includes(p)),
  ];

  lines[videoSectionIndex] = [...prefix, ...reordered].join(" ");
  return lines.join("\r\n");
}

function getActiveCodecFromSDP(sdp: string): string {
  const av1Match = /a=rtpmap:\d+ AV1\//i.test(sdp);
  const vp9Match = /a=rtpmap:\d+ VP9\//i.test(sdp);
  const vp8Match = /a=rtpmap:\d+ VP8\//i.test(sdp);
  if (av1Match) return "AV1";
  if (vp9Match) return "VP9";
  if (vp8Match) return "VP8";
  return "H.264";
}

export type CallEventType =
  | "quality-change"
  | "bitrate-update"
  | "codec-detected"
  | "remote-stream"
  | "local-stream"
  | "connected"
  | "disconnected"
  | "error"
  | "stats";

export interface CallStats {
  bitrateKbps: number;
  packetsLost: number;
  roundTripMs: number;
  qualityTier: QualityTier;
  codec: string;
  resolution: string;
}

type EventListener = (data: any) => void;

export class WebRTCEngine {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private signalingWs: WebSocket | null = null;
  private roomId: string = "";
  private peerId: string = "";
  private remotePeerId: string = "";
  private statsInterval: ReturnType<typeof setInterval> | null = null;
  private videoSender: RTCRtpSender | null = null;
  private currentTierIndex: number = 0;
  private lastBytesSent: number = 0;
  private lastStatsTime: number = 0;
  private listeners: Map<CallEventType, EventListener[]> = new Map();
  private isAvailable: boolean = Platform.OS === "web";
  private isCaller: boolean = false;
  private pendingCandidates: RTCIceCandidateInit[] = [];

  constructor() {
    this.isAvailable =
      Platform.OS === "web" && typeof RTCPeerConnection !== "undefined";
  }

  get available() {
    return this.isAvailable;
  }

  on(event: CallEventType, listener: EventListener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  off(event: CallEventType, listener: EventListener) {
    const arr = this.listeners.get(event) || [];
    this.listeners.set(
      event,
      arr.filter((l) => l !== listener)
    );
  }

  private emit(event: CallEventType, data?: any) {
    const arr = this.listeners.get(event) || [];
    arr.forEach((l) => l(data));
  }

  private createPeerConnection(): RTCPeerConnection {
    const pc = new RTCPeerConnection({ iceServers: STUN_SERVERS });

    pc.onicecandidate = ({ candidate }) => {
      if (candidate && this.remotePeerId && this.signalingWs?.readyState === WebSocket.OPEN) {
        this.signalingWs.send(
          JSON.stringify({
            type: "ice-candidate",
            candidate: candidate.toJSON(),
            to: this.remotePeerId,
            from: this.peerId,
          })
        );
      }
    };

    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      this.remoteStream = remoteStream;
      this.emit("remote-stream", remoteStream);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        this.emit("connected");
        this.startStatsPolling();
      } else if (
        pc.connectionState === "disconnected" ||
        pc.connectionState === "failed" ||
        pc.connectionState === "closed"
      ) {
        this.emit("disconnected");
        this.stopStatsPolling();
      }
    };

    return pc;
  }

  async getLocalStream(videoEnabled = true): Promise<MediaStream> {
    if (!this.isAvailable) throw new Error("WebRTC not available on this platform");

    const tier = QUALITY_TIERS[this.currentTierIndex];
    const constraints: MediaStreamConstraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 48000,
      },
      video: videoEnabled
        ? {
            width: { ideal: tier.width, max: tier.width },
            height: { ideal: tier.height, max: tier.height },
            frameRate: { ideal: tier.fps, max: tier.fps },
            facingMode: "user",
          }
        : false,
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    this.localStream = stream;
    this.emit("local-stream", stream);
    return stream;
  }

  connectSignaling(signalingUrl: string, roomId: string, peerId: string, isCaller: boolean) {
    this.roomId = roomId;
    this.peerId = peerId;
    this.isCaller = isCaller;

    const ws = new WebSocket(signalingUrl);
    this.signalingWs = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "join", roomId, peerId }));
    };

    ws.onmessage = async (evt) => {
      try {
        const msg = JSON.parse(evt.data as string);
        await this.handleSignalingMessage(msg);
      } catch (e) {
        console.warn("[WebRTC] Signaling parse error:", e);
      }
    };

    ws.onerror = (e) => {
      this.emit("error", "Signaling connection failed");
    };

    ws.onclose = () => {
      this.emit("disconnected");
    };
  }

  private async handleSignalingMessage(msg: any) {
    switch (msg.type) {
      case "peer-joined": {
        this.remotePeerId = msg.peerId;
        if (this.isCaller) {
          await this.startCall();
        }
        break;
      }
      case "offer": {
        this.remotePeerId = msg.from;
        if (!this.pc) {
          this.pc = this.createPeerConnection();
          if (this.localStream) {
            this.localStream.getTracks().forEach((t) => {
              this.videoSender = this.pc!.addTrack(t, this.localStream!) ?? this.videoSender;
            });
          }
        }
        const preferredSdp = preferAV1InSDP(msg.sdp);
        await this.pc.setRemoteDescription(
          new RTCSessionDescription({ type: "offer", sdp: preferredSdp })
        );
        for (const c of this.pendingCandidates) {
          await this.pc.addIceCandidate(new RTCIceCandidate(c));
        }
        this.pendingCandidates = [];
        const answer = await this.pc.createAnswer();
        answer.sdp = preferAV1InSDP(answer.sdp || "");
        await this.pc.setLocalDescription(answer);
        this.signalingWs?.send(
          JSON.stringify({
            type: "answer",
            sdp: answer.sdp,
            to: this.remotePeerId,
            from: this.peerId,
          })
        );
        const codec = getActiveCodecFromSDP(answer.sdp || "");
        this.emit("codec-detected", codec);
        break;
      }
      case "answer": {
        if (!this.pc) break;
        const preferredSdp = preferAV1InSDP(msg.sdp);
        await this.pc.setRemoteDescription(
          new RTCSessionDescription({ type: "answer", sdp: preferredSdp })
        );
        const codec = getActiveCodecFromSDP(preferredSdp);
        this.emit("codec-detected", codec);
        break;
      }
      case "ice-candidate": {
        if (!msg.candidate) break;
        if (this.pc && this.pc.remoteDescription) {
          await this.pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
        } else {
          this.pendingCandidates.push(msg.candidate);
        }
        break;
      }
      case "peer-left": {
        this.emit("disconnected");
        break;
      }
    }
  }

  private async startCall() {
    if (!this.isAvailable) return;
    this.pc = this.createPeerConnection();

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        const sender = this.pc!.addTrack(track, this.localStream!);
        if (track.kind === "video") {
          this.videoSender = sender;
        }
      });
    }

    await this.applyBitrateToSender();
    const offer = await this.pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });
    offer.sdp = preferAV1InSDP(offer.sdp || "");
    await this.pc.setLocalDescription(offer);

    this.signalingWs?.send(
      JSON.stringify({
        type: "offer",
        sdp: offer.sdp,
        to: this.remotePeerId,
        from: this.peerId,
        roomId: this.roomId,
      })
    );
  }

  private async applyBitrateToSender() {
    if (!this.videoSender) return;
    const tier = QUALITY_TIERS[this.currentTierIndex];
    const params = this.videoSender.getParameters();
    if (!params.encodings || params.encodings.length === 0) {
      params.encodings = [{}];
    }
    params.encodings[0].maxBitrate = tier.maxBitrate;
    params.encodings[0].scaleResolutionDownBy =
      tier.width < 3840 ? 3840 / tier.width : 1;
    try {
      await this.videoSender.setParameters(params);
    } catch (e) {
      console.warn("[WebRTC] setParameters failed:", e);
    }
  }

  private startStatsPolling() {
    this.stopStatsPolling();
    this.lastStatsTime = Date.now();
    this.statsInterval = setInterval(() => this.collectStats(), 2000);
  }

  private stopStatsPolling() {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }
  }

  private async collectStats() {
    if (!this.pc || !this.videoSender) return;
    try {
      const reports = await this.pc.getStats(this.videoSender.track);
      let bytesSent = 0;
      let packetsLost = 0;
      let rtt = 0;
      let frameWidth = 0;
      let frameHeight = 0;

      reports.forEach((report: any) => {
        if (report.type === "outbound-rtp" && report.kind === "video") {
          bytesSent = report.bytesSent || 0;
          frameWidth = report.frameWidth || 0;
          frameHeight = report.frameHeight || 0;
        }
        if (report.type === "remote-inbound-rtp" && report.kind === "video") {
          packetsLost = report.packetsLost || 0;
          rtt = (report.roundTripTime || 0) * 1000;
        }
      });

      const now = Date.now();
      const elapsed = (now - this.lastStatsTime) / 1000;
      const bitsPerSec = ((bytesSent - this.lastBytesSent) * 8) / elapsed;
      const bitrateKbps = Math.round(bitsPerSec / 1000);

      this.lastBytesSent = bytesSent;
      this.lastStatsTime = now;

      await this.adaptBitrate(bitrateKbps, packetsLost);

      const tier = QUALITY_TIERS[this.currentTierIndex];
      const stats: CallStats = {
        bitrateKbps,
        packetsLost,
        roundTripMs: Math.round(rtt),
        qualityTier: tier.label,
        codec: "AV1",
        resolution: frameWidth > 0 ? `${frameWidth}×${frameHeight}` : `${tier.width}×${tier.height}`,
      };

      this.emit("stats", stats);
      this.emit("bitrate-update", bitrateKbps);
    } catch (e) {
      console.warn("[WebRTC] Stats collection failed:", e);
    }
  }

  private async adaptBitrate(currentBitrateKbps: number, packetsLost: number) {
    const tier = QUALITY_TIERS[this.currentTierIndex];
    const isCongested = packetsLost > 5 || currentBitrateKbps < tier.minBandwidthKbps * 0.7;
    const isAbundant = currentBitrateKbps > tier.minBandwidthKbps * 1.3;

    let newTierIndex = this.currentTierIndex;

    if (isCongested && this.currentTierIndex < QUALITY_TIERS.length - 1) {
      newTierIndex = this.currentTierIndex + 1;
    } else if (isAbundant && this.currentTierIndex > 0) {
      const nextTier = QUALITY_TIERS[this.currentTierIndex - 1];
      if (currentBitrateKbps > nextTier.minBandwidthKbps) {
        newTierIndex = this.currentTierIndex - 1;
      }
    }

    if (newTierIndex !== this.currentTierIndex) {
      this.currentTierIndex = newTierIndex;
      await this.applyBitrateToSender();
      this.emit("quality-change", QUALITY_TIERS[newTierIndex]);
    }
  }

  async toggleMic(enabled: boolean) {
    this.localStream?.getAudioTracks().forEach((t) => {
      t.enabled = enabled;
    });
  }

  async toggleCamera(enabled: boolean) {
    this.localStream?.getVideoTracks().forEach((t) => {
      t.enabled = enabled;
    });
  }

  async flipCamera() {
    const videoTrack = this.localStream?.getVideoTracks()[0];
    if (!videoTrack) return;
    const currentFacing = videoTrack.getSettings().facingMode;
    const newFacing = currentFacing === "environment" ? "user" : "environment";
    const newStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: newFacing },
    });
    const [newVideoTrack] = newStream.getVideoTracks();
    if (this.videoSender) {
      await this.videoSender.replaceTrack(newVideoTrack);
    }
    videoTrack.stop();
    this.localStream?.removeTrack(videoTrack);
    this.localStream?.addTrack(newVideoTrack);
    this.emit("local-stream", this.localStream);
  }

  getCurrentLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getCurrentRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  destroy() {
    this.stopStatsPolling();
    this.localStream?.getTracks().forEach((t) => t.stop());
    this.pc?.close();
    this.signalingWs?.close();
    this.localStream = null;
    this.remoteStream = null;
    this.pc = null;
    this.signalingWs = null;
    this.listeners.clear();
  }
}
