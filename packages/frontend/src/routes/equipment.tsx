import * as Effect from 'effect/Effect';
import { useState, type SubmitEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { useSession } from '../auth/index.ts';
import { createEquipment } from '../lib/api.ts';
import { run } from '../lib/client.ts';
import { showFailure } from '../lib/error.ts';
import { fieldValue } from '../lib/text.ts';
import {
	alert,
	btnPrimary,
	catalog,
	catalogForm,
	empty,
	field,
	form as formClass,
	meta,
	screenHead,
	table,
	tag,
	tbody,
	td,
	tdNum,
	th,
	thNum,
	thead,
	tr,
} from '../lib/ui.ts';

/** Catalog. An admin can record a kind and a number. */
export const EquipmentPage = () => {
	const { t } = useTranslation();
	const { user, equipment, refresh } = useSession();
	const [equipmentError, setEquipmentError] = useState('');
	const [pending, setPending] = useState(false);

	if (user === undefined) {
		return null;
	}

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
			<form className={formClass} onSubmit={addEquipment}>
				<label className={field} htmlFor="equipmentName">
					{t('name')}
					<input id="equipmentName" name="equipmentName" required />
				</label>
				<label className={field} htmlFor="equipmentCode">
					{t('number')}
					<input className={tag} id="equipmentCode" name="equipmentCode" required />
				</label>
				{equipmentError.length > 0 ? (
					<p className={alert} role="alert">
						{equipmentError}
					</p>
				) : null}
				<button aria-busy={pending} className={btnPrimary} disabled={pending} type="submit">
					{t('recordEquipment')}
				</button>
			</form>
		) : null;

	return (
		<section className={user.role === 'admin' ? catalogForm : catalog}>
			<div className={screenHead}>
				<h1>{t('equipment')}</h1>
				<p className={meta}>{t('pieces', { count: equipment.length })}</p>
			</div>
			<div className="min-w-0">
				{equipment.length === 0 ? (
					<p className={empty}>
						{user.role === 'admin' ? t('emptyEquipmentAdmin') : t('emptyEquipmentEmployee')}
					</p>
				) : (
					<table className={table}>
						<thead className={thead}>
							<tr>
								<th className={th}>{t('name')}</th>
								<th className={thNum}>{t('number')}</th>
							</tr>
						</thead>
						<tbody className={tbody}>
							{equipment.map((item) => (
								<tr className={tr} key={item.id}>
									<td className={td}>{item.name}</td>
									<td className={tdNum}>
										<span className={tag}>{item.code}</span>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>
			{form}
		</section>
	);
};
