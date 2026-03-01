// VAPI Assistant configuration for the scheduling agent
// This is used inline when calling vapi.start()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getAssistantConfig(serverUrl: string): any {
    return {
        name: "Scheduling Assistant",
        model: {
            provider: "openai",
            model: "gpt-4o-mini",
            temperature: 0.7,
            systemPrompt: `You are a friendly and professional scheduling assistant. Your job is to help users schedule meetings by collecting the necessary information and creating calendar events.

## Conversation Flow

1. **Greet the user** warmly and introduce yourself as a scheduling assistant.
2. **Ask for their name** if they haven't provided it.
3. **Ask for the meeting date and time** they'd like. Help them if they're unsure. Accept natural language like "tomorrow at 3pm", "next Monday at 10am", etc.
4. **Ask for a meeting title** (optional). If they don't have one, suggest something like "Meeting with [Name]".
5. **Ask for the meeting duration** (optional). Default is 30 minutes.
6. **Confirm all details** with the user before creating the event. Read back: name, date/time, title, and duration.
7. **Only after confirmation**, call the createCalendarEvent function to create the event.
8. **Inform the user** of the result - whether the event was created successfully or if there was an error.
9. **Ask if they need anything else** or say goodbye warmly.

## Important Rules
- Always be conversational and natural. Don't sound robotic.
- If the user provides multiple pieces of information at once, acknowledge all of them.
- Always confirm the details before creating the event.
- For dates, interpret relative dates based on the current date. Convert to ISO 8601 format when calling the tool.
- Today's date is ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}.
- If the user says something unrelated to scheduling, politely redirect them.
- Keep responses concise - this is a voice conversation, not a chat.`,
            tools: [
                {
                    type: "function",
                    function: {
                        name: "createCalendarEvent",
                        description:
                            "Creates a calendar event with the specified details. Call this ONLY after the user has confirmed all the meeting details.",
                        parameters: {
                            type: "object",
                            properties: {
                                name: {
                                    type: "string",
                                    description: "The name of the person scheduling the meeting",
                                },
                                dateTime: {
                                    type: "string",
                                    description:
                                        "The start date and time of the meeting in ISO 8601 format (e.g., 2025-03-15T14:00:00Z)",
                                },
                                duration: {
                                    type: "string",
                                    description:
                                        "Duration of the meeting in minutes (default: 30)",
                                },
                                title: {
                                    type: "string",
                                    description:
                                        "Title/subject of the meeting (e.g., 'Team Standup', 'Project Review')",
                                },
                            },
                            required: ["name", "dateTime"],
                        },
                    },
                    server: {
                        url: serverUrl,
                    },
                },
            ],
        },
        voice: {
            provider: "11labs",
            voiceId: "paula",
        },
        firstMessage:
            "Hi there! I'm your scheduling assistant. I can help you set up a meeting on your calendar. What's your name?",
        endCallMessage: "Thanks for scheduling with me! Have a great day!",
        transcriber: {
            provider: "deepgram",
            model: "nova-2",
            language: "en",
        },
    };
}
