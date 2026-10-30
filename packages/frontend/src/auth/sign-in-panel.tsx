import * as Effect from 'effect/Effect';
import { useState, type SubmitEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { run } from '../lib/client.ts';
import { showFailure } from '../lib/error.ts';
import { fieldValue } from '../lib/text.ts';
import { signIn as signInWithEmail, signUp as signUpWithEmail } from './auth-client.ts';
import { useSession } from './session.tsx';

/** Which account form is showing. */
type AuthMode = 'sign-in' | 'sign-up';

/** Email and password form. Tabs switch between signing in and creating an account. */
export const SignInPanel = () => {
	const { t } = useTranslation();
	const { refresh } = useSession();
	const navigate = useNavigate();
	const [authError, setAuthError] = useState('');
	const [pending, setPending] = useState(false);
	const [mode, setMode] = useState<AuthMode>('sign-in');
	const invalid = authError.length > 0;

	const choose = (next: AuthMode) => {
		setMode(next);
		setAuthError('');
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
		<Card className="w-full max-w-md">
			<CardHeader>
				<CardTitle>{t('title')}</CardTitle>
			</CardHeader>
			<CardContent>
				<Tabs
					onValueChange={(value) => {
						if (value === 'sign-in' || value === 'sign-up') {
							choose(value);
						}
					}}
					value={mode}
				>
					<TabsList className="w-full">
						<TabsTrigger value="sign-in">{t('signIn')}</TabsTrigger>
						<TabsTrigger value="sign-up">{t('signUp')}</TabsTrigger>
					</TabsList>
					<form onSubmit={submit}>
						<FieldGroup>
							{mode === 'sign-up' ? (
								<Field>
									<FieldLabel htmlFor="name">{t('personName')}</FieldLabel>
									<Input autoComplete="name" id="name" name="name" required />
								</Field>
							) : null}
							<Field data-invalid={invalid || undefined}>
								<FieldLabel htmlFor="email">{t('email')}</FieldLabel>
								<Input
									aria-invalid={invalid}
									autoComplete="email"
									id="email"
									name="email"
									required
									type="email"
								/>
							</Field>
							<Field data-invalid={invalid || undefined}>
								<FieldLabel htmlFor="password">{t('password')}</FieldLabel>
								<Input
									aria-describedby={mode === 'sign-up' ? 'password-hint' : undefined}
									aria-invalid={invalid}
									autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
									id="password"
									minLength={8}
									name="password"
									required
									type="password"
								/>
								{mode === 'sign-up' ? (
									<FieldDescription id="password-hint">{t('passwordHint')}</FieldDescription>
								) : null}
							</Field>
							{invalid ? <FieldError>{authError}</FieldError> : null}
							<Button aria-busy={pending} disabled={pending} type="submit">
								{pending ? <Spinner data-icon="inline-start" /> : null}
								{mode === 'sign-in' ? t('signIn') : t('signUp')}
							</Button>
						</FieldGroup>
					</form>
				</Tabs>
			</CardContent>
		</Card>
	);
};
