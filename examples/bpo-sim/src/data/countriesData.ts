// new: examples/bpo-sim/src/data/countriesData.ts
import raw from './countries.yaml?raw';
import { loadCountries } from './countries';

/** The countries the player can choose from, read once from countries.yaml. */
export const COUNTRIES = loadCountries(raw);
