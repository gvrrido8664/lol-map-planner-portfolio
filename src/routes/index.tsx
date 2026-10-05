import { createFileRoute } from "@tanstack/react-router";
import { EditorPage } from "@/components/lol/EditorPage";

export const Route = createFileRoute("/")({ component: EditorPage });
