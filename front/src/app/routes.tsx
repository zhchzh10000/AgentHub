import { createBrowserRouter } from "react-router";
import { Home } from "./pages/Home";
import { AgentGeneration } from "./pages/AgentGeneration";
import { Chat } from "./pages/Chat";
import { ProjectManagement } from "./pages/ProjectManagement";
import { Summaries } from "./pages/Summaries";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Home,
  },
  {
    path: "/generate",
    Component: AgentGeneration,
  },
  {
    path: "/chat",
    Component: Chat,
  },
  {
    path: "/project",
    Component: ProjectManagement,
  },
  {
    path: "/summaries",
    Component: Summaries,
  },
]);