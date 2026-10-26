import type { ReminderNotice, User } from '@borrow-desk/api';

/** Keeps the notes sent to this signed-in person. */
export const noticesFor = (
	user: User,
	notices: ReadonlyArray<ReminderNotice>,
): ReadonlyArray<ReminderNotice> => notices.filter((notice) => notice.userId === user.id);
