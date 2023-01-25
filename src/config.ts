import { PUBLIC_LOCK_TIMEOUT_SECS, PUBLIC_LOCK_MAX_TRIALS } from '$env/static/public';

export const config = {
	LockTimeoutSecs: parseInt(PUBLIC_LOCK_TIMEOUT_SECS || '300'),
	LockMaxTrials: parseInt(PUBLIC_LOCK_MAX_TRIALS || '10')
};
