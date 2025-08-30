"use client";
export default function Sidebar({
  tab, setTab, isAdmin,
}:{ tab:"list"|"mine"|"add"|"delete"; setTab:(t:"list"|"mine"|"add"|"delete")=>void; isAdmin?:boolean }) {
  return (
    <aside className="w-64 border-r h-full p-4 bg-white/70">
      <nav className="space-y-1">
        <button onClick={()=>setTab("list")}
          className={`w-full text-left px-3 py-2 rounded ${tab==="list"?"bg-gray-900 text-white":"hover:bg-gray-100"}`}>
          現在の本のリスト
        </button>
        <button onClick={()=>setTab("mine")}
          className={`w-full text-left px-3 py-2 rounded ${tab==="mine"?"bg-gray-900 text-white":"hover:bg-gray-100"}`}>
          自分が借りている本
        </button>
        {isAdmin && (
          <div className="mt-4 pt-4 border-t space-y-1">
            <div className="px-3 text-xs font-medium text-gray-500">管理</div>
            <button onClick={()=>setTab("add")}
              className={`w-full text-left px-3 py-2 rounded ${tab==="add"?"bg-gray-900 text-white":"hover:bg-gray-100"}`}>
              本を追加
            </button>
            <button onClick={()=>setTab("delete")}
              className={`w-full text-left px-3 py-2 rounded ${tab==="delete"?"bg-gray-900 text-white":"hover:bg-gray-100"}`}>
              本を削除
            </button>
          </div>
        )}
      </nav>
    </aside>
  );
}
