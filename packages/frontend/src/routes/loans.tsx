import * as Effect from 'effect/Effect';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { useSession } from '../auth/index.ts';
import { borrow, returnLoan } from '../lib/api.ts';
import { run } from '../lib/client.ts';
import { showFailure } from '../lib/error.ts';
import { equipmentLabel, fieldValue, formatWhen, toMillis } from '../lib/text.ts';
import {
	alert,
	btnPrimary,
	btnSecondary,
	empty,
	field,
	form as formClass,
	loanBoard,
	loanForm,
	meta,
	out,
	pill,
	screenHead,
	table,
	tagOut,
	tagQuiet,
	tbody,
	td,
	tdAction,
	tdMeta,
	tdWhen,
	th,
	thNum,
	thead,
	tr,
} from '../lib/ui.ts';

/** Booking form and the loan board. */
export const LoansPage = () => {
	const { t, i18n } = useTranslation();
	const { user, equipment, loans, refresh } = useSession();
	const [loanError, setLoanError] = useState('');
	const [pending, setPending] = useState(false);
	const [returningId, setReturningId] = useState<string | undefined>(undefined);

	if (user === undefined) {
		return null;
	}

	const when = (millis: number) => formatWhen(millis, i18n.language);
	const [now] = useState(() => Date.now());
	const stillOut = loans.filter((loan) => loan.returnedAt === null).length;
	const canBook = equipment.length > 0;

	const book = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (pending) {
			return;
		}
		const form = event.currentTarget;
		setLoanError('');
		setPending(true);
		void run(
			borrow(
				fieldValue(form, 'equipmentId'),
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
		<section className={canBook ? loanForm : loanBoard}>
			<div className={screenHead}>
				<h1>{t('loans')}</h1>
				<p className={meta}>{t('stillOut', { count: stillOut })}</p>
			</div>
			<div className="min-w-0">
				{canBook ? (
					<form className={formClass} onSubmit={book}>
						<label className={field} htmlFor="equipmentId">
							{t('equipment')}
							<select id="equipmentId" name="equipmentId" required>
								{equipment.map((item) => (
									<option key={item.id} value={item.id}>
										{equipmentLabel(item)}
									</option>
								))}
							</select>
						</label>
						<label className={field} htmlFor="startsAt">
							{t('starts')}
							<input id="startsAt" name="startsAt" required type="datetime-local" />
						</label>
						<label className={field} htmlFor="endsAt">
							{t('ends')}
							<input id="endsAt" name="endsAt" required type="datetime-local" />
						</label>
						{loanError.length > 0 ? (
							<p className={alert} role="alert">
								{loanError}
							</p>
						) : null}
						<button aria-busy={pending} className={btnPrimary} disabled={pending} type="submit">
							{t('borrow')}
						</button>
					</form>
				) : (
					<p className={empty}>{t('bookAfterCatalog')}</p>
				)}
			</div>
			<div className="min-w-0">
				{loans.length === 0 ? (
					canBook ? (
						<p className={empty}>{t('emptyLoans')}</p>
					) : null
				) : (
					<table className={table}>
						<thead className={thead}>
							<tr>
								<th className={th}>{t('number')}</th>
								<th className={th}>{t('name')}</th>
								<th className={th}>{t('borrower')}</th>
								<th className={thNum}>{t('starts')}</th>
								<th className={thNum}>{t('ends')}</th>
								<th className={thNum}>{t('return')}</th>
							</tr>
						</thead>
						<tbody className={tbody}>
							{loans.map((loan) => {
								const item = equipment.find((entry) => entry.id === loan.equipmentId);
								const overdue = loan.returnedAt === null && loan.endsAt < now;
								const state = loan.returnedAt === null ? 'out' : 'returned';
								const returning = returningId === loan.id;
								const canReturn =
									loan.returnedAt === null &&
									(user.role === 'admin' || loan.borrowerId === user.id);
								return (
									<tr className={tr} key={loan.id}>
										<td className={td}>
											<span className={overdue || state === 'returned' ? tagQuiet : tagOut}>
												{item === undefined ? loan.equipmentId : item.code}
											</span>
										</td>
										<td className={td}>{item === undefined ? '—' : item.name}</td>
										<td className={tdMeta}>{loan.borrowerName}</td>
										<td className={tdWhen}>{when(loan.startsAt)}</td>
										<td className={tdWhen}>{when(loan.endsAt)}</td>
										<td className={tdAction}>
											{overdue ? <span className={pill}>{t('overdue')}</span> : null}{' '}
											{canReturn ? (
												<button
													aria-busy={returning}
													className={btnSecondary}
													disabled={returningId !== undefined}
													onClick={() => {
														giveBack(loan.id);
													}}
													type="button"
												>
													{t('return')}
												</button>
											) : loan.returnedAt !== null ? (
												<span className={meta}>
													{t('returned', { when: when(loan.returnedAt) })}
												</span>
											) : overdue ? null : (
												<span className={out}>{t('out')}</span>
											)}
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				)}
				{!canBook && loanError.length > 0 ? (
					<p className={alert} role="alert">
						{loanError}
					</p>
				) : null}
			</div>
		</section>
	);
};
