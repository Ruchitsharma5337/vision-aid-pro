import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  component: Index,
});

// The full project lives as plain HTML/CSS/JS in public/vaac/
// We simply redirect the root URL to it so the live preview shows the project.
function Index() {
  useEffect(() => {
    window.location.replace("/vaac/index.html");
  }, []);
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui" }}>
      Loading Visual Acuity Analysis & Compensation…
    </div>
  );
}
