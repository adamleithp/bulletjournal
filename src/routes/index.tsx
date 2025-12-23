import { createFileRoute } from "@tanstack/react-router";
import { BulletJournalView } from "@/components/bullet-journal";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
      <BulletJournalView />
  );
}
