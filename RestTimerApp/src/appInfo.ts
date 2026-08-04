/**
 * Identity, read straight from package.json so the About section can't drift
 * from the version that was actually shipped.
 */
import { version } from '../package.json';

export const APP_NAME = 'Liftlock';
export const APP_VERSION: string = version;
