# Pull-request fix policy

If CI reveals that the npm lockfile does not include the new Capacitor packages, update the lockfile correctly on this branch. Do not replace `npm ci` with `npm install`; reproducibility is an acceptance requirement.
