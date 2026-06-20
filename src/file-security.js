import { constants } from 'node:fs';
import { access, chmod, stat } from 'node:fs/promises';

export const PRIVATE_FILE_MODE = 0o600;

export function describeFileMode(mode) {
  const normalizedMode = Number(mode) & 0o777;
  return {
    mode: normalizedMode,
    modeOctal: normalizedMode.toString(8).padStart(3, '0'),
    groupReadable: Boolean(normalizedMode & 0o040),
    otherReadable: Boolean(normalizedMode & 0o004),
    groupOrOtherReadable: Boolean(normalizedMode & 0o044)
  };
}

export async function enforcePrivateFileMode(filePath, label = 'Datei') {
  if (!filePath) return false;
  try {
    await chmod(filePath, PRIVATE_FILE_MODE);
    return true;
  } catch (error) {
    console.warn(`${label}: Dateirechte konnten nicht auf 0600 gesetzt werden: ${error.message}`);
    return false;
  }
}

export async function inspectFilePermissions(filePath) {
  const info = {
    exists: false,
    readable: false,
    mode: null,
    modeOctal: null,
    groupReadable: false,
    otherReadable: false,
    groupOrOtherReadable: false,
    error: null,
    readError: null
  };

  if (!filePath) {
    info.error = 'Kein Dateipfad konfiguriert.';
    return info;
  }

  try {
    const fileStat = await stat(filePath);
    Object.assign(info, { exists: true }, describeFileMode(fileStat.mode));
  } catch (error) {
    info.error = error.message;
    return info;
  }

  try {
    await access(filePath, constants.R_OK);
    info.readable = true;
  } catch (error) {
    info.readError = error.message;
  }

  return info;
}
