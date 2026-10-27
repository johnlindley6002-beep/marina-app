import type { Metadata } from "next";
import DockTasks from "@/features/staff/components/tasks/DockTasks";

export const metadata: Metadata = {
  title: "Dock tasks - Staff - aldock",
  description: "The dock team's task list.",
};

export default function TasksPage() {
  return <DockTasks />;
}
