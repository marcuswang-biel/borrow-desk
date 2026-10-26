/** Schemas and tagged errors shared by the HTTP contract. */
export {
	CreateEquipment,
	Equipment,
	EquipmentCodeTaken,
	EquipmentNotFound,
} from './equipment/index.ts';
export type { EquipmentError } from './equipment/index.ts';
export { BorrowLoan, InvalidLoanPeriod, Loan, LoanConflict, LoanNotFound } from './loan/index.ts';
export type { LoanError } from './loan/index.ts';
export { ReminderNotice } from './reminder/index.ts';
export { Forbidden, Role, Unauthorized, User } from './user/index.ts';
export type { UserError } from './user/index.ts';
