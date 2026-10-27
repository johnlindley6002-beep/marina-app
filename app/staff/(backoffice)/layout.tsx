import StaffGate from "@/features/staff/components/StaffGate";

// Every back office page needs a signed-in staff member.
export default function BackOfficeLayout({ children }: { children: React.ReactNode }) {
  return <StaffGate>{children}</StaffGate>;
}
