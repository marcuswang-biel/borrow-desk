# Borrow Desk

Borrow Desk is the desk where people book shared equipment for a stretch of time. Admins put equipment on the catalog. Anyone signed in can book it, as long as nobody else already has it for that stretch.

## Equipment

One physical piece that can be booked. It has a name for the kind and a number that sets it apart from the other pieces of that kind. Two pieces may share a name when their numbers differ. The same name and number cannot be recorded twice. Avoid "asset" and "item" when you mean this record.

## Loan

One booking of one piece of equipment from a start instant to an end instant. The range is half-open: the end instant is free for the next person. A loan is open until someone returns it.

## Conflict

Two open loans of the same equipment whose ranges overlap. The failure names the person who already holds the earlier loan. Touching at the boundary is not a conflict.

## Reminder

A note sent once to the borrower after the end instant, if the loan is still open. Sending it again does not create a second note.

## Admin

An account whose email is listed in `ADMIN_EMAIL`. Several addresses can be listed, separated by commas. Only an admin records equipment. An admin may also return someone else's loan.

## Employee

Every other signed-in account. An employee books and returns their own loans.
