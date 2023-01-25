import debounce from 'lodash.debounce';
import { timelock } from './common/security/timeLock/timeLock';

const touchTimelock = debounce(async () => {
	timelock.touch(() => {
		console.log('Locked....');
	});
}, 500);
function bootstrap() {
	console.debug('Bootstrapping p0wa Wallet...');
	window.addEventListener('mousemove', touchTimelock);
}

bootstrap();

export {};
