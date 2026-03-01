import { NextRequest, NextResponse } from "next/server";
import { createCalendarEvent } from "@/lib/google-calendar";

// VAPI sends different message types - we care about "tool-calls"
interface VapiToolCallMessage {
    message: {
        type: string;
        toolCallList?: Array<{
            id: string;
            type: string;
            function: {
                name: string;
                arguments: Record<string, string>;
            };
        }>;
        // For function-call type
        functionCall?: {
            name: string;
            parameters: Record<string, string>;
        };
    };
}

export async function POST(request: NextRequest) {
    try {
        const body: VapiToolCallMessage = await request.json();
        console.log("VAPI Webhook received:", JSON.stringify(body, null, 2));

        const messageType = body.message?.type;

        // Handle tool-calls message type
        if (messageType === "tool-calls" && body.message.toolCallList) {
            const results = [];

            for (const toolCall of body.message.toolCallList) {
                if (toolCall.function.name === "createCalendarEvent") {
                    const args = toolCall.function.arguments;
                    const result = await handleCreateCalendarEvent(args);

                    results.push({
                        toolCallId: toolCall.id,
                        result: JSON.stringify(result),
                    });
                }
            }

            return NextResponse.json({ results });
        }

        // Handle function-call message type (legacy/alternative format)
        if (messageType === "function-call" && body.message.functionCall) {
            const { name, parameters } = body.message.functionCall;

            if (name === "createCalendarEvent") {
                const result = await handleCreateCalendarEvent(parameters);
                return NextResponse.json({ result: JSON.stringify(result) });
            }
        }

        // For other message types (status updates, etc.), just acknowledge
        return NextResponse.json({ ok: true });
    } catch (error: unknown) {
        const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
        console.error("Webhook error:", errorMessage);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

async function handleCreateCalendarEvent(args: Record<string, string>) {
    const name = args.name || "Guest";
    const dateTime = args.dateTime;
    const durationMinutes = parseInt(args.duration || "30", 10);
    const title = args.title || `Meeting with ${name}`;

    if (!dateTime) {
        return {
            success: false,
            error: "Date and time are required to create a calendar event.",
        };
    }

    // Parse the date/time and calculate end time
    const startDate = new Date(dateTime);
    if (isNaN(startDate.getTime())) {
        return {
            success: false,
            error: `Invalid date/time format: "${dateTime}". Please provide a valid date and time.`,
        };
    }

    const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

    const result = await createCalendarEvent({
        summary: title,
        description: `Meeting scheduled via Voice Assistant.\nAttendee: ${name}\nDuration: ${durationMinutes} minutes`,
        startDateTime: startDate.toISOString(),
        endDateTime: endDate.toISOString(),
        attendeeName: name,
    });

    if (result.success) {
        return {
            success: true,
            message: `Calendar event "${title}" has been created for ${name} on ${startDate.toLocaleString()}. Duration: ${durationMinutes} minutes.`,
            eventId: result.eventId,
            eventLink: result.eventLink,
        };
    }

    return {
        success: false,
        error: `Failed to create calendar event: ${result.error}`,
    };
}
