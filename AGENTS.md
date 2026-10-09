# Alvorada desktop delivery

The user requires desktop clients to receive updates without reinstalling manually.

- Every production publication that changes the application UI, desktop runtime, or client API contract must include a new desktop release. Documentation-only changes do not need an installer.
- Keep `com.firmaconecta.alvorada`, the NSIS GUID, and `%APPDATA%\FirmaConecta\Alvorada` stable. Never delete pending operations, reset client databases, or change receipt identifiers during an update.
- Maintain compatibility with protocol 1 of `/api/offline/operations`, or implement an explicit compatible migration that preserves unsynchronized operations.
- Desktop updates download in the background and install when the user closes the application, after a successful local backup. Do not interrupt checkout to force an update.
- Publish the web/API build before the matching desktop release so its bundled interface matches the live server.
- Production pushes to `main` use `.github/workflows/desktop-release.yml`. For an approved production publication from another branch, run `node deploy/tag-desktop-release.cjs`, commit the resulting desktop package and lockfile version, then publish the immutable `desktop-vVERSION` tag.
- The VPS task `Alvorada-Desktop-Releases` builds and publishes release tags. Follow `docs/desktop.md`; confirm the task result and public `desktop-updates/latest.json` and `latest.yml` match the intended release before claiming delivery.
- Never include database credentials, `.env` files, signing secrets, local databases, or customer data in installers. Keep the standard updater integrity and signature checks.
- Document material limitations. A successful build and publication do not establish that installation, offline operation, and an installed-client upgrade were exercised.
