# Tornado App Launcher

Tornado App Launcher is a web application project for launching and managing a small set of apps and games through a focused launcher-style interface.

## Current status

Repository established and ready for the Tornado App Launcher source code. The application UI and functionality will be transferred or rebuilt in a later step; this repository setup does not attempt to reconstruct the existing prototype.

## Intended technology

- React
- Vite
- Node.js tooling

## Deployment plan

The intended deployment architecture is GitHub + Firebase Hosting with separate TEST and PRODUCTION Firebase projects.

### TEST

Planned Firebase project: `tornado-app-launcher-test`

Future flow:

`feature branch → Pull Request → CI → main → Firebase TEST`

TEST is intended to deploy automatically from `main` once Firebase and GitHub Actions are configured in a later step.

### PRODUCTION

Planned Firebase project: `tornado-app-launcher`

Future flow:

`main → manually triggered GitHub Actions production deployment → Firebase PRODUCTION`

Production deployment must remain manual only and must never run automatically merely because `main` changes.

## Security

Do not commit passwords, Firebase service-account files, API secrets, private keys, credentials, or local environment files containing secrets to this repository.
