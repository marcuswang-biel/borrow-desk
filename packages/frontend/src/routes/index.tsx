import { createFileRoute, Navigate } from '@tanstack/react-router';

/** Signed-in home. The account form lives on the root, so `/` opens the catalog. */
const HomePage = () => <Navigate to="/equipment" replace />;

/** Catalog entry at `/`. */
export const Route = createFileRoute('/')({
	component: HomePage,
});
