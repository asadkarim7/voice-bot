import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/calendar"];

function getAuth() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  if (!clientEmail || !privateKey || !calendarId) {
    throw new Error(
      "Missing Google Calendar credentials. Please set GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, and GOOGLE_CALENDAR_ID environment variables."
    );
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: SCOPES,
  });

  return { auth, calendarId };
}

export interface CalendarEventParams {
  summary: string;
  description?: string;
  startDateTime: string; // ISO 8601 format
  endDateTime: string; // ISO 8601 format
  attendeeName?: string;
}

export async function createCalendarEvent(
  params: CalendarEventParams
): Promise<{ success: boolean; eventId?: string; eventLink?: string; error?: string }> {
  try {
    const { auth, calendarId } = getAuth();
    const calendar = google.calendar({ version: "v3", auth });

    const event = {
      summary: params.summary || "Scheduled Meeting",
      description: params.description || `Meeting scheduled by Voice Assistant`,
      start: {
        dateTime: params.startDateTime,
        timeZone: "UTC",
      },
      end: {
        dateTime: params.endDateTime,
        timeZone: "UTC",
      },
    };

    console.log("Creating calendar event:", JSON.stringify(event, null, 2));

    const response = await calendar.events.insert({
      calendarId,
      requestBody: event,
    });

    console.log("Calendar event created:", response.data.id);

    return {
      success: true,
      eventId: response.data.id ?? undefined,
      eventLink: response.data.htmlLink ?? undefined,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to create calendar event:", errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}
