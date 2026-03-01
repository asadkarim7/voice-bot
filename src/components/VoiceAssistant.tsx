"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Vapi from "@vapi-ai/web";
import { getAssistantConfig } from "@/lib/assistant-config";

interface Message {
    role: "assistant" | "user" | "system";
    content: string;
    timestamp: Date;
}

interface CreatedEvent {
    title: string;
    dateTime: string;
    name: string;
    duration: string;
    eventLink?: string;
}

type ConnectionStatus = "idle" | "connecting" | "connected" | "disconnected";

export default function VoiceAssistant() {
    const [connectionStatus, setConnectionStatus] =
        useState<ConnectionStatus>("idle");
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isUserSpeaking, setIsUserSpeaking] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [createdEvent, setCreatedEvent] = useState<CreatedEvent | null>(null);
    const [volumeLevel, setVolumeLevel] = useState(0);
    const vapiRef = useRef<Vapi | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const startCall = useCallback(async () => {
        const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
        if (!publicKey) {
            setMessages((prev) => [
                ...prev,
                {
                    role: "system",
                    content:
                        "Error: VAPI public key not configured. Please set NEXT_PUBLIC_VAPI_PUBLIC_KEY.",
                    timestamp: new Date(),
                },
            ]);
            return;
        }

        setConnectionStatus("connecting");
        setMessages([]);
        setCreatedEvent(null);

        try {
            const vapi = new Vapi(publicKey);
            vapiRef.current = vapi;

            // Event listeners
            vapi.on("call-start", () => {
                setConnectionStatus("connected");
            });

            vapi.on("call-end", () => {
                setConnectionStatus("disconnected");
                setIsSpeaking(false);
                setIsUserSpeaking(false);
                setVolumeLevel(0);
            });

            vapi.on("speech-start", () => {
                setIsSpeaking(true);
            });

            vapi.on("speech-end", () => {
                setIsSpeaking(false);
            });

            vapi.on("volume-level", (level: number) => {
                setVolumeLevel(level);
            });

            vapi.on("message", (msg: Record<string, unknown>) => {
                // Handle transcript messages
                if (msg.type === "transcript") {
                    const transcript = msg as {
                        type: string;
                        role: string;
                        transcript: string;
                        transcriptType: string;
                    };
                    if (transcript.transcriptType === "final") {
                        setMessages((prev) => [
                            ...prev,
                            {
                                role: transcript.role as "assistant" | "user",
                                content: transcript.transcript,
                                timestamp: new Date(),
                            },
                        ]);

                        if (transcript.role === "user") {
                            setIsUserSpeaking(false);
                        }
                    } else if (
                        transcript.transcriptType === "partial" &&
                        transcript.role === "user"
                    ) {
                        setIsUserSpeaking(true);
                    }
                }

                // Handle tool call results to capture created event
                if (msg.type === "tool-calls") {
                    const toolCalls = msg as {
                        type: string;
                        toolCallList: Array<{
                            function: {
                                name: string;
                                arguments: Record<string, string>;
                            };
                        }>;
                    };
                    if (toolCalls.toolCallList) {
                        for (const call of toolCalls.toolCallList) {
                            if (call.function.name === "createCalendarEvent") {
                                const args = call.function.arguments;
                                setCreatedEvent({
                                    title: args.title || `Meeting with ${args.name}`,
                                    dateTime: args.dateTime,
                                    name: args.name,
                                    duration: args.duration || "30",
                                });
                            }
                        }
                    }
                }

                // Also handle function-call type
                if (msg.type === "function-call") {
                    const funcCall = msg as {
                        type: string;
                        functionCall: {
                            name: string;
                            parameters: Record<string, string>;
                        };
                    };
                    if (funcCall.functionCall?.name === "createCalendarEvent") {
                        const args = funcCall.functionCall.parameters;
                        setCreatedEvent({
                            title: args.title || `Meeting with ${args.name}`,
                            dateTime: args.dateTime,
                            name: args.name,
                            duration: args.duration || "30",
                        });
                    }
                }
            });

            vapi.on("error", (error: unknown) => {
                console.error("VAPI error:", error);
                const errorMessage =
                    error instanceof Error ? error.message : "An error occurred";
                setMessages((prev) => [
                    ...prev,
                    {
                        role: "system",
                        content: `Error: ${errorMessage}`,
                        timestamp: new Date(),
                    },
                ]);
            });

            // Determine server URL for tool calls
            const serverUrl =
                typeof window !== "undefined"
                    ? `${window.location.origin}/api/vapi/webhook`
                    : "/api/vapi/webhook";

            const assistantConfig = getAssistantConfig(serverUrl);
            await vapi.start(assistantConfig);
        } catch (error) {
            console.error("Failed to start call:", error);
            setConnectionStatus("idle");
            setMessages((prev) => [
                ...prev,
                {
                    role: "system",
                    content:
                        "Failed to start the voice assistant. Please check your configuration and try again.",
                    timestamp: new Date(),
                },
            ]);
        }
    }, []);

    const endCall = useCallback(() => {
        if (vapiRef.current) {
            vapiRef.current.stop();
            vapiRef.current = null;
        }
        setConnectionStatus("disconnected");
        setIsSpeaking(false);
        setIsUserSpeaking(false);
    }, []);

    const isActive =
        connectionStatus === "connected" || connectionStatus === "connecting";

    return (
        <div className="voice-assistant">
            {/* Header */}
            <div className="header">
                <div className="header-icon">
                    <svg
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                </div>
                <div>
                    <h1 className="header-title">Voice Scheduler</h1>
                    <p className="header-subtitle">AI-powered meeting scheduling</p>
                </div>
            </div>

            {/* Voice Orb */}
            <div className="orb-container">
                <div
                    className={`orb-glow ${isActive ? "active" : ""} ${isSpeaking ? "speaking" : ""}`}
                />
                <button
                    className={`orb ${isActive ? "active" : ""} ${isSpeaking ? "speaking" : ""} ${isUserSpeaking ? "listening" : ""}`}
                    onClick={isActive ? endCall : startCall}
                    disabled={connectionStatus === "connecting"}
                    id="voice-button"
                    style={{
                        transform: `scale(${1 + volumeLevel * 0.15})`,
                    }}
                >
                    {connectionStatus === "connecting" ? (
                        <div className="spinner" />
                    ) : isActive ? (
                        <svg
                            width="36"
                            height="36"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <rect x="6" y="6" width="12" height="12" rx="2" />
                        </svg>
                    ) : (
                        <svg
                            width="36"
                            height="36"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                            <line x1="12" y1="19" x2="12" y2="23" />
                            <line x1="8" y1="23" x2="16" y2="23" />
                        </svg>
                    )}
                </button>
                <p className="orb-label">
                    {connectionStatus === "idle" && "Tap to start scheduling"}
                    {connectionStatus === "connecting" && "Connecting..."}
                    {connectionStatus === "connected" &&
                        !isSpeaking &&
                        !isUserSpeaking &&
                        "Listening..."}
                    {connectionStatus === "connected" && isSpeaking && "Speaking..."}
                    {connectionStatus === "connected" &&
                        isUserSpeaking &&
                        !isSpeaking &&
                        "You're speaking..."}
                    {connectionStatus === "disconnected" && "Call ended"}
                </p>
            </div>

            {/* Transcript */}
            {messages.length > 0 && (
                <div className="transcript-container">
                    <h2 className="transcript-title">Conversation</h2>
                    <div className="transcript">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`message ${msg.role}`}>
                                <div className="message-label">
                                    {msg.role === "assistant"
                                        ? "🤖 Assistant"
                                        : msg.role === "user"
                                            ? "👤 You"
                                            : "⚙️ System"}
                                </div>
                                <div className="message-content">{msg.content}</div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                </div>
            )}

            {/* Created Event Card */}
            {createdEvent && (
                <div className="event-card">
                    <div className="event-card-header">
                        <svg
                            width="22"
                            height="22"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        <span>Event Created!</span>
                    </div>
                    <div className="event-card-body">
                        <div className="event-detail">
                            <span className="event-detail-label">Title</span>
                            <span className="event-detail-value">{createdEvent.title}</span>
                        </div>
                        <div className="event-detail">
                            <span className="event-detail-label">Attendee</span>
                            <span className="event-detail-value">{createdEvent.name}</span>
                        </div>
                        <div className="event-detail">
                            <span className="event-detail-label">Date & Time</span>
                            <span className="event-detail-value">
                                {new Date(createdEvent.dateTime).toLocaleString()}
                            </span>
                        </div>
                        <div className="event-detail">
                            <span className="event-detail-label">Duration</span>
                            <span className="event-detail-value">
                                {createdEvent.duration} minutes
                            </span>
                        </div>
                    </div>
                    {createdEvent.eventLink && (
                        <a
                            href={createdEvent.eventLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="event-link"
                        >
                            Open in Google Calendar →
                        </a>
                    )}
                </div>
            )}
        </div>
    );
}
