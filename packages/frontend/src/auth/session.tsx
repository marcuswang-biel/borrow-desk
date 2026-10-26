import type { Equipment, Loan, ReminderNotice, Unauthorized, User } from '@borrow-desk/api';
import type * as HttpClient from 'effect/http/HttpClient';

import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from 'react';

import type { DeskError } from '../lib/error.ts';

import { loadDesk } from '../lib/api.ts';
import { authedClient } from '../lib/client.ts';
import { sessionToken, signOut as endSession } from './auth-client.ts';

/** Signed-in desk, or the fact that the session is still unknown. */
export type Session = {
	status: 'loading' | 'anonymous' | 'signed-in';
	user: User | undefined;
	equipment: ReadonlyArray<Equipment>;
	loans: ReadonlyArray<Loan>;
	reminders: ReadonlyArray<ReminderNotice>;
	refresh: Effect.Effect<void, DeskError, HttpClient.HttpClient>;
	signOut: Effect.Effect<void, Unauthorized>;
	replaceReminders: (next: ReadonlyArray<ReminderNotice>) => void;
};

/** Shared catalog, loans, and the signed-in person. */
const SessionContext = createContext<Session | undefined>(undefined);

/** Reads the desk session. The provider must wrap the tree. */
export const useSession = () => {
	const value = useContext(SessionContext);
	if (value === undefined) {
		throw new Error('SessionProvider is missing');
	}
	return value;
};

/** Loads the signed-in desk once, then again after sign-in. */
export const SessionProvider = ({ children }: { children: ReactNode }) => {
	const [status, setStatus] = useState<Session['status']>('loading');
	const [user, setUser] = useState<User | undefined>(undefined);
	const [equipment, setEquipment] = useState<ReadonlyArray<Equipment>>([]);
	const [loans, setLoans] = useState<ReadonlyArray<Loan>>([]);
	const [reminders, setReminders] = useState<ReadonlyArray<ReminderNotice>>([]);

	const refresh = useMemo(
		(): Effect.Effect<void, DeskError, HttpClient.HttpClient> =>
			loadDesk.pipe(
				Effect.tap(([nextUser, nextEquipment, nextLoans, nextReminders]) =>
					Effect.sync(() => {
						setUser(nextUser);
						setEquipment(nextEquipment);
						setLoans(nextLoans);
						setReminders(nextReminders);
						setStatus('signed-in');
					}),
				),
			),
		[],
	);

	const signOut = useMemo(
		() =>
			endSession.pipe(
				Effect.tap(() =>
					Effect.sync(() => {
						setUser(undefined);
						setEquipment([]);
						setLoans([]);
						setReminders([]);
						setStatus('anonymous');
					}),
				),
			),
		[],
	);

	const replaceReminders = useCallback((next: ReadonlyArray<ReminderNotice>) => {
		setReminders(next);
	}, []);

	useEffect(() => {
		const fiber = Effect.runFork(
			sessionToken.pipe(
				Effect.flatMap((token) =>
					token === undefined ? Effect.sync(() => setStatus('anonymous')) : refresh,
				),
				Effect.catch(() => Effect.sync(() => setStatus('anonymous'))),
				Effect.provide(authedClient),
			),
		);
		return () => {
			void Effect.runPromise(Fiber.interrupt(fiber));
		};
	}, [refresh]);

	const value = useMemo<Session>(
		() => ({
			status,
			user,
			equipment,
			loans,
			reminders,
			refresh,
			signOut,
			replaceReminders,
		}),
		[status, user, equipment, loans, reminders, refresh, signOut, replaceReminders],
	);

	return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};
