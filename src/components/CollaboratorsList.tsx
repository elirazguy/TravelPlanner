"use client";

import { User } from "lucide-react";

export interface CollaboratorUser {
  id: string;
  name?: string | null;
  email?: string | null;
  picture?: string | null;
  isOwner?: boolean;
}

export function CollaboratorsList({ users }: { users: CollaboratorUser[] }) {
  if (!users || users.length === 0) return null;

  return (
    <div className="flex items-center -space-x-2 space-x-reverse" title="משתתפים בטיול">
      {users.map((u) => {
        const name = u.name || u.email?.split("@")[0] || "משתמש";
        const roleText = u.isOwner ? `${name} (יוצר הטיול)` : `${name} (שותף בטיול)`;

        return (
          <div
            key={u.id}
            className="group relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-100 shadow-sm transition-transform hover:z-10 hover:scale-110"
          >
            {u.picture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={u.picture}
                alt={name}
                referrerPolicy="no-referrer"
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                {name.charAt(0).toUpperCase() || <User size={14} />}
              </div>
            )}

            {/* Role indicator badge */}
            {u.isOwner && (
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-amber-400 text-[8px] text-zinc-900 shadow">
                ★
              </span>
            )}

            {/* Hover Tooltip */}
            <div className="pointer-events-none absolute bottom-full mb-2 hidden whitespace-nowrap rounded-lg bg-zinc-900 px-2.5 py-1 text-xs text-white shadow-xl group-hover:block z-30 animate-in fade-in zoom-in-95">
              {roleText}
            </div>
          </div>
        );
      })}
    </div>
  );
}
