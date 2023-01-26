import { Buffer } from 'buffer/';
// @ts-ignore
window.Buffer = Buffer;

function bootstrap() {
	console.debug('Bootstrapping p0wa Wallet...');
}

bootstrap();

export {};
