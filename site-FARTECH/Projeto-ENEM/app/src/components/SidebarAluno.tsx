import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  Award,
  PieChart,
  User,
  FileText,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function SidebarAluno() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const linkClasses = (path: string) =>
    "flex items-center gap-3 px-5 py-3 hover:bg-gray-800 transition-colors " +
    (location.pathname === path
      ? "bg-gray-800 text-blue-400"
      : "text-gray-300");

  return (
    <aside
      className={
        "bg-gray-900 border-r border-gray-800 h-screen flex flex-col transition-all duration-300 " +
        (collapsed ? "w-20" : "w-64")
      }
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        {!collapsed && (
          <h1 className="text-lg font-bold text-blue-400">ENEM</h1>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-400 hover:text-blue-400"
          aria-label="Alternar menu lateral"
        >
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
        </button>
      </div>

      <nav className="flex-1 mt-4 space-y-1">
        <Link to="/painel-aluno" className={linkClasses("/painel-aluno")}>
          <User className="w-5 h-5 text-blue-400" />
          {!collapsed && <span>Painel</span>}
        </Link>

        <Link to="/provas" className={linkClasses("/provas")}>
          <FileText className="w-5 h-5 text-purple-400" />
          {!collapsed && <span>Provas</span>}
        </Link>

        <Link to="/ranking" className={linkClasses("/ranking")}>
          <Award className="w-5 h-5 text-yellow-400" />
          {!collapsed && <span>Ranking</span>}
        </Link>

        <Link to="/estatisticas" className={linkClasses("/estatisticas")}>
          <PieChart className="w-5 h-5 text-green-400" />
          {!collapsed && <span>Estatísticas</span>}
        </Link>
      </nav>

      <div className="border-t border-gray-800 p-4">
        <button
          onClick={logout}
          className="flex items-center gap-3 text-red-400 hover:text-red-300"
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}
