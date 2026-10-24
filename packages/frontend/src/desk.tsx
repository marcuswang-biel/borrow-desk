import type { Equipment, Loan, User } from '@borrow-desk/api';

import { useState } from 'react';

import {
	borrow,
	createEquipment,
	getHealth,
	getMe,
	listEquipment,
	listLoans,
	returnLoan,
} from './core/api.ts';
import { authClient } from './core/auth.ts';

/** Reads one named field from a form. */
const fieldValue = (form: HTMLFormElement, name: string) => {
	const data = new FormData(form);
	const value = data.get(name);
	return typeof value === 'string' ? value : '';
};

/** Turns a datetime-local value into epoch milliseconds. */
const toMillis = (value: string) => new Date(value).getTime();

/** Formats epoch milliseconds for the loan board. */
const formatWhen = (millis: number) =>
	new Intl.DateTimeFormat(undefined, {
		dateStyle: 'medium',
		timeStyle: 'short',
	}).format(millis);

/** Shows a piece as its kind and its number. */
const equipmentLabel = (item: Equipment) => `${item.name} ${item.code}`;

/** Reads a message from an API or auth failure. */
const messageOf = (error: unknown) => {
	if (typeof error === 'object' && error !== null && 'message' in error) {
		const message = error.message;
		if (typeof message === 'string' && message.length > 0) {
			return message;
		}
	}
	return 'Request failed';
};

/** Borrow desk: sign in, record equipment, and book a time that does not overlap. */
export const DeskPage = () => {
	const [user, setUser] = useState<User | undefined>(undefined);
	const [equipment, setEquipment] = useState<ReadonlyArray<Equipment>>([]);
	const [loans, setLoans] = useState<ReadonlyArray<Loan>>([]);
	const [health, setHealth] = useState('Not checked');
	const [authError, setAuthError] = useState('');
	const [equipmentError, setEquipmentError] = useState('');
	const [loanError, setLoanError] = useState('');

	const refresh = async () => {
		const [nextUser, nextEquipment, nextLoans] = await Promise.all([
			getMe(),
			listEquipment(),
			listLoans(),
		]);
		setUser(nextUser);
		setEquipment(nextEquipment);
		setLoans(nextLoans);
	};

	const signIn = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const form = event.currentTarget;
		setAuthError('');
		authClient.signIn
			.email({
				email: fieldValue(form, 'email'),
				password: fieldValue(form, 'password'),
			})
			.then((result) => {
				if (result.error) {
					setAuthError(messageOf(result.error));
					return;
				}
				return refresh();
			})
			.catch((error: unknown) => {
				setAuthError(messageOf(error));
			});
	};

	const signUp = (event: React.MouseEvent<HTMLButtonElement>) => {
		const form = event.currentTarget.form;
		if (form === null) {
			return;
		}
		setAuthError('');
		authClient.signUp
			.email({
				name: fieldValue(form, 'name'),
				email: fieldValue(form, 'email'),
				password: fieldValue(form, 'password'),
			})
			.then((result) => {
				if (result.error) {
					setAuthError(messageOf(result.error));
					return;
				}
				return refresh();
			})
			.catch((error: unknown) => {
				setAuthError(messageOf(error));
			});
	};

	/** Clears the session cookie and returns to the sign-in form. */
	const signOut = () => {
		setAuthError('');
		authClient
			.signOut()
			.then(() => {
				setUser(undefined);
				setEquipment([]);
				setLoans([]);
			})
			.catch((error: unknown) => {
				setAuthError(messageOf(error));
			});
	};

	const check = () => {
		setHealth('Checking');
		getHealth()
			.then(() => {
				setHealth('OK');
			})
			.catch(() => {
				setHealth('Down');
			});
	};

	const addEquipment = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const form = event.currentTarget;
		setEquipmentError('');
		createEquipment(fieldValue(form, 'equipmentName'), fieldValue(form, 'equipmentCode'))
			.then(() => refresh())
			.catch((error: unknown) => {
				setEquipmentError(messageOf(error));
			});
	};

	const book = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const form = event.currentTarget;
		setLoanError('');
		borrow(
			fieldValue(form, 'equipmentId'),
			toMillis(fieldValue(form, 'startsAt')),
			toMillis(fieldValue(form, 'endsAt')),
		)
			.then(() => refresh())
			.catch((error: unknown) => {
				setLoanError(messageOf(error));
			});
	};

	const giveBack = (id: string) => {
		setLoanError('');
		returnLoan(id)
			.then(() => refresh())
			.catch((error: unknown) => {
				setLoanError(messageOf(error));
			});
	};

	return (
		<main className="mx-auto flex min-h-dvh max-w-5xl flex-col gap-8 px-6 py-10">
			<header className="flex flex-col gap-2">
				<h1 className="text-3xl font-semibold text-balance">Borrow Desk</h1>
				<p className="text-pretty text-zinc-600">
					Record equipment, then book a time. Overlapping bookings name the person who already has
					it.
				</p>
				<p className="text-zinc-700 tabular-nums">Database: {health}</p>
				<button className="w-fit bg-zinc-950 px-4 py-2 text-white" onClick={check} type="button">
					Check database
				</button>
			</header>

			{user === undefined ? (
				<form className="flex max-w-md flex-col gap-3" onSubmit={signIn}>
					<p className="text-pretty text-zinc-600">Sign in to see the catalog.</p>
					<label className="flex flex-col gap-1" htmlFor="name">
						Name
						<input
							autoComplete="name"
							className="border border-zinc-300 px-3 py-2"
							id="name"
							name="name"
						/>
					</label>
					<label className="flex flex-col gap-1" htmlFor="email">
						Email
						<input
							autoComplete="email"
							className="border border-zinc-300 px-3 py-2"
							id="email"
							name="email"
							required
							type="email"
						/>
					</label>
					<label className="flex flex-col gap-1" htmlFor="password">
						Password
						<input
							autoComplete="current-password"
							className="border border-zinc-300 px-3 py-2"
							id="password"
							minLength={8}
							name="password"
							required
							type="password"
						/>
					</label>
					{authError.length > 0 ? <p className="text-pretty text-red-700">{authError}</p> : null}
					<div className="flex gap-3">
						<button className="bg-zinc-950 px-4 py-2 text-white" type="submit">
							Sign in
						</button>
						<button className="border border-zinc-300 px-4 py-2" onClick={signUp} type="button">
							Sign up
						</button>
					</div>
				</form>
			) : (
				<div className="grid gap-8 md:grid-cols-2">
					<section className="flex flex-col gap-4">
						<h2 className="text-xl font-semibold text-balance">Equipment</h2>
						<p className="text-pretty text-zinc-600">
							Signed in as {user.name} ({user.role}).
						</p>
						<button
							className="w-fit border border-zinc-300 px-3 py-1"
							onClick={signOut}
							type="button"
						>
							Sign out
						</button>
						{equipment.length === 0 ? (
							<p className="text-pretty text-zinc-600">
								{user.role === 'admin'
									? 'No equipment yet. Record the first piece below.'
									: 'No equipment yet. Ask an admin to record one.'}
							</p>
						) : (
							<ul className="flex flex-col gap-2">
								{equipment.map((item) => (
									<li className="border border-zinc-200 px-3 py-2" key={item.id}>
										{item.name} <span className="tabular-nums">{item.code}</span>
									</li>
								))}
							</ul>
						)}
						{user.role === 'admin' ? (
							<form className="flex flex-col gap-3" onSubmit={addEquipment}>
								<label className="flex flex-col gap-1" htmlFor="equipmentName">
									Name
									<input
										className="border border-zinc-300 px-3 py-2"
										id="equipmentName"
										name="equipmentName"
										required
									/>
								</label>
								<label className="flex flex-col gap-1" htmlFor="equipmentCode">
									Number
									<input
										className="border border-zinc-300 px-3 py-2 tabular-nums"
										id="equipmentCode"
										name="equipmentCode"
										required
									/>
								</label>
								{equipmentError.length > 0 ? (
									<p className="text-pretty text-red-700">{equipmentError}</p>
								) : null}
								<button className="w-fit bg-zinc-950 px-4 py-2 text-white" type="submit">
									Record equipment
								</button>
							</form>
						) : null}
					</section>

					<section className="flex flex-col gap-4">
						<h2 className="text-xl font-semibold text-balance">Loans</h2>
						{equipment.length === 0 ? (
							<p className="text-pretty text-zinc-600">
								Book a loan after the catalog has equipment.
							</p>
						) : (
							<form className="flex flex-col gap-3" onSubmit={book}>
								<label className="flex flex-col gap-1" htmlFor="equipmentId">
									Equipment
									<select
										className="border border-zinc-300 px-3 py-2"
										id="equipmentId"
										name="equipmentId"
										required
									>
										{equipment.map((item) => (
											<option key={item.id} value={item.id}>
												{equipmentLabel(item)}
											</option>
										))}
									</select>
								</label>
								<label className="flex flex-col gap-1" htmlFor="startsAt">
									Starts
									<input
										className="border border-zinc-300 px-3 py-2"
										id="startsAt"
										name="startsAt"
										required
										type="datetime-local"
									/>
								</label>
								<label className="flex flex-col gap-1" htmlFor="endsAt">
									Ends
									<input
										className="border border-zinc-300 px-3 py-2"
										id="endsAt"
										name="endsAt"
										required
										type="datetime-local"
									/>
								</label>
								{loanError.length > 0 ? (
									<p className="text-pretty text-red-700">{loanError}</p>
								) : null}
								<button className="w-fit bg-zinc-950 px-4 py-2 text-white" type="submit">
									Borrow
								</button>
							</form>
						)}
						{loans.length === 0 ? (
							<p className="text-pretty text-zinc-600">No loans yet.</p>
						) : (
							<ul className="flex flex-col gap-3">
								{loans.map((loan) => {
									const item = equipment.find((entry) => entry.id === loan.equipmentId);
									return (
										<li
											className="flex flex-col gap-1 border border-zinc-200 px-3 py-2"
											key={loan.id}
										>
											<span>
												{item === undefined ? (
													loan.equipmentId
												) : (
													<>
														{item.name} <span className="tabular-nums">{item.code}</span>
													</>
												)}
											</span>
											<span className="text-zinc-700 tabular-nums">
												{loan.borrowerName}: {formatWhen(loan.startsAt)} – {formatWhen(loan.endsAt)}
											</span>
											{loan.returnedAt === null &&
											(user.role === 'admin' || loan.borrowerId === user.id) ? (
												<button
													className="w-fit border border-zinc-300 px-3 py-1"
													onClick={() => {
														giveBack(loan.id);
													}}
													type="button"
												>
													Return
												</button>
											) : loan.returnedAt === null ? null : (
												<span className="text-zinc-500 tabular-nums">
													Returned {formatWhen(loan.returnedAt)}
												</span>
											)}
										</li>
									);
								})}
							</ul>
						)}
					</section>
				</div>
			)}
		</main>
	);
};
