import VoiceAssistant from "@/components/VoiceAssistant";

export default function Home() {
  return (
    <main className="main">
      <div className="background-effects">
        <div className="bg-gradient-1" />
        <div className="bg-gradient-2" />
        <div className="bg-gradient-3" />
      </div>

      <div className="container">
        <VoiceAssistant />

        <footer className="footer">
          <p>
            Powered by{" "}
            <a
              href="https://vapi.ai"
              target="_blank"
              rel="noopener noreferrer"
            >
              VAPI
            </a>{" "}
            ·{" "}
            <a
              href="https://calendar.google.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google Calendar
            </a>{" "}
            ·{" "}
            <a
              href="https://openai.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              OpenAI
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
