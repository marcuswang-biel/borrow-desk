import * as React from 'react';

/** Viewport widths below this pixel count use the phone sidebar. */
const MOBILE_BREAKPOINT = 768;

/** True when the viewport is narrower than the sidebar breakpoint. */
export function useIsMobile() {
	const [isMobile, setIsMobile] = React.useState(() => window.innerWidth < MOBILE_BREAKPOINT);

	React.useEffect(() => {
		const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
		const onChange = () => {
			setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
		};
		mql.addEventListener('change', onChange);
		return () => mql.removeEventListener('change', onChange);
	}, []);

	return isMobile;
}
