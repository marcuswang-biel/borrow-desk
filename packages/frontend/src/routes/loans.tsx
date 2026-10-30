import type { Loan } from '@borrow-desk/api';

import { createFileRoute } from '@tanstack/react-router';
import * as Effect from 'effect/Effect';
import { useMemo, useState, type MouseEvent, type SubmitEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Empty, EmptyDescription, EmptyHeader } from '@/components/ui/empty';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from '@/components/ui/pagination';
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
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
import { borrow, returnLoan } from '../lib/api.ts';
import { run } from '../lib/client.ts';
import { showFailure } from '../lib/error.ts';
import { equipmentLabel, fieldValue, formatWhen, toMillis } from '../lib/text.ts';

/** Loans shown on one page of the record. */
const pageSize = 5;

/** Show Overdue loans first. Inside each group, the later start comes first. */
const compareLoans = (now: number, left: Loan, right: Loan): number => {
	const leftOverdue = left.returnedAt === null && left.endsAt < now;
	const rightOverdue = right.returnedAt === null && right.endsAt < now;
	/** If Left overdue loan not equal right overdue loan */
	if (leftOverdue !== rightOverdue) {
		return leftOverdue ? -1 : 1;
	}
	if (left.startsAt !== right.startsAt) {
		return right.startsAt - left.startsAt;
	}
	if (left.endsAt !== right.endsAt) {
		return right.endsAt - left.endsAt;
	}
	if (left.id === right.id) {
		return 0;
	}
	return left.id < right.id ? -1 : 1;
};

/** True when the query is empty or appears in the text, ignoring case. */
const matchesQuery = (query: string, text: string): boolean => {
	const needle = query.trim().toLowerCase();
	return needle.length === 0 || text.toLowerCase().includes(needle);
};

/** Page indexes, with gaps where a long list skips ahead. */
const pageItems = (current: number, count: number): ReadonlyArray<number | 'gap'> => {
	if (count <= 7) {
		return Array.from({ length: count }, (_, index) => index);
	}
	const wanted = [0, count - 1, current - 1, current, current + 1].filter(
		(index) => index >= 0 && index < count,
	);
	const sorted = [...new Set(wanted)].sort((left, right) => left - right);
	const items: Array<number | 'gap'> = [];
	for (const index of sorted) {
		const previous = items.at(-1);
		if (typeof previous === 'number' && index - previous > 1) {
			items.push('gap');
		}
		items.push(index);
	}
	return items;
};

/** Booking form and the loan board. */
const LoansPage = () => {
	const { t, i18n } = useTranslation();
	const { user, equipment, loans, refresh } = useSession();
	const [loanError, setLoanError] = useState('');
	const [pending, setPending] = useState(false);
	const [returningId, setReturningId] = useState<string | undefined>(undefined);
	const [pickedId, setPickedId] = useState<string | null>(null);
	const [page, setPage] = useState(0);
	const [query, setQuery] = useState('');
	const [now] = useState(() => Date.now());
	const orderedLoans = useMemo(() => {
		const next = [...loans];
		next.sort((left, right) => compareLoans(now, left, right));
		return next;
	}, [loans, now]);
	const filteredLoans = useMemo(
		() =>
			orderedLoans.filter((loan) => {
				const item = equipment.find((entry) => entry.id === loan.equipmentId);
				const overdue = loan.returnedAt === null && loan.endsAt < now;
				const status =
					loan.returnedAt !== null
						? t('returned', { when: formatWhen(loan.returnedAt, i18n.language) })
						: overdue
							? t('overdue')
							: t('out');
				return matchesQuery(
					query,
					[
						item?.code ?? loan.equipmentId,
						item?.name ?? '',
						loan.borrowerName,
						formatWhen(loan.startsAt, i18n.language),
						formatWhen(loan.endsAt, i18n.language),
						status,
					].join(' '),
				);
			}),
		[equipment, i18n.language, now, orderedLoans, query, t],
	);
	const equipmentId =
		pickedId !== null && equipment.some((item) => item.id === pickedId)
			? pickedId
			: (equipment[0]?.id ?? null);

	if (user === undefined) {
		return null;
	}

	const when = (millis: number) => formatWhen(millis, i18n.language);
	const stillOut = loans.filter((loan) => loan.returnedAt === null).length;
	const canBook = equipment.length > 0;
	const equipmentItems = equipment.map((item) => ({
		label: equipmentLabel(item),
		value: item.id,
	}));
	const invalid = loanError.length > 0;
	const pageCount = Math.max(1, Math.ceil(filteredLoans.length / pageSize));
	const current = Math.min(page, pageCount - 1);
	const visibleLoans = filteredLoans.slice(current * pageSize, (current + 1) * pageSize);

	const goTo = (next: number) => (event: MouseEvent<HTMLAnchorElement>) => {
		event.preventDefault();
		setPage(next);
	};

	const book = (event: SubmitEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (pending || equipmentId === null) {
			return;
		}
		const form = event.currentTarget;
		setLoanError('');
		setPending(true);
		void run(
			borrow(
				equipmentId,
				toMillis(fieldValue(form, 'startsAt')),
				toMillis(fieldValue(form, 'endsAt')),
			).pipe(
				Effect.andThen(refresh),
				Effect.tap(() =>
					Effect.sync(() => {
						form.reset();
					}),
				),
				showFailure(setLoanError),
				Effect.ensuring(
					Effect.sync(() => {
						setPending(false);
					}),
				),
			),
		);
	};

	const giveBack = (id: string) => {
		if (returningId !== undefined) {
			return;
		}
		setLoanError('');
		setReturningId(id);
		void run(
			returnLoan(id).pipe(
				Effect.andThen(refresh),
				showFailure(setLoanError),
				Effect.ensuring(
					Effect.sync(() => {
						setReturningId(undefined);
					}),
				),
			),
		);
	};

	return (
		<section className="flex flex-col gap-8">
			{canBook ? (
				<Card className="w-full max-w-xl">
					<CardHeader>
						<CardTitle>{t('borrow')}</CardTitle>
					</CardHeader>
					<CardContent>
						<form onSubmit={book}>
							<FieldGroup>
								<Field data-invalid={invalid || undefined}>
									<FieldLabel htmlFor="equipmentId">{t('equipment')}</FieldLabel>
									<Select items={equipmentItems} onValueChange={setPickedId} value={equipmentId}>
										<SelectTrigger aria-invalid={invalid} className="w-full" id="equipmentId">
											<SelectValue placeholder={t('equipment')} />
										</SelectTrigger>
										<SelectContent alignItemWithTrigger={false}>
											<SelectGroup>
												{equipmentItems.map((item) => (
													<SelectItem key={item.value} value={item.value}>
														{item.label}
													</SelectItem>
												))}
											</SelectGroup>
										</SelectContent>
									</Select>
								</Field>
								<Field data-invalid={invalid || undefined}>
									<FieldLabel htmlFor="startsAt">{t('starts')}</FieldLabel>
									<Input
										aria-invalid={invalid}
										id="startsAt"
										name="startsAt"
										required
										type="datetime-local"
									/>
								</Field>
								<Field data-invalid={invalid || undefined}>
									<FieldLabel htmlFor="endsAt">{t('ends')}</FieldLabel>
									<Input
										aria-invalid={invalid}
										id="endsAt"
										name="endsAt"
										required
										type="datetime-local"
									/>
								</Field>
								{invalid ? <FieldError>{loanError}</FieldError> : null}
								<Button
									aria-busy={pending}
									disabled={pending || equipmentId === null}
									type="submit"
								>
									{pending ? <Spinner data-icon="inline-start" /> : null}
									{t('borrow')}
								</Button>
							</FieldGroup>
						</form>
					</CardContent>
				</Card>
			) : (
				<Empty>
					<EmptyHeader>
						<EmptyDescription>{t('bookAfterCatalog')}</EmptyDescription>
					</EmptyHeader>
				</Empty>
			)}
			<Card className="min-w-0">
				<CardHeader className="border-b">
					<CardTitle>{t('loans')}</CardTitle>
					<CardDescription>{t('stillOut', { count: stillOut })}</CardDescription>
					{loans.length > 0 ? (
						<CardAction>
							<Input
								aria-label={t('search')}
								className="w-36 sm:w-56"
								onChange={(event) => {
									setQuery(event.target.value);
									setPage(0);
								}}
								placeholder={t('search')}
								type="search"
								value={query}
							/>
						</CardAction>
					) : null}
				</CardHeader>
				{loans.length === 0 ? (
					canBook ? (
						<CardContent>
							<Empty>
								<EmptyHeader>
									<EmptyDescription>{t('emptyLoans')}</EmptyDescription>
								</EmptyHeader>
							</Empty>
						</CardContent>
					) : null
				) : filteredLoans.length === 0 ? (
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
									<TableHead>{t('number')}</TableHead>
									<TableHead>{t('equipmentName')}</TableHead>
									<TableHead>{t('borrower')}</TableHead>
									<TableHead>{t('starts')}</TableHead>
									<TableHead>{t('ends')}</TableHead>
									<TableHead>{t('return')}</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{visibleLoans.map((loan) => {
									const item = equipment.find((entry) => entry.id === loan.equipmentId);
									const overdue = loan.returnedAt === null && loan.endsAt < now;
									const returning = returningId === loan.id;
									const canReturn =
										loan.returnedAt === null &&
										(user.role === 'admin' || loan.borrowerId === user.id);
									return (
										<TableRow key={loan.id}>
											<TableCell className="font-mono tabular-nums">
												{item === undefined ? loan.equipmentId : item.code}
											</TableCell>
											<TableCell>{item === undefined ? '—' : item.name}</TableCell>
											<TableCell>{loan.borrowerName}</TableCell>
											<TableCell className="tabular-nums">{when(loan.startsAt)}</TableCell>
											<TableCell className="tabular-nums">{when(loan.endsAt)}</TableCell>
											<TableCell>
												<div className="flex items-center gap-2">
													{overdue ? <Badge variant="destructive">{t('overdue')}</Badge> : null}
													{canReturn ? (
														<Button
															aria-busy={returning}
															disabled={returningId !== undefined}
															onClick={() => {
																giveBack(loan.id);
															}}
															size="sm"
															type="button"
															variant="outline"
														>
															{returning ? <Spinner data-icon="inline-start" /> : null}
															{t('return')}
														</Button>
													) : loan.returnedAt !== null ? (
														<Badge variant="outline">
															{t('returned', { when: when(loan.returnedAt) })}
														</Badge>
													) : overdue ? null : (
														<Badge variant="secondary">{t('out')}</Badge>
													)}
												</div>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</CardContent>
				)}
				{filteredLoans.length > 0 ? (
					<CardFooter className="justify-center">
						<Pagination aria-label={t('pagination')}>
							<PaginationContent>
								<PaginationItem>
									<PaginationPrevious
										aria-disabled={current === 0}
										aria-label={t('previousPage')}
										className={current === 0 ? 'pointer-events-none opacity-50' : ''}
										href="#loans"
										onClick={
											current === 0
												? (event) => {
														event.preventDefault();
													}
												: goTo(current - 1)
										}
										text={t('previousPage')}
									/>
								</PaginationItem>
								{pageItems(current, pageCount).map((item, index) =>
									item === 'gap' ? (
										<PaginationItem key={`gap-${index}`}>
											<PaginationEllipsis />
										</PaginationItem>
									) : (
										<PaginationItem key={item}>
											<PaginationLink
												href="#loans"
												isActive={item === current}
												onClick={goTo(item)}
												aria-label={t('pageNumber', { page: item + 1 })}
											>
												{item + 1}
											</PaginationLink>
										</PaginationItem>
									),
								)}
								<PaginationItem>
									<PaginationNext
										aria-disabled={current >= pageCount - 1}
										aria-label={t('nextPage')}
										className={current >= pageCount - 1 ? 'pointer-events-none opacity-50' : ''}
										href="#loans"
										onClick={
											current >= pageCount - 1
												? (event) => {
														event.preventDefault();
													}
												: goTo(current + 1)
										}
										text={t('nextPage')}
									/>
								</PaginationItem>
							</PaginationContent>
						</Pagination>
					</CardFooter>
				) : null}
				{!canBook && invalid ? (
					<CardContent>
						<Alert variant="destructive">
							<AlertDescription>{loanError}</AlertDescription>
						</Alert>
					</CardContent>
				) : null}
			</Card>
		</section>
	);
};

/** Loan route. A signed-out visitor goes back to sign-in. */
const LoansRoute = () => (
	<RequireSession>
		<LoansPage />
	</RequireSession>
);

/** Loan board. Overdue loans stay first, then the later start. */
export const Route = createFileRoute('/loans')({
	component: LoansRoute,
});
