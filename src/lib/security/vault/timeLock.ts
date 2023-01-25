import { config } from '@app/config';
import { settingsStorage } from '../../storage';

const TimeLockStorageKey = 'timelock';

export enum TimeLockEvent {
	IsLocked,
	MaxTrialsExceeded
}

interface TimelockSettings {
	lastTouched: number;
	unlockTrials: number;
}

type TimeLockListener = (event: TimeLockEvent) => void;

export class TimeLock {
	private settings: TimelockSettings = {
		unlockTrials: 0,
		lastTouched: 0
	};
	private isReady = false;
	private timer: NodeJS.Timeout | null = null;
	private listener: TimeLockListener[] = [];

	constructor(private timeoutMillies: number, private maxTrials: number) {
		this.init().then(() => {
			this.isReady = true;
			return this.touch();
		});
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

	getMilliesToLock(): number {
		return this.timeoutMillies * (this.settings.unlockTrials + 1) ** 2;
	}

	private resetTimer() {
		if (this.timer) {
			clearTimeout(this.timer);
		}
		this.timer = setTimeout(() => {
			this.notifyListener(TimeLockEvent.IsLocked);
		}, this.getMilliesToLock());
	}

	public listen(callback: (event: TimeLockEvent) => void) {
		this.listener.push(callback);
	}

	private notifyListener(event: TimeLockEvent): void {
		this.listener.forEach((l) => l(event));
	}

	async touch(): Promise<void> {
		if (!this.isReady) return Promise.resolve();
		if (Date.now() - this.settings.lastTouched < this.timeoutMillies) {
			await this.update({ lastTouched: Date.now() });
			this.resetTimer();
		} else {
			this.notifyListener(TimeLockEvent.IsLocked);
		}
	}

	async reset() {
		return this.update({
			lastTouched: Date.now(),
			unlockTrials: 0
		});
	}

	async incrementUnlockFailure() {
		const newUnlockTrials = this.settings.unlockTrials + 1;
		await this.update({ unlockTrials: newUnlockTrials });
		if (this.settings.unlockTrials >= this.maxTrials) {
			this.resetTimer();
			this.notifyListener(TimeLockEvent.MaxTrialsExceeded);
		}
	}
}

export const timelock = new TimeLock(config.LockTimeoutSecs * 1000, config.LockMaxTrials);
