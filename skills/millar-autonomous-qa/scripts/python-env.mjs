import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function getVenvDir() {
  if (process.env.AUTONOMOUS_QA_VENV) {
    return path.resolve(process.env.AUTONOMOUS_QA_VENV);
  }
  if (process.env.UV_PROJECT_ENVIRONMENT) {
    return path.resolve(process.env.UV_PROJECT_ENVIRONMENT);
  }
  const baseDir =
    process.env.LOCALAPPDATA ||
    process.env.XDG_DATA_HOME ||
    path.join(os.homedir(), ".local", "share");
  return path.join(baseDir, "millar-autonomous-qa", "venv");
}

export function getScriptsDir() {
  const venvDir = getVenvDir();
  return path.join(venvDir, process.platform === "win32" ? "Scripts" : "bin");
}

export function getPythonBin() {
  const exe = process.platform === "win32" ? "python.exe" : "python";
  return path.join(getScriptsDir(), exe);
}

export function getToolBin(name) {
  const binName =
    process.platform === "win32" && !name.toLowerCase().endsWith(".exe")
      ? `${name}.exe`
      : name;
  return path.join(getScriptsDir(), binName);
}

export function getEnvSummary() {
  const venvDir = getVenvDir();
  const scriptsDir = getScriptsDir();
  const pythonBin = getPythonBin();
  return {
    venvDir,
    scriptsDir,
    pythonBin,
    exists: fs.existsSync(pythonBin),
    tools: {
      schemathesis: getToolBin("schemathesis"),
      pytest: getToolBin("pytest"),
    },
  };
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  console.log(JSON.stringify(getEnvSummary(), null, 2));
}