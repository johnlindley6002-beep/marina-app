"use client";

import { formatLongDate } from "@/lib/dates";
import {
  getMyNotifications,
  markMyNotificationsRead,
  type MockNotification,
  useAccountData,
} from "@/lib/data";
import { useAuth } from "@/components/providers/AuthProvider";

const NONE: MockNotification[] = [];

// The mock notifications: approved, declined, booked and credit applied.
export default function OwnerUpdates() {
  const { user } = useAuth();
  const { value: notes, ready } = useAccountData(
    () => getMyNotifications(user?.id ?? null),
    NONE,
    user?.id ?? ""
  );
  const unread = notes.filter((n) => !n.read).length;

  if (ready && notes.length === 0) {
    return <p className="measure mt-4 text-ink-soft">No updates yet.</p>;
  }

  return (
    <div>
      <ul className="mt-4">
        {notes.map((note) => (
          <li key={note.id} className="hairline-top py-5 first:border-t-0">
            <p className={`text-ink ${note.read ? "" : "font-medium"}`}>
              {!note.read ? (
                <>
                  <span
                    aria-hidden="true"
                    className="mr-2 inline-block h-2 w-2 rounded-full bg-ink align-middle"
                  />
                  <span className="sr-only">Unread: </span>
                </>
              ) : null}
              {note.title}
            </p>
            <p className="mt-1 text-ink-soft">{note.body}</p>
            <p className="mt-1 text-sm text-ink-muted">{formatLongDate(note.at)}</p>
          </li>
        ))}
      </ul>
      {unread > 0 ? (
        <button
          type="button"
          onClick={() => void markMyNotificationsRead(user?.id ?? null)}
          className="btn-quiet mt-2"
        >
          Mark all as read
        </button>
      ) : null}
    </div>
  );
}
