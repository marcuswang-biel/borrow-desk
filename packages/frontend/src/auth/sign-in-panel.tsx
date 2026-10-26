import * as Effect from 'effect/Effect';
import { useState, type KeyboardEvent, type SubmitEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { run } from '../lib/client.ts';
import { showFailure } from '../lib/error.ts';
import { fieldValue } from '../lib/text.ts';
import {
	alert,
	authTabOff,
	authTabOn,
	authTabs,
	btnPrimary,
	field,
	form,
	hint,
} from '../lib/ui.ts';
import { signIn as signInWithEmail, signUp as signUpWithEmail } from './auth-client.ts';
import { useSession } from './session.tsx';

/** Which account form is showing. */
type AuthMode = 'sign-in' | 'sign-up';

/** DOM id for one account tab. */
const authTabId = (mode: AuthMode) =>
	mode === 'sign-in' ? 'auth-tab-sign-in' : 'auth-tab-sign-up';

/** Email and password form. Tabs switch between signing in and creating an account. */
export const SignInPanel = () => {
	const { t } = useTranslation();
	const { refresh } = useSession();
	const navigate = useNavigate();
	const [authError, setAuthError] = useState('');
	const [pending, setPending] = useState(false);
	const [mode, setMode] = useState<AuthMode>('sign-in');

	const choose = (next: AuthMode) => {
		setMode(next);
		setAuthError('');
	};

	const onTabKey = (event: KeyboardEvent<HTMLDivElement>) => {
		const next =
			event.key === 'ArrowRight' || event.key === 'ArrowDown' || event.key === 'End'
				? 'sign-up'
				: event.key === 'ArrowLeft' || event.key === 'ArrowUp' || event.key === 'Home'
					? 'sign-in'
					: undefined;
		if (next === undefined || next === mode) {
			return;
		}
		event.preventDefault();
		choose(next);
		event.currentTarget.querySelector<HTMLButtonElement>(`#${authTabId(next)}`)?.focus();
	};

	const submit = (event: SubmitEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (pending) {
			return;
		}
		const submitted = event.currentTarget;
		setAuthError('');
		setPending(true);
		const request =
			mode === 'sign-in'
				? signInWithEmail(fieldValue(submitted, 'email'), fieldValue(submitted, 'password'))
				: signUpWithEmail(
						fieldValue(submitted, 'name'),
						fieldValue(submitted, 'email'),
						fieldValue(submitted, 'password'),
					);
		void run(
			request.pipe(
				Effect.andThen(refresh),
				Effect.tap(() =>
					Effect.sync(() => {
						navigate('/equipment');
					}),
				),
				showFailure(setAuthError),
				Effect.ensuring(
					Effect.sync(() => {
						setPending(false);
					}),
				),
			),
		);
	};

	return (
		<form className={form} onSubmit={submit}>
			<h1>{t('title')}</h1>
			<div aria-label={t('accountTabs')} className={authTabs} onKeyDown={onTabKey} role="tablist">
				<button
					aria-controls="auth-panel"
					aria-selected={mode === 'sign-in'}
					className={mode === 'sign-in' ? authTabOn : authTabOff}
					id={authTabId('sign-in')}
					onClick={() => {
						choose('sign-in');
					}}
					role="tab"
					tabIndex={mode === 'sign-in' ? 0 : -1}
					type="button"
				>
					{t('signIn')}
				</button>
				<button
					aria-controls="auth-panel"
					aria-selected={mode === 'sign-up'}
					className={mode === 'sign-up' ? authTabOn : authTabOff}
					id={authTabId('sign-up')}
					onClick={() => {
						choose('sign-up');
					}}
					role="tab"
					tabIndex={mode === 'sign-up' ? 0 : -1}
					type="button"
				>
					{t('signUp')}
				</button>
			</div>
			<div aria-labelledby={authTabId(mode)} className="w-full" id="auth-panel" role="tabpanel">
				<div className="flex w-full flex-col items-start gap-4">
					{mode === 'sign-up' ? (
						<label className={field} htmlFor="name">
							{t('name')}
							<input autoComplete="name" id="name" name="name" required />
						</label>
					) : null}
					<label className={field} htmlFor="email">
						{t('email')}
						<input autoComplete="email" id="email" name="email" required type="email" />
					</label>
					<label className={field} htmlFor="password">
						{t('password')}
						<input
							{...(mode === 'sign-up' ? { 'aria-describedby': 'password-hint' } : {})}
							autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
							id="password"
							minLength={8}
							name="password"
							required
							type="password"
						/>
						{mode === 'sign-up' ? (
							<span className={hint} id="password-hint">
								{t('passwordHint')}
							</span>
						) : null}
					</label>
					{authError.length > 0 ? (
						<p className={alert} role="alert">
							{authError}
						</p>
					) : null}
					<button aria-busy={pending} className={btnPrimary} disabled={pending} type="submit">
						{mode === 'sign-in' ? t('signIn') : t('signUp')}
					</button>
				</div>
			</div>
		</form>
	);
};
