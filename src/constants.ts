import pkg from '../package.json';

/** Single source of truth for app version — read from package.json. */
export const APP_VERSION: string = pkg.version;
