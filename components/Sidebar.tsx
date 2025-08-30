"use client";
export default function Sidebar({
  tab, setTab,
}:{ tab:"list"|"mine"; setTab:(t:"list"|"mine")=>void }) {
  return (
    <aside className="w-64 border-r h-full p-4">
      <nav className="space-y-1">
        <button onClick={()=>setTab("list")}
          className={`w-full text-left px-3 py-2 rounded ${tab==="list"?"bg-gray-900 text-white":"hover:bg-gray-100"}`}>
          現在の本のリスト
        </button>
        <button onClick={()=>setTab("mine")}
          className={`w-full text-left px-3 py-2 rounded ${tab==="mine"?"bg-gray-900 text-white":"hover:bg-gray-100"}`}>
          自分が借りている本
        </button>
      </nav>
    </aside>
  );
}