import { config } from '@app/config';
import { settingsStorage } from '@app/common/storage';

const TimeLockStorageKey = 'timelock';

interface TimelockSettings {
	lastTouched: number;
	unlockTrials: number;
}

class TimeLockTimeoutException extends Error {}

export class TimeLock {
	private settings: TimelockSettings = {
		unlockTrials: 0,
		lastTouched: 0
	};
	private isReady = false;
	constructor(private timeoutSecs: number) {
		this.init().then(() => (this.isReady = true));
	}

	private async init() {
		const settings = await settingsStorage.get<TimelockSettings>(TimeLockStorageKey);
		if (!settings) {
			await this.update({
				lastTouched: Date.now(),
				unlockTrials: 0
			});
		} else {
			this.settings = settings;
		}
	}

	private async update(settings: Partial<TimelockSettings>) {
		this.settings = {
			...this.settings,
			...settings
		};
		await settingsStorage.set(TimeLockStorageKey, this.settings);
	}

	async touch(lockedCallback: () => void): Promise<void> {
		if (!this.isReady) return Promise.resolve();
		if (Date.now() - this.settings.lastTouched < this.timeoutSecs) {
			await this.update({ lastTouched: Date.now() });
		} else {
			lockedCallback();
		}
	}
}

export const timelock = new TimeLock(config.LockTimeoutSecs * 1000);
