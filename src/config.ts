import { PUBLIC_LOCK_TIMEOUT_SECS } from '$env/static/public';
export const config = {
	LockTimeoutSecs: parseInt(PUBLIC_LOCK_TIMEOUT_SECS || '300')
};
