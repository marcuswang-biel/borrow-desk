import * as Effect from 'effect/Effect';
import { useState, type MouseEvent, type SubmitEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { run } from '../lib/client.ts';
import { showFailure } from '../lib/error.ts';
import { fieldValue } from '../lib/text.ts';
import { actions, alert, btnPrimary, btnSecondary, field, form, hint } from '../lib/ui.ts';
import { signIn as signInWithEmail, signUp as signUpWithEmail } from './auth-client.ts';
import { useSession } from './session.tsx';

/** Email and password form. A success loads the desk and opens the catalog. */
export const SignInPanel = () => {
	const { t } = useTranslation();
	const { refresh } = useSession();
	const navigate = useNavigate();
	const [authError, setAuthError] = useState('');
	const [pending, setPending] = useState(false);

	const signIn = (event: SubmitEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (pending) {
			return;
		}
		const form = event.currentTarget;
		setAuthError('');
		setPending(true);
		void run(
			signInWithEmail(fieldValue(form, 'email'), fieldValue(form, 'password')).pipe(
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

	const signUp = (event: MouseEvent<HTMLButtonElement>) => {
		if (pending) {
			return;
		}
		const form = event.currentTarget.form;
		if (form === null) {
			return;
		}
		setAuthError('');
		setPending(true);
		void run(
			signUpWithEmail(
				fieldValue(form, 'name'),
				fieldValue(form, 'email'),
				fieldValue(form, 'password'),
			).pipe(
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
		<form className={form} onSubmit={signIn}>
			<h1>{t('title')}</h1>
			<p className={hint}>{t('signInPrompt')}</p>
			<label className={field} htmlFor="name">
				{t('name')}
				<input autoComplete="name" id="name" name="name" />
			</label>
			<label className={field} htmlFor="email">
				{t('email')}
				<input autoComplete="email" id="email" name="email" required type="email" />
			</label>
			<label className={field} htmlFor="password">
				{t('password')}
				<input
					aria-describedby="password-hint"
					autoComplete="current-password"
					id="password"
					minLength={8}
					name="password"
					required
					type="password"
				/>
				<span className={hint} id="password-hint">
					{t('passwordHint')}
				</span>
			</label>
			{authError.length > 0 ? (
				<p className={alert} role="alert">
					{authError}
				</p>
			) : null}
			<div className={actions}>
				<button aria-busy={pending} className={btnPrimary} disabled={pending} type="submit">
					{t('signIn')}
				</button>
				<button
					aria-busy={pending}
					className={btnSecondary}
					disabled={pending}
					onClick={signUp}
					type="button"
				>
					{t('signUp')}
				</button>
			</div>
		</form>
	);
};
