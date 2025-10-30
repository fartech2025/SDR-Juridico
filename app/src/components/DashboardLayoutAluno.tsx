import SidebarAluno from "./SidebarAluno";
import HeaderAluno from "./HeaderAluno";
import { Outlet } from "react-router-dom";

export default function DashboardLayoutAluno() {
  return (
    <div className="flex h-screen bg-gray-950 text-gray-100">
      <SidebarAluno />
      <div className="flex-1 flex flex-col overflow-hidden">
        <HeaderAluno />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
