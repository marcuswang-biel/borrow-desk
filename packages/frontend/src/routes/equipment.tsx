import { createFileRoute } from '@tanstack/react-router';
import * as Effect from 'effect/Effect';
import { useState, type SubmitEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Empty, EmptyDescription, EmptyHeader } from '@/components/ui/empty';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';

import { useSession } from '../auth/index.ts';
import { RequireSession } from '../components/require-session.tsx';
import { createEquipment } from '../lib/api.ts';
import { run } from '../lib/client.ts';
import { showFailure } from '../lib/error.ts';
import { fieldValue } from '../lib/text.ts';

/** True when the query is empty or appears in the text, ignoring case. */
const matchesQuery = (query: string, text: string): boolean => {
	const needle = query.trim().toLowerCase();
	return needle.length === 0 || text.toLowerCase().includes(needle);
};

/** Catalog. An admin can record a kind and a number. */
const EquipmentPage = () => {
	const { t } = useTranslation();
	const { user, equipment, refresh } = useSession();
	const [equipmentError, setEquipmentError] = useState('');
	const [pending, setPending] = useState(false);
	const [query, setQuery] = useState('');

	if (user === undefined) {
		return null;
	}

	const invalid = equipmentError.length > 0;
	const visibleEquipment = equipment.filter((item) =>
		matchesQuery(query, `${item.name} ${item.code}`),
	);

	const addEquipment = (event: SubmitEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (pending) {
			return;
		}
		const form = event.currentTarget;
		setEquipmentError('');
		setPending(true);
		void run(
			createEquipment(fieldValue(form, 'equipmentName'), fieldValue(form, 'equipmentCode')).pipe(
				Effect.andThen(refresh),
				Effect.tap(() =>
					Effect.sync(() => {
						form.reset();
					}),
				),
				showFailure(setEquipmentError),
				Effect.ensuring(
					Effect.sync(() => {
						setPending(false);
					}),
				),
			),
		);
	};

	const form =
		user.role === 'admin' ? (
			<Card>
				<CardHeader>
					<CardTitle>{t('recordEquipment')}</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={addEquipment}>
						<FieldGroup>
							<Field data-invalid={invalid || undefined}>
								<FieldLabel htmlFor="equipmentName">{t('equipmentName')}</FieldLabel>
								<Input aria-invalid={invalid} id="equipmentName" name="equipmentName" required />
							</Field>
							<Field data-invalid={invalid || undefined}>
								<FieldLabel htmlFor="equipmentCode">{t('number')}</FieldLabel>
								<Input
									aria-invalid={invalid}
									className="font-mono"
									id="equipmentCode"
									name="equipmentCode"
									required
								/>
							</Field>
							{invalid ? <FieldError>{equipmentError}</FieldError> : null}
							<Button aria-busy={pending} disabled={pending} type="submit">
								{pending ? <Spinner data-icon="inline-start" /> : null}
								{t('recordEquipment')}
							</Button>
						</FieldGroup>
					</form>
				</CardContent>
			</Card>
		) : null;

	return (
		<section
			className={
				user.role === 'admin'
					? 'grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]'
					: 'flex flex-col gap-8'
			}
		>
			<Card className="min-w-0">
				<CardHeader className="border-b">
					<CardTitle>{t('equipment')}</CardTitle>
					<CardDescription>{t('pieces', { count: equipment.length })}</CardDescription>
					{equipment.length > 0 ? (
						<CardAction>
							<Input
								aria-label={t('search')}
								className="w-36 sm:w-56"
								onChange={(event) => {
									setQuery(event.target.value);
								}}
								placeholder={t('search')}
								type="search"
								value={query}
							/>
						</CardAction>
					) : null}
				</CardHeader>
				{equipment.length === 0 ? (
					<CardContent>
						<Empty>
							<EmptyHeader>
								<EmptyDescription>
									{user.role === 'admin' ? t('emptyEquipmentAdmin') : t('emptyEquipmentEmployee')}
								</EmptyDescription>
							</EmptyHeader>
						</Empty>
					</CardContent>
				) : visibleEquipment.length === 0 ? (
					<CardContent>
						<Empty>
							<EmptyHeader>
								<EmptyDescription>{t('noMatches')}</EmptyDescription>
							</EmptyHeader>
						</Empty>
					</CardContent>
				) : (
					<CardContent className="px-0 [&_td:first-child]:pl-(--card-spacing) [&_td:last-child]:pr-(--card-spacing) [&_th:first-child]:pl-(--card-spacing) [&_th:last-child]:pr-(--card-spacing)">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>{t('equipmentName')}</TableHead>
									<TableHead className="text-right">{t('number')}</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{visibleEquipment.map((item) => (
									<TableRow key={item.id}>
										<TableCell>{item.name}</TableCell>
										<TableCell className="text-right font-mono tabular-nums">{item.code}</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				)}
			</Card>
			{form}
		</section>
	);
};

/** Catalog route. A signed-out visitor goes back to sign-in. */
const EquipmentRoute = () => (
	<RequireSession>
		<EquipmentPage />
	</RequireSession>
);

/** Catalog page. An admin can record a kind and a number. */
export const Route = createFileRoute('/equipment')({
	component: EquipmentRoute,
});
