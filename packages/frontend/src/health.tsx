import { useState } from 'react';

import { authClient } from './core/auth.ts';
import { getHealth, getMe } from './core/api.ts';

const messageOf = (error: unknown) => {
	if (error instanceof Error) {
		return error.message;
	}
	if (
		typeof error === 'object' &&
		error !== null &&
		'message' in error &&
		typeof error.message === 'string'
	) {
		return error.message;
	}
	return 'Request failed';
};

const fieldValue = (form: HTMLFormElement, name: string) => {
	const value = new FormData(form).get(name);
	return typeof value === 'string' ? value : '';
};

export const HealthPage = () => {
	const [status, setStatus] = useState<'idle' | 'checking' | 'ok' | 'down'>('idle');
	const [detail, setDetail] = useState('');
	const [authDetail, setAuthDetail] = useState('');

	const check = () => {
		setStatus('checking');
		setDetail('');
		getHealth()
			.then(() => {
				setStatus('ok');
			})
			.catch((error) => {
				setStatus('down');
				setDetail(messageOf(error));
			});
	};

	const signIn = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const form = event.currentTarget;
		setAuthDetail('');
		authClient
			.signIn.email({
				email: fieldValue(form, 'email'),
				password: fieldValue(form, 'password'),
			})
			.then((result) => {
				setAuthDetail(result.error ? messageOf(result.error) : 'Signed in');
			})
			.catch((error) => {
				setAuthDetail(messageOf(error));
			});
	};

	const signUp = (event: React.MouseEvent<HTMLButtonElement>) => {
		const form = event.currentTarget.form;
		if (form === null) {
			return;
		}
		setAuthDetail('');
		authClient
			.signUp.email({
				name: fieldValue(form, 'name'),
				email: fieldValue(form, 'email'),
				password: fieldValue(form, 'password'),
			})
			.then((result) => {
				setAuthDetail(result.error ? messageOf(result.error) : 'Account created');
			})
			.catch((error) => {
				setAuthDetail(messageOf(error));
			});
	};

	const whoAmI = () => {
		setAuthDetail('');
		getMe()
			.then((user) => {
				setAuthDetail(`${user.name} <${user.email}>`);
			})
			.catch((error) => {
				setAuthDetail(messageOf(error));
			});
	};

	const label =
		status === 'checking'
			? 'Checking...'
			: status === 'ok'
				? 'OK'
				: status === 'down'
					? 'Down'
					: 'Not Checked';

	return (
		<main className="mx-auto flex h-dvh max-w-md flex-col justify-center gap-4 px-6">
			<h1 className="text-2xl font-semibold text-balance">Borrow Desk</h1>
			<p className="text-pretty text-zinc-600">
				Click the button below to check if the database is connected.
			</p>
			<p>{label}</p>
			{status === 'down' ? <p className="text-pretty text-red-700">{detail}</p> : null}
			<button
				className="w-fit bg-zinc-950 px-4 py-2 text-white disabled:opacity-50"
				disabled={status === 'checking'}
				onClick={check}
				type="button"
			>
				Check Database
			</button>

			<form className="flex flex-col gap-3" onSubmit={signIn}>
				<label className="flex flex-col gap-1" htmlFor="name">
					Name
					<input
						autoComplete="name"
						className="border border-zinc-300 px-3 py-2"
						id="name"
						name="name"
						type="text"
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
				<div className="flex gap-3">
					<button className="w-fit bg-zinc-950 px-4 py-2 text-white" type="submit">
						Sign in
					</button>
					<button
						className="w-fit border border-zinc-950 px-4 py-2"
						onClick={signUp}
						type="button"
					>
						Sign up
					</button>
					<button className="w-fit border border-zinc-950 px-4 py-2" onClick={whoAmI} type="button">
						Who am I
					</button>
				</div>
				{authDetail.length > 0 ? (
					<p className="text-pretty text-red-700" role="status">
						{authDetail}
					</p>
				) : null}
			</form>
		</main>
	);
};