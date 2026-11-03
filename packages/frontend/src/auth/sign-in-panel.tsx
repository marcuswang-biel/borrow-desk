import { useNavigate } from '@tanstack/react-router';
import * as Effect from 'effect/Effect';
import { useState, type SubmitEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { run } from '../lib/client.ts';
import { showFailure } from '../lib/error.ts';
import { fieldValue } from '../lib/text.ts';
import { m } from '../paraglide/messages.js';
import {
	sendActivation,
	signIn as signInWithEmail,
	signUp as signUpWithEmail,
	type AuthStep,
} from './auth-client.ts';
import { useSession } from './session.tsx';

/** Which account form is showing. */
type AuthMode = 'sign-in' | 'sign-up';

/** Tells the person to open the activation link before the desk will sign them in. */
const ActivationNotice = ({
	email,
	error,
	pending,
	resent,
	onBack,
	onResend,
}: {
	email: string;
	error: string;
	pending: boolean;
	resent: boolean;
	onBack: () => void;
	onResend: () => void;
}) => (
	<FieldGroup>
		<CardDescription>{m.activationBody({ email })}</CardDescription>
		{resent ? <FieldDescription>{m.activationSent()}</FieldDescription> : null}
		{error.length > 0 ? <FieldError>{error}</FieldError> : null}
		<Button aria-busy={pending} disabled={pending} onClick={onResend} type="button">
			{pending ? <Spinner data-icon="inline-start" /> : null}
			{m.activationResend()}
		</Button>
		<Button disabled={pending} onClick={onBack} type="button" variant="outline">
			{m.activationBack()}
		</Button>
	</FieldGroup>
);

/** Email and password form. Tabs switch between signing in and creating an account. */
export const SignInPanel = () => {
	const { refresh, signOut } = useSession();
	const navigate = useNavigate();
	const [authError, setAuthError] = useState('');
	const [pending, setPending] = useState(false);
	const [mode, setMode] = useState<AuthMode>('sign-in');
	const [activationEmail, setActivationEmail] = useState<string | undefined>(undefined);
	const [resent, setResent] = useState(false);
	const invalid = authError.length > 0;

	const choose = (next: AuthMode) => {
		setMode(next);
		setAuthError('');
	};

	const back = () => {
		setActivationEmail(undefined);
		setResent(false);
		setAuthError('');
		setMode('sign-in');
	};

	const resend = () => {
		if (pending || activationEmail === undefined) {
			return;
		}
		setAuthError('');
		setPending(true);
		void run(
			sendActivation(activationEmail).pipe(
				Effect.tap(() =>
					Effect.sync(() => {
						setResent(true);
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

	const enter = (step: AuthStep) => {
		if (step._tag === 'ActivationRequired') {
			return signOut.pipe(
				Effect.ignore,
				Effect.andThen(
					Effect.sync(() => {
						setActivationEmail(step.email);
						setResent(false);
					}),
				),
			);
		}
		return refresh.pipe(
			Effect.tap(() =>
				Effect.sync(() => {
					navigate({ to: '/equipment' });
				}),
			),
		);
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
				Effect.flatMap(enter),
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
				<CardTitle>{activationEmail === undefined ? m.title() : m.activationTitle()}</CardTitle>
			</CardHeader>
			<CardContent>
				{activationEmail !== undefined ? (
					<ActivationNotice
						email={activationEmail}
						error={authError}
						onBack={back}
						onResend={resend}
						pending={pending}
						resent={resent}
					/>
				) : (
					<Tabs
						onValueChange={(value) => {
							if (value === 'sign-in' || value === 'sign-up') {
								choose(value);
							}
						}}
						value={mode}
					>
						<TabsList className="w-full">
							<TabsTrigger value="sign-in">{m.signIn()}</TabsTrigger>
							<TabsTrigger value="sign-up">{m.signUp()}</TabsTrigger>
						</TabsList>
						<form onSubmit={submit}>
							<FieldGroup>
								{mode === 'sign-up' ? (
									<Field>
										<FieldLabel htmlFor="name">{m.personName()}</FieldLabel>
										<Input autoComplete="name" id="name" name="name" required />
									</Field>
								) : null}
								<Field data-invalid={invalid || undefined}>
									<FieldLabel htmlFor="email">{m.email()}</FieldLabel>
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
									<FieldLabel htmlFor="password">{m.password()}</FieldLabel>
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
										<FieldDescription id="password-hint">{m.passwordHint()}</FieldDescription>
									) : null}
								</Field>
								{invalid ? <FieldError>{authError}</FieldError> : null}
								<Button aria-busy={pending} disabled={pending} type="submit">
									{pending ? <Spinner data-icon="inline-start" /> : null}
									{mode === 'sign-in' ? m.signIn() : m.signUp()}
								</Button>
							</FieldGroup>
						</form>
					</Tabs>
				)}
			</CardContent>
		</Card>
	);
};
