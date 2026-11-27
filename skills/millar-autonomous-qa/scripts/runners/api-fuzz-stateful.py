#!/usr/bin/env python3
"""Autonomous QA Runner: Schemathesis + Hypothesis Stateful, Property, Negative & RBAC/IDOR Fuzzer."""

from __future__ import annotations

import argparse
import json
import os
import py_compile
import re
import secrets
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlencode, urljoin, urlparse

STAGING_ROOT = Path(__file__).resolve().parents[2]
TEST_RESULTS_DIR = STAGING_ROOT / "test-results"
TEST_RESULTS_DIR.mkdir(parents=True, exist_ok=True)

# Isolate Hypothesis & pytest caches BEFORE importing hypothesis / schemathesis
os.environ.setdefault("HYPOTHESIS_STORAGE_DIRECTORY", str(TEST_RESULTS_DIR / ".hypothesis"))
os.environ.setdefault("PYTEST_CACHE_DIR", str(TEST_RESULTS_DIR / ".pytest_cache"))
Path(os.environ["HYPOTHESIS_STORAGE_DIRECTORY"]).mkdir(parents=True, exist_ok=True)
Path(os.environ["PYTEST_CACHE_DIR"]).mkdir(parents=True, exist_ok=True)

import httpx  # noqa: E402
import schemathesis  # noqa: E402
from hypothesis import HealthCheck, Phase, given, settings, strategies as st  # noqa: E402
from hypothesis.stateful import Bundle, RuleBasedStateMachine, rule, run_state_machine_as_test  # noqa: E402
from schemathesis.core import NOT_SET  # noqa: E402
from schemathesis.core.failures import FailureGroup  # noqa: E402
from schemathesis.generation import GenerationMode  # noqa: E402

EM_DASH = "\u2014"

PROD_HOST_PATTERNS = [
    re.compile(r"(^|\.)hahlex\.com$", re.I),
    re.compile(r"(^|\.)(prod|production)(\.|$)", re.I),
    re.compile(r"[-.](prod|production)([-.]|$)", re.I),
]


def strip_em_dash(text: str) -> str:
    return str(text or "").replace(EM_DASH, " -- ")


SENSITIVE_KEY_NAMES = {
    "password",
    "passwd",
    "secret",
    "token",
    "access_token",
    "accesstoken",
    "refresh_token",
    "refreshtoken",
    "auth_token",
    "authtoken",
    "id_token",
    "idtoken",
    "api_key",
    "apikey",
    "client_secret",
    "clientsecret",
    "authorization",
    "cookie",
    "set-cookie",
    "x-api-key",
    "x-auth-token",
}


def redact_secrets(text: str) -> str:
    out = str(text or "")
    out = re.sub(r"Bearer\s+[A-Za-z0-9._~+/=-]+", "Bearer [REDACTED]", out, flags=re.I)
    out = re.sub(r"\beyJ[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{6,}", "[REDACTED_JWT]", out)
    out = re.sub(
        r"\b(https?|postgres(?:ql)?|redis|rediss|mysql|mongodb|amqp)://([^:@/\s]*):([^@/\s]+)@",
        r"\1://\2:[REDACTED]@",
        out,
        flags=re.I,
    )
    out = re.sub(
        r"\b(x-api-key|x-auth-token|cookie|set-cookie|authorization)\s*:\s*([\"'])([^\"'\r\n]+)\2(?!\s*\+)",
        r"\1: \2[REDACTED]\2",
        out,
        flags=re.I,
    )
    out = re.sub(
        r"\b(x-api-key|x-auth-token|cookie|set-cookie|authorization)\s*:\s*([^\s\"'][^\r\n\"']*)",
        r"\1: [REDACTED]",
        out,
        flags=re.I,
    )
    out = re.sub(
        r"([\"'](?:password|passwd|secret|api_?key|client_?secret|access_?token|refresh_?token|auth_?token|id_?token|token|cookie|set-cookie|authorization|x-api-key|x-auth-token)[\"']\s*:\s*)([\"'])([^\"'\r\n]+)\2(?!\s*\+)",
        r"\1\2[REDACTED]\2",
        out,
        flags=re.I,
    )
    out = re.sub(
        r"(\\\"(?:password|passwd|secret|api_?key|client_?secret|access_?token|refresh_?token|auth_?token|id_?token|token|cookie|set-cookie|authorization|x-api-key|x-auth-token)\\\"\s*:\s*\\\")([^\"\\]+)(\\\")",
        r"\1[REDACTED]\3",
        out,
        flags=re.I,
    )
    out = re.sub(
        r"([?&]|\b)(password|passwd|secret|api_?key|client_?secret|access_?token|refresh_?token|auth_?token|id_?token|token|x-api-key|x-auth-token|cookie|set-cookie|authorization)=([^\s\"',;&`]+)",
        r"\1\2=[REDACTED]",
        out,
        flags=re.I,
    )
    return out


def redact_dict_values(obj: Any) -> Any:
    if isinstance(obj, str):
        return redact_secrets(obj)
    if isinstance(obj, list):
        return [redact_dict_values(v) for v in obj]
    if isinstance(obj, dict):
        cleaned: dict[str, Any] = {}
        for k, v in obj.items():
            kl = str(k).lower()
            is_sensitive = kl in SENSITIVE_KEY_NAMES or (
                kl not in ("token_env", "tokenenv")
                and (
                    kl.endswith("_secret")
                    or kl.endswith("secret")
                    or kl.endswith("_password")
                    or kl.endswith("password")
                    or kl.endswith("_token")
                    or kl.endswith("token")
                    or kl.endswith("_api_key")
                    or kl.endswith("apikey")
                )
            )
            if is_sensitive and v is not None:
                cleaned[k] = "[REDACTED]"
            else:
                cleaned[k] = redact_dict_values(v)
        return cleaned
    return obj


def sanitize_text(text: str) -> str:
    return strip_em_dash(redact_secrets(text))


def sanitize_for_output(value: Any) -> Any:
    if isinstance(value, str):
        return sanitize_text(value)
    if isinstance(value, list):
        return [sanitize_for_output(v) for v in value]
    if isinstance(value, dict):
        return {k: sanitize_for_output(v) for k, v in value.items()}
    return value


def write_text_atomic(file_path: Path, content: str) -> None:
    file_path.parent.mkdir(parents=True, exist_ok=True)
    sanitized = strip_em_dash(redact_secrets(content))
    tmp_path = file_path.with_name(f"{file_path.name}.tmp.{os.getpid()}.{int(time.time() * 1000)}")
    tmp_path.write_text(sanitized, encoding="utf-8")
    tmp_path.replace(file_path)


def write_json_atomic(file_path: Path, data: Any) -> None:
    sanitized = sanitize_for_output(data)
    write_text_atomic(file_path, json.dumps(sanitized, indent=2, ensure_ascii=False) + "\n")


def to_staging_rel_path(path_obj: Path) -> str:
    try:
        rel = os.path.relpath(path_obj.resolve(), STAGING_ROOT.resolve())
        return rel.replace("\\", "/")
    except ValueError:
        return str(path_obj).replace("\\", "/")


def slugify(text: str, max_len: int = 36) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", str(text or "item").lower()).strip("-")
    return (s[:max_len] or "item")


def is_private_ipv4(host: str) -> bool:
    m = re.match(r"^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$", host)
    if not m:
        return False
    octets = [int(x) for x in m.groups()]
    if any(o < 0 or o > 255 for o in octets):
        return False
    a, b = octets[0], octets[1]
    return a == 10 or (a == 172 and 16 <= b <= 31) or (a == 192 and b == 168)


def is_loopback(host: str) -> bool:
    h = host.lower().strip("[]")
    if h == "localhost" or h.endswith(".localhost") or h == "::1":
        return True
    return bool(re.match(r"^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$", h))


def check_url_safety(label: str, raw_url: str, allow_private_ip: bool) -> str | None:
    try:
        parsed = urlparse(raw_url)
    except Exception:
        return f"{label} is not a valid URL"
    if parsed.scheme not in ("http", "https"):
        return f"{label} must use http or https protocol"
    host = (parsed.hostname or "").lower()
    if not host:
        return f"{label} missing hostname"
    for pat in PROD_HOST_PATTERNS:
        if pat.search(host):
            return f'{label} hostname "{host}" matches blocked production pattern'
    if is_loopback(host):
        return None
    if allow_private_ip and is_private_ipv4(host):
        return None
    return f'{label} hostname "{host}" is not a local loopback non-production host'


def resolve_config_with_path(config_path: str | None) -> tuple[dict[str, Any], Path | None]:
    if not config_path:
        return {}, None
    for cand in [Path.cwd() / config_path, STAGING_ROOT / config_path]:
        if cand.exists():
            resolved = cand.resolve()
            data = json.loads(resolved.read_text(encoding="utf-8"))
            return (data if isinstance(data, dict) else {}), resolved
    raise FileNotFoundError(f"Config file not found: {config_path}")


def load_config(config_path: str | None) -> dict[str, Any]:
    data, _ = resolve_config_with_path(config_path)
    return data


def resolve_path_candidates(raw_path: str, search_dirs: list[Path | None]) -> str:
    trimmed = str(raw_path or "").strip()
    if not trimmed:
        return trimmed
    p = Path(trimmed)
    if p.is_absolute():
        return str(p)
    for d in search_dirs:
        if d is None:
            continue
        cand = (d / p).resolve()
        if cand.exists():
            return str(cand)
    primary = next((d for d in search_dirs if d is not None), Path.cwd())
    return str((primary / p).resolve())


def read_string_literal(txt: str, start_idx: int) -> tuple[str, int]:
    quote = txt[start_idx]
    chars: list[str] = []
    i = start_idx + 1
    n = len(txt)
    while i < n:
        ch = txt[i]
        if ch == "\\":
            if i + 1 < n:
                chars.append(txt[i + 1])
                i += 2
                continue
            i += 1
            continue
        if ch == quote:
            return ("".join(chars), i)
        chars.append(ch)
        i += 1
    return ("".join(chars), n - 1)


def extract_balanced_bracket_block(txt: str, open_idx: int) -> str:
    depth = 0
    quote: str | None = None
    escaped = False
    in_line_comment = False
    in_block_comment = False
    n = len(txt)
    i = open_idx
    while i < n:
        ch = txt[i]
        nxt = txt[i + 1] if i + 1 < n else ""
        if in_line_comment:
            if ch == "\n":
                in_line_comment = False
            i += 1
            continue
        if in_block_comment:
            if ch == "*" and nxt == "/":
                in_block_comment = False
                i += 2
                continue
            i += 1
            continue
        if escaped:
            escaped = False
            i += 1
            continue
        if quote:
            if ch == "\\":
                escaped = True
            elif ch == quote:
                quote = None
            i += 1
            continue
        if ch == "/" and nxt == "/":
            in_line_comment = True
            i += 2
            continue
        if ch == "/" and nxt == "*":
            in_block_comment = True
            i += 2
            continue
        if ch in ("'", '"', "`"):
            quote = ch
        elif ch == "[":
            depth += 1
        elif ch == "]":
            depth -= 1
            if depth == 0:
                return txt[open_idx + 1 : i]
        i += 1
    return ""


def extract_string_literals_from_code(txt: str) -> list[str]:
    results: list[str] = []
    in_line_comment = False
    in_block_comment = False
    n = len(txt)
    i = 0
    while i < n:
        ch = txt[i]
        nxt = txt[i + 1] if i + 1 < n else ""
        if in_line_comment:
            if ch == "\n":
                in_line_comment = False
            i += 1
            continue
        if in_block_comment:
            if ch == "*" and nxt == "/":
                in_block_comment = False
                i += 2
                continue
            i += 1
            continue
        if ch == "/" and nxt == "/":
            in_line_comment = True
            i += 2
            continue
        if ch == "/" and nxt == "*":
            in_block_comment = True
            i += 2
            continue
        if ch in ("'", '"', "`"):
            val, end_idx = read_string_literal(txt, i)
            if val:
                results.append(val)
            i = end_idx + 1
            continue
        i += 1
    return results


def extract_route_scopes_from_block(block: str) -> list[str]:
    scopes: list[str] = []
    brace_depth = 0
    bracket_depth = 0
    in_line_comment = False
    in_block_comment = False
    n = len(block)
    i = 0
    while i < n:
        ch = block[i]
        nxt = block[i + 1] if i + 1 < n else ""
        if in_line_comment:
            if ch == "\n":
                in_line_comment = False
            i += 1
            continue
        if in_block_comment:
            if ch == "*" and nxt == "/":
                in_block_comment = False
                i += 2
                continue
            i += 1
            continue
        if ch == "/" and nxt == "/":
            in_line_comment = True
            i += 2
            continue
        if ch == "/" and nxt == "*":
            in_block_comment = True
            i += 2
            continue
        if ch in ("'", '"', "`"):
            val, end_idx = read_string_literal(block, i)
            if brace_depth == 0 and bracket_depth == 0 and val and val not in ("all", "any"):
                scopes.append(val)
            i = end_idx + 1
            continue
        if ch == "{":
            brace_depth += 1
            i += 1
            continue
        if ch == "}":
            brace_depth = max(0, brace_depth - 1)
            i += 1
            continue
        if ch == "[":
            bracket_depth += 1
            i += 1
            continue
        if ch == "]":
            bracket_depth = max(0, bracket_depth - 1)
            i += 1
            continue

        prev = block[i - 1] if i > 0 else ""
        if not re.match(r"[A-Za-z0-9_$]", prev) and block.startswith("scopes", i):
            m = re.match(r"scopes\s*:\s*\[", block[i:])
            if m:
                inner_open_idx = i + m.end() - 1
                inner_block = extract_balanced_bracket_block(block, inner_open_idx)
                scopes.extend(extract_string_literals_from_code(inner_block))
                i = inner_open_idx + len(inner_block) + 2
                continue
        i += 1
    return scopes


def find_brace_spans(txt: str) -> list[tuple[int, int]]:
    spans: list[tuple[int, int]] = []
    stack: list[int] = []
    quote: str | None = None
    escaped = False
    in_line_comment = False
    in_block_comment = False
    n = len(txt)
    i = 0
    while i < n:
        ch = txt[i]
        nxt = txt[i + 1] if i + 1 < n else ""
        if in_line_comment:
            if ch == "\n":
                in_line_comment = False
            i += 1
            continue
        if in_block_comment:
            if ch == "*" and nxt == "/":
                in_block_comment = False
                i += 2
                continue
            i += 1
            continue
        if escaped:
            escaped = False
            i += 1
            continue
        if quote:
            if ch == "\\":
                escaped = True
            elif ch == quote:
                quote = None
            i += 1
            continue
        if ch == "/" and nxt == "/":
            in_line_comment = True
            i += 2
            continue
        if ch == "/" and nxt == "*":
            in_block_comment = True
            i += 2
            continue
        if ch in ("'", '"', "`"):
            quote = ch
        elif ch == "{":
            stack.append(i)
        elif ch == "}":
            if stack:
                open_idx = stack.pop()
                spans.append((open_idx, i))
        i += 1
    return spans


def parse_route_catalog_entries(file_path: Path) -> list[dict[str, Any]]:
    if not file_path.exists():
        return []
    txt = file_path.read_text(encoding="utf-8", errors="ignore")
    brace_spans = find_brace_spans(txt)
    entries: list[dict[str, Any]] = []
    seen: set[tuple[str, str]] = set()
    pat = re.compile(r"method\s*:\s*['\"`]([A-Za-z]+)['\"`][\s\S]{0,400}?path\s*:\s*['\"`]([^'\"`]+)['\"`]")
    for m in pat.finditer(txt):
        method = m.group(1).upper()
        route_path = m.group(2)
        key = (method, route_path)
        if key in seen:
            continue
        seen.add(key)
        enclosing = None
        for open_idx, close_idx in brace_spans:
            if open_idx < m.start() and m.end() <= close_idx:
                if enclosing is None or (close_idx - open_idx) < (enclosing[1] - enclosing[0]):
                    enclosing = (open_idx, close_idx)
        if enclosing is not None:
            snippet = txt[enclosing[0] : enclosing[1] + 1]
        else:
            block_end = txt.find("\n  },", m.end())
            if block_end == -1:
                block_end = min(len(txt), m.end() + 1200)
            snippet = txt[m.start():block_end]
        scopes: list[str] = []
        gates: list[str] = []
        sm = re.search(r"route_scopes\s*:\s*\[", snippet)
        if sm:
            block = extract_balanced_bracket_block(snippet, sm.end() - 1)
            scopes = extract_route_scopes_from_block(block)
        gm = re.search(r"gates\s*:\s*\[", snippet)
        if gm:
            gblock = extract_balanced_bracket_block(snippet, gm.end() - 1)
            gates = extract_string_literals_from_code(gblock)
        entries.append({"method": method, "path": route_path, "scopes": list(dict.fromkeys(scopes)), "gates": gates})
    return entries


def resolve_role_token(rc: dict[str, Any]) -> str | None:
    tok = rc.get("token")
    if tok:
        return str(tok)
    env_name = rc.get("tokenEnv")
    if env_name:
        val = os.environ.get(str(env_name))
        if val:
            return str(val)
    return None


def resolve_role_headers(rc: dict[str, Any]) -> tuple[dict[str, str], str | None, list[str]]:
    raw_hdrs = rc.get("headers") if isinstance(rc.get("headers"), dict) else {}
    hdrs: dict[str, str] = {
        str(k): str(v) for k, v in raw_hdrs.items() if str(k).strip() and v is not None
    }
    hdr_keys: list[str] = list(hdrs.keys())
    hdr_env_raw = str(rc.get("headersEnv") or "").strip()
    if hdr_env_raw and os.environ.get(hdr_env_raw):
        raw_env_val = str(os.environ.get(hdr_env_raw) or "").strip()
        if raw_env_val:
            try:
                parsed = json.loads(raw_env_val)
                if isinstance(parsed, dict):
                    for hk, hv in parsed.items():
                        hk_s = str(hk).strip()
                        if hk_s and hv is not None:
                            hdrs.setdefault(hk_s, str(hv))
                            if hk_s not in hdr_keys:
                                hdr_keys.append(hk_s)
            except Exception:
                if ":" in raw_env_val:
                    hk, hv = raw_env_val.split(":", 1)
                    hk_s = hk.strip()
                    if hk_s:
                        hdrs.setdefault(hk_s, hv.strip())
                        if hk_s not in hdr_keys:
                            hdr_keys.append(hk_s)
    has_role_headers = bool(hdr_keys) or bool(hdr_env_raw)
    headers_env_name = hdr_env_raw if hdr_env_raw else ("QA_HEADERS" if has_role_headers else None)
    return hdrs, headers_env_name, hdr_keys


def discover_static_routes(
    cfg: dict[str, Any],
    repo_paths: list[str],
    config_dir: Path | None = None,
    extra_catalog_path: str | None = None,
) -> list[dict[str, Any]]:
    entries: list[dict[str, Any]] = []
    seen: set[tuple[str, str]] = set()

    def add_items(items: list[dict[str, Any]]) -> None:
        for item in items:
            key = (item["method"], item["path"])
            if key not in seen:
                seen.add(key)
                entries.append(item)

    if extra_catalog_path:
        cat_resolved = resolve_path_candidates(extra_catalog_path, [Path.cwd(), config_dir, STAGING_ROOT])
        add_items(parse_route_catalog_entries(Path(cat_resolved)))
    if cfg.get("routeCatalogPath"):
        cat_resolved = resolve_path_candidates(str(cfg["routeCatalogPath"]), [config_dir, Path.cwd(), STAGING_ROOT])
        add_items(parse_route_catalog_entries(Path(cat_resolved)))
    for rp in repo_paths:
        cat = Path(rp) / "apps" / "api" / "src" / "modules" / "ai-mcp" / "route-catalog.generated.ts"
        add_items(parse_route_catalog_entries(cat))
    return entries


def build_py_repro_script(
    finding: dict[str, Any],
    api_origin: str,
    method: str,
    rel_path: str,
    check_kind: str,
    headers: dict[str, str] | None = None,
    json_body: dict[str, Any] | None = None,
    token_env: str | None = None,
    headers_env: str | None = None,
    required_header_keys: list[str] | None = None,
) -> str:
    safe_id = re.sub(r"[\r\n]+", " ", sanitize_text(finding.get("id", "QA-FUZZ-001"))).strip()
    safe_title = re.sub(r"[\r\n]+", " ", sanitize_text(finding.get("title", "API Defect"))).strip()
    clean_rel_path = sanitize_text(rel_path)
    clean_origin = sanitize_text(api_origin)
    req_hdr_keys = [sanitize_text(str(k)).strip() for k in (required_header_keys or []) if str(k).strip()]
    req_hdr_lower = {k.lower() for k in req_hdr_keys}
    has_auth_hdr = any(str(k).lower() == "authorization" for k in (headers or {}))
    headers_required = bool(headers_env) or bool(req_hdr_keys)
    token_auth_required = bool(token_env) or (has_auth_hdr and "authorization" not in req_hdr_lower)
    default_token_env = str(token_env or ("QA_TOKEN" if token_auth_required else ""))
    default_headers_env = str(headers_env or ("QA_HEADERS" if headers_required else ""))

    sanitized_headers: dict[str, str] = {}
    for k, v in (headers or {}).items():
        kl = str(k).lower()
        if kl == "authorization" or kl in req_hdr_lower:
            continue
        if kl in ("cookie", "set-cookie", "x-api-key", "x-auth-token"):
            sanitized_headers[k] = "[REDACTED]"
        else:
            sanitized_headers[k] = sanitize_text(str(v))

    sanitized_body = redact_dict_values(json_body) if json_body is not None else None
    hdr_json = json.dumps(sanitized_headers)
    body_json = json.dumps(sanitized_body)
    req_hdr_json = json.dumps(req_hdr_keys)
    return f'''#!/usr/bin/env python3
# Reproducer for {safe_id}: {safe_title}
import argparse
import json
import os
import sys
from urllib.parse import urljoin
import httpx

parser = argparse.ArgumentParser()
parser.add_argument("--api-url", default={json.dumps(clean_origin)})
parser.add_argument("--target-url", default={json.dumps(clean_origin)})
parser.add_argument("--token-env", default={json.dumps(default_token_env)})
parser.add_argument("--headers-env", default={json.dumps(default_headers_env)})
args, _ = parser.parse_known_args()

safe_id = {json.dumps(safe_id)}
base = args.api_url or args.target_url
url = urljoin(base.rstrip("/") + "/", {json.dumps(clean_rel_path.lstrip("/"))})
check_kind = {json.dumps(check_kind)}
auth_required = {repr(bool(token_auth_required))}
headers_required = {repr(bool(headers_required))}
default_token_env = {json.dumps(default_token_env)}
required_header_keys = json.loads({json.dumps(req_hdr_json)})
headers = json.loads({json.dumps(hdr_json)})
json_body = json.loads({json.dumps(body_json)})

token_env_name = str(args.token_env or "").strip()
runtime_token = os.environ.get(token_env_name, "").strip() if token_env_name else ""
headers_env_name = str(args.headers_env or "").strip()
raw_headers_env = os.environ.get(headers_env_name, "").strip() if headers_env_name else ""

extra_headers = {{}}
if raw_headers_env:
    try:
        parsed_hdrs = json.loads(raw_headers_env)
        if isinstance(parsed_hdrs, dict):
            for hk, hv in parsed_hdrs.items():
                if hv is not None:
                    extra_headers[str(hk)] = str(hv)
        else:
            print(f"AUTH_ENV_REQUIRED {{safe_id}} headersEnv={{headers_env_name or 'QA_HEADERS'}}", file=sys.stderr)
            sys.exit(2)
    except Exception:
        if ":" in raw_headers_env:
            hk, hv = raw_headers_env.split(":", 1)
            if hk.strip():
                extra_headers[hk.strip()] = hv.strip()
            else:
                print(f"AUTH_ENV_REQUIRED {{safe_id}} headersEnv={{headers_env_name or 'QA_HEADERS'}}", file=sys.stderr)
                sys.exit(2)
        elif len(required_header_keys) == 1:
            extra_headers[required_header_keys[0]] = raw_headers_env
        else:
            print(f"AUTH_ENV_REQUIRED {{safe_id}} headersEnv={{headers_env_name or 'QA_HEADERS'}}", file=sys.stderr)
            sys.exit(2)

has_supplied_headers = len(extra_headers) > 0
if (
    runtime_token
    and not extra_headers
    and headers_required
    and not default_token_env
    and len(required_header_keys) == 1
    and required_header_keys[0].lower() != "authorization"
):
    extra_headers[required_header_keys[0]] = runtime_token
    has_supplied_headers = True

if headers_required:
    if not has_supplied_headers:
        print(f"AUTH_ENV_REQUIRED {{safe_id}} headersEnv={{headers_env_name or 'QA_HEADERS'}}", file=sys.stderr)
        sys.exit(2)
    headers.update(extra_headers)
elif extra_headers:
    headers.update(extra_headers)

if auth_required:
    if not runtime_token:
        print(f"AUTH_ENV_REQUIRED {{safe_id}} tokenEnv={{token_env_name or 'QA_TOKEN'}}", file=sys.stderr)
        sys.exit(2)
    if not any(str(k).lower() == "authorization" for k in headers):
        headers["Authorization"] = runtime_token if runtime_token.startswith("Bearer ") else f"Bearer {{runtime_token}}"

try:
    with httpx.Client(timeout=4.0) as client:
        req_kwargs = {{"headers": headers}}
        if json_body is not None:
            req_kwargs["json"] = json_body
        resp = client.request({json.dumps(method)}, url, **req_kwargs)
    reproduced = False
    if check_kind == "unauth_protected_200":
        reproduced = resp.status_code >= 500 or (resp.status_code == 200 and len(resp.text.strip()) > 0)
    elif check_kind == "invalid_json_body":
        try:
            resp.json()
            reproduced = resp.status_code >= 500
        except Exception:
            reproduced = True
    elif check_kind == "crud_read_after_write":
        reproduced = resp.status_code != 200
    else:
        reproduced = resp.status_code >= 500

    if reproduced:
        print(f"STILL_REPRODUCES {{safe_id}} mode={{check_kind}} status={{resp.status_code}} url={{url}}", file=sys.stderr)
        sys.exit(1)
    print(f"RESOLVED {{safe_id}} mode={{check_kind}} status={{resp.status_code}} url={{url}}")
    sys.exit(0)
except Exception as exc:
    print(f"STILL_REPRODUCES {{safe_id}} error={{exc}}", file=sys.stderr)
    sys.exit(1)
'''


def main() -> int:
    started_dt = datetime.now(timezone.utc)
    started_at = started_dt.isoformat()
    started_ms = time.monotonic()

    parser = argparse.ArgumentParser(description="Autonomous QA Schemathesis + Hypothesis API runner")
    parser.add_argument("--config")
    parser.add_argument("--target-url")
    parser.add_argument("--api-url")
    parser.add_argument("--ai-url")
    parser.add_argument("--mailpit-url")
    parser.add_argument("--langfuse-url")
    parser.add_argument("--openapi-url")
    parser.add_argument("--synthesized-openapi")
    parser.add_argument("--oidc-url")
    parser.add_argument("--route-catalog")
    parser.add_argument("--repo-path", action="append", default=[])
    parser.add_argument("--memory-dir")
    parser.add_argument("--trace-dir")
    parser.add_argument("--out")
    parser.add_argument("--max-requests", type=int, default=40)
    parser.add_argument("--max-examples", type=int, default=5)
    parser.add_argument("--max-ai-calls", type=int, default=0)
    parser.add_argument("--modes")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--allow-private-ip", action="store_true")
    args, _ = parser.parse_known_args()

    cfg, resolved_cfg_path = resolve_config_with_path(args.config)
    config_dir = resolved_cfg_path.parent if resolved_cfg_path else None
    api_url = args.api_url or cfg.get("apiUrl") or args.target_url or cfg.get("targetUrl")
    target_url = args.target_url or cfg.get("targetUrl")
    openapi_url = args.openapi_url or cfg.get("openapiUrl")
    ai_url = args.ai_url or cfg.get("aiUrl")
    mailpit_url = args.mailpit_url or cfg.get("mailpitUrl")
    langfuse_url = args.langfuse_url or cfg.get("langfuseUrl")
    oidc_url = args.oidc_url or cfg.get("oidcUrl")
    memory_dir = Path(args.memory_dir).resolve() if args.memory_dir else (STAGING_ROOT / "memory")
    trace_dir = Path(args.trace_dir).resolve() if args.trace_dir else (memory_dir / "traces")
    reg_dir = memory_dir / "regressions"
    cli_repo_paths = [
        resolve_path_candidates(rp, [Path.cwd(), config_dir, STAGING_ROOT])
        for rp in (args.repo_path or [])
        if str(rp or "").strip()
    ]
    cfg_repo_paths = [
        resolve_path_candidates(rp, [config_dir, Path.cwd(), STAGING_ROOT])
        for rp in (cfg.get("repoPaths") or [])
        if str(rp or "").strip()
    ]
    repo_paths = list(dict.fromkeys([*cli_repo_paths, *cfg_repo_paths]))

    max_requests = max(1, int(args.max_requests if args.max_requests is not None else 40))
    max_examples = max(1, min(20, int(args.max_examples if args.max_examples is not None else 5)))
    unique_tag = f"{started_dt.strftime('%Y-%m-%dT%H-%M-%S-%f')}-{os.getpid()}-{secrets.token_hex(3)}"

    def finish(
        *,
        status: str,
        tool: str = "schemathesis",
        mode: str = "stateful",
        requests_used: int = 0,
        endpoints: list[str] | None = None,
        roles: list[str] | None = None,
        assertions: int = 0,
        findings: list[dict[str, Any]] | None = None,
        traces: list[str] | None = None,
        reg_tests: list[str] | None = None,
        notes: str = "",
        exit_code: int = 0,
    ) -> int:
        output = sanitize_for_output(
            {
                "tool": tool,
                "mode": mode,
                "status": status,
                "startedAt": started_at,
                "durationMs": max(0, int((time.monotonic() - started_ms) * 1000)),
                "budgetConsumed": {
                    "requests": max(0, int(requests_used)),
                    "aiCalls": 0,
                },
                "coverage": {
                    "routes": [],
                    "endpoints": list(dict.fromkeys(endpoints or [])),
                    "roles": list(dict.fromkeys(roles or [])),
                    "assertions": max(0, int(assertions)),
                },
                "findings": findings or [],
                "artifacts": {
                    "traces": list(dict.fromkeys(traces or [])),
                    "screenshots": [],
                    "regressionTests": list(dict.fromkeys(reg_tests or [])),
                },
                "notes": notes,
            }
        )
        if args.out:
            write_json_atomic(Path(args.out).resolve(), output)
        print(json.dumps(output, indent=2, ensure_ascii=False))
        return exit_code

    allow_priv = bool(args.allow_private_ip or cfg.get("allowPrivateIp"))
    url_checks = [
        ("apiUrl", api_url, "--api-url"),
        ("targetUrl", target_url, "--target-url"),
        ("openapiUrl", openapi_url, "--openapi-url"),
        ("aiUrl", ai_url, "--ai-url"),
        ("mailpitUrl", mailpit_url, "--mailpit-url"),
        ("langfuseUrl", langfuse_url, "--langfuse-url"),
        ("oidcUrl", oidc_url, "--oidc-url"),
    ]
    for url_label, url_val, cli_flag in url_checks:
        if isinstance(url_val, str) and url_val.strip():
            raw_u = url_val.strip()
            safety_err = check_url_safety(url_label, raw_u, allow_priv)
            if safety_err:
                repro_cmd = (
                    f"node scripts/safety-guard.mjs --api-url {raw_u}"
                    if url_label == "apiUrl"
                    else (
                        f"node scripts/safety-guard.mjs --api-url {api_url} {cli_flag} {raw_u}"
                        if api_url
                        else f"node scripts/safety-guard.mjs {cli_flag} {raw_u}"
                    )
                )
                return finish(
                    status="failed",
                    findings=[
                        {
                            "id": "QA-FUZZ-SAFETY-002",
                            "classification": "runtime_degraded",
                            "severity": "critical",
                            "title": "Safety guard rejected API URL" if url_label == "apiUrl" else f"Safety guard rejected {url_label}",
                            "reproCommand": repro_cmd,
                            "evidencePaths": [],
                            "verifiedOutcome": safety_err,
                        }
                    ],
                    notes=safety_err,
                    exit_code=2,
                )

    if not api_url:
        return finish(
            status="skipped_non_applicable",
            notes="No --api-url or --target-url provided; skipping API fuzzing.",
        )

    for env_key in ("NODE_ENV", "APP_ENV", "ENVIRONMENT"):
        if re.match(r"^(prod|production)$", str(os.environ.get(env_key, "")).strip(), re.I):
            return finish(
                status="failed",
                findings=[
                    {
                        "id": "QA-FUZZ-SAFETY-001",
                        "classification": "runtime_degraded",
                        "severity": "critical",
                        "title": f"Environment {env_key} indicates production",
                        "reproCommand": f"python scripts/runners/api-fuzz-stateful.py --api-url {api_url}",
                        "evidencePaths": [],
                        "verifiedOutcome": f"Refused execution because {env_key} is production",
                    }
                ],
                notes="Safety guard blocked execution in production environment.",
                exit_code=2,
            )

    if args.dry_run:
        return finish(
            status="skipped_non_applicable",
            notes="Dry run enabled; skipped Schemathesis and Hypothesis execution.",
        )

    parsed_api = urlparse(api_url)
    api_origin = f"{parsed_api.scheme}://{parsed_api.netloc}"
    trace_dir.mkdir(parents=True, exist_ok=True)
    reg_dir.mkdir(parents=True, exist_ok=True)
    trace_path = trace_dir / f"api-fuzz-{unique_tag}.json"
    rel_trace = to_staging_rel_path(trace_path)

    requests_used = 0
    assertions = 0
    endpoints_covered: list[str] = []
    roles_covered: list[str] = []
    findings: list[dict[str, Any]] = []
    reg_tests: list[str] = []
    seen_fps: set[str] = set()
    trace_records: list[dict[str, Any]] = []
    tool_used = "schemathesis"
    soft_deadline = started_ms + 30.0

    def mark_role(role_label: str | None) -> None:
        val = str(role_label or "").strip()
        if val and val not in roles_covered:
            roles_covered.append(val)

    def add_finding(
        *,
        fid: str,
        fp: str,
        classification: str,
        severity: str,
        title: str,
        endpoint_or_route: str,
        check_mode: str,
        repro_cmd: str,
        verified_outcome: str,
        method: str = "GET",
        rel_path: str = "/",
        headers: dict[str, str] | None = None,
        json_body: dict[str, Any] | None = None,
        token_env: str | None = None,
        headers_env: str | None = None,
        required_header_keys: list[str] | None = None,
    ) -> None:
        if fp in seen_fps:
            return
        seen_fps.add(fp)
        clean_req_keys = [sanitize_text(str(k)).strip() for k in (required_header_keys or []) if str(k).strip()]
        finding: dict[str, Any] = {
            "id": fid,
            "fingerprint": fp,
            "classification": classification,
            "severity": severity,
            "title": title,
            "endpointOrRoute": endpoint_or_route,
            "checkMode": check_mode,
            "reproCommand": repro_cmd,
            "evidencePaths": [rel_trace],
            "verifiedOutcome": verified_outcome,
        }
        if token_env or headers_env or clean_req_keys:
            finding["authRequired"] = True
        if token_env:
            finding["tokenEnv"] = str(token_env)
        if headers_env:
            finding["headersEnv"] = str(headers_env)
        if clean_req_keys:
            finding["requiredHeaderKeys"] = clean_req_keys
        if classification == "confirmed_bug":
            reg_name = f"fuzz-{slugify(fid, 14)}-{unique_tag}.py"
            reg_abs = reg_dir / reg_name
            src = build_py_repro_script(
                finding,
                api_origin,
                method,
                rel_path,
                check_mode,
                headers,
                json_body,
                token_env=token_env,
                headers_env=headers_env,
                required_header_keys=clean_req_keys,
            )
            write_text_atomic(reg_abs, src)
            pyc_tmp = TEST_RESULTS_DIR / ".pytest_cache" / f"{reg_name}.pyc"
            pyc_tmp.parent.mkdir(parents=True, exist_ok=True)
            try:
                py_compile.compile(str(reg_abs), cfile=str(pyc_tmp), doraise=True)
                rel_reg = to_staging_rel_path(reg_abs)
                finding["reproScript"] = rel_reg
                reg_tests.append(rel_reg)
            except Exception as comp_exc:
                trace_records.append({"phase": "repro_compile", "file": str(reg_abs), "error": str(comp_exc)})
                reg_abs.unlink(missing_ok=True)
            finally:
                pyc_tmp.unlink(missing_ok=True)
        findings.append(finding)

    spec_dict: dict[str, Any] | None = None
    spec_status = 0
    api_reachable = False
    spec_candidates = [openapi_url] if openapi_url else [f"{api_origin}/openapi.json", f"{api_origin}/v1/openapi.json"]

    with httpx.Client(timeout=4.0) as client:
        for cand in spec_candidates:
            if not cand or requests_used >= max_requests:
                break
            try:
                requests_used += 1
                resp = client.get(cand)
                spec_status = resp.status_code
                api_reachable = True
            except httpx.RequestError as exc:
                trace_records.append({"phase": "openapi_fetch", "url": cand, "error": str(exc)})
                break
            if resp.status_code == 200:
                try:
                    data = resp.json()
                except (ValueError, UnicodeDecodeError) as exc:
                    trace_records.append({"phase": "openapi_fetch", "url": cand, "error": str(exc)})
                    continue
                if isinstance(data, dict) and isinstance(data.get("paths"), dict):
                    spec_dict = data
                    break
                trace_records.append(
                    {"phase": "openapi_fetch", "url": cand, "error": "Invalid or missing OpenAPI paths dict"}
                )

        static_routes = discover_static_routes(cfg, repo_paths, config_dir=config_dir, extra_catalog_path=args.route_catalog)
        spec_source = "live_openapi" if spec_dict is not None else "none"
        if spec_dict is None:
            synth_candidates: list[Path] = []
            if args.synthesized_openapi:
                synth_candidates.append(Path(args.synthesized_openapi).resolve())
            synth_candidates.append(memory_dir / "synthesized-openapi.json")
            for synth_path in synth_candidates:
                if synth_path.is_file():
                    try:
                        synth_data = json.loads(synth_path.read_text(encoding="utf-8"))
                        if isinstance(synth_data, dict) and isinstance(synth_data.get("paths"), dict) and synth_data["paths"]:
                            spec_dict = synth_data
                            spec_source = "synthesized_har_openapi"
                            trace_records.append(
                                {
                                    "phase": "openapi_synthesized_load",
                                    "file": str(synth_path),
                                    "pathCount": len(synth_data["paths"]),
                                }
                            )
                            break
                    except Exception as synth_exc:
                        trace_records.append({"phase": "openapi_synthesized_load", "file": str(synth_path), "error": str(synth_exc)})

        if spec_dict is None:
            if not api_reachable:
                add_finding(
                    fid="QA-FUZZ-DEGRADED-001",
                    fp="runtime_degraded|api_unreachable",
                    classification="runtime_degraded",
                    severity="medium",
                    title="API endpoint unreachable during stateful fuzzing",
                    endpoint_or_route="/",
                    check_mode="unreachable",
                    repro_cmd=f"curl -i {api_origin}/openapi.json",
                    verified_outcome=f"Unable to reach {api_origin} for OpenAPI or route checks",
                )
            elif not static_routes:
                add_finding(
                    fid="QA-FUZZ-SPEC-001",
                    fp="spec_gap|openapi_missing",
                    classification="spec_gap",
                    severity="medium",
                    title="OpenAPI specification unavailable for stateful fuzzing",
                    endpoint_or_route="/openapi.json",
                    check_mode="status_404_spec_gap",
                    repro_cmd=f"curl -i {spec_candidates[0]}",
                    verified_outcome=f"GET {spec_candidates[0]} returned HTTP {spec_status} and no static route catalog was found",
                )

        spec_paths = spec_dict.get("paths", {}) if spec_dict else {}
        known_paths = set(spec_paths.keys()) | {entry["path"] for entry in static_routes}

        # Phase 1: Multi-Role / Cross-Tenant RBAC & IDOR Check
        configured_roles = [r for r in (cfg.get("roles") or cfg.get("accounts") or []) if isinstance(r, dict)]
        has_mock_rbac = "/api/rbac/tenant/{id}" in known_paths
        if api_reachable and (has_mock_rbac or configured_roles) and requests_used < max_requests and time.monotonic() < soft_deadline:
            viewer_token = None
            viewer_token_env: str | None = None
            viewer_role_name = "viewer"
            for rc in configured_roles:
                tok = resolve_role_token(rc)
                if tok:
                    viewer_token = tok
                    viewer_token_env = str(rc.get("tokenEnv")) if rc.get("tokenEnv") else None
                    viewer_role_name = str(rc.get("role") or rc.get("name") or "configured_role")
                    break

            if not viewer_token and has_mock_rbac and requests_used + 1 <= max_requests:
                try:
                    requests_used += 1
                    login_resp = client.post(
                        f"{api_origin}/api/auth/login",
                        json={"role": "viewer", "tenantId": "tenantA", "email": "viewer@tenantA.local"},
                    )
                    endpoints_covered.append("POST /api/auth/login")
                    if login_resp.status_code == 200:
                        login_json = login_resp.json()
                        viewer_token = login_json.get("accessToken")
                        viewer_token_env = None
                        viewer_role_name = "viewer"
                        mark_role("viewer")
                except Exception as exc:
                    trace_records.append({"phase": "rbac_login", "error": str(exc)})

            if has_mock_rbac and requests_used < max_requests:
                probes: list[tuple[str, dict[str, str], list[str], str | None]] = []
                if viewer_token:
                    probes.append(
                        (
                            "viewer_cross_tenant",
                            {"Authorization": f"Bearer {viewer_token}"},
                            [viewer_role_name],
                            viewer_token_env,
                        )
                    )
                if requests_used + len(probes) < max_requests or not probes:
                    probes.append(("unauthenticated", {}, ["anonymous"], None))

                for probe_label, hdrs, probe_roles, probe_token_env in probes:
                    if requests_used >= max_requests:
                        break
                    try:
                        requests_used += 1
                        assertions += 1
                        idor_resp = client.get(f"{api_origin}/api/rbac/tenant/tenantB", headers=hdrs)
                        for rl in probe_roles:
                            mark_role(rl)
                        endpoints_covered.append("GET /api/rbac/tenant/{id}")
                        trace_records.append(
                            {
                                "phase": "rbac_idor",
                                "probe": probe_label,
                                "status": idor_resp.status_code,
                            }
                        )
                        if idor_resp.status_code == 200 and len(idor_resp.text.strip()) > 0:
                            add_finding(
                                fid=f"QA-FUZZ-{len(findings) + 1:03d}",
                                fp="confirmed_bug|idor:GET /api/rbac/tenant/tenantB",
                                classification="confirmed_bug",
                                severity="critical",
                                title="Cross-tenant or unauthenticated RBAC/IDOR access returned HTTP 200 on /api/rbac/tenant/tenantB",
                                endpoint_or_route="GET /api/rbac/tenant/tenantB",
                                check_mode="unauth_protected_200",
                                repro_cmd=f"curl -i {api_origin}/api/rbac/tenant/tenantB",
                                verified_outcome=(
                                    f"Expected 401/403 for {probe_label} access to tenantB resource, "
                                    f"got HTTP {idor_resp.status_code}"
                                ),
                                method="GET",
                                rel_path="/api/rbac/tenant/tenantB",
                                headers=hdrs,
                                token_env=probe_token_env,
                            )
                    except Exception as exc:
                        trace_records.append({"phase": "rbac_idor", "probe": probe_label, "error": str(exc)})

            # Also execute configured role GET probes when tokens exist and non-mock routes are present
            if configured_roles and requests_used < max_requests:
                safe_role_paths: list[str] = []
                for ep_path in spec_paths.keys():
                    if "{" not in ep_path and "/hang" not in ep_path and "/bug-500" not in ep_path and "/malformed" not in ep_path:
                        if isinstance(spec_paths[ep_path], dict) and "get" in spec_paths[ep_path]:
                            safe_role_paths.append(ep_path)
                for entry in static_routes:
                    if entry["method"] == "GET" and "{" not in entry["path"] and len(safe_role_paths) < 4:
                        if entry["path"] not in safe_role_paths:
                            safe_role_paths.append(entry["path"])
                if not safe_role_paths and "/healthz" in known_paths:
                    safe_role_paths.append("/healthz")

                if "/v1/session" not in safe_role_paths and any(resolve_role_token(rc) for rc in configured_roles):
                    safe_role_paths.insert(0, "/v1/session")

                resolved_roles: list[dict[str, Any]] = []
                for rc in configured_roles:
                    if requests_used >= max_requests or time.monotonic() >= soft_deadline:
                        break
                    tok = resolve_role_token(rc)
                    tok_env = str(rc.get("tokenEnv")) if rc.get("tokenEnv") else None
                    extra_hdrs, role_hdr_env, role_hdr_keys = resolve_role_headers(rc)
                    hdrs = dict(extra_hdrs)
                    if tok:
                        hdrs["Authorization"] = f"Bearer {tok}"
                    if not hdrs or not safe_role_paths:
                        continue
                    target_ep = safe_role_paths[0]
                    role_lbl = str(rc.get("role") or rc.get("name") or "configured_role")
                    tenant_lbl = str(rc.get("tenantId") or "")
                    resolved_roles.append(
                        {
                            "role": role_lbl,
                            "tenantId": tenant_lbl,
                            "token": tok,
                            "tokenEnv": tok_env,
                            "headers": hdrs,
                            "headersEnv": role_hdr_env,
                            "requiredHeaderKeys": role_hdr_keys,
                        }
                    )
                    try:
                        requests_used += 1
                        assertions += 1
                        r_resp = client.get(f"{api_origin}{target_ep}", headers=hdrs)
                        mark_role(role_lbl)
                        endpoints_covered.append(f"GET {target_ep}")
                        trace_records.append(
                            {"phase": "configured_role_probe", "role": role_lbl, "tenantId": tenant_lbl, "path": target_ep, "status": r_resp.status_code}
                        )
                        if r_resp.status_code >= 500:
                            add_finding(
                                fid=f"QA-FUZZ-{len(findings) + 1:03d}",
                                fp=f"confirmed_bug|role500:{role_lbl}:GET {target_ep}",
                                classification="confirmed_bug",
                                severity="high",
                                title=f"Configured role {role_lbl} triggered HTTP {r_resp.status_code} on GET {target_ep}",
                                endpoint_or_route=f"GET {target_ep}",
                                check_mode="status_gte_500",
                                repro_cmd=f"curl -i {api_origin}{target_ep}",
                                verified_outcome=f"GET {target_ep} as role={role_lbl} returned HTTP {r_resp.status_code}",
                                method="GET",
                                rel_path=target_ep,
                                headers=hdrs,
                                token_env=tok_env,
                                headers_env=role_hdr_env,
                                required_header_keys=role_hdr_keys,
                            )
                    except Exception as exc:
                        trace_records.append({"phase": "configured_role_probe", "role": role_lbl, "error": str(exc)})

                # Cross-role RBAC checks on gated endpoints for non-mock APIs
                if not has_mock_rbac and resolved_roles and requests_used + 4 < max_requests and time.monotonic() < soft_deadline:
                    tool_used = "hypothesis"
                    gated_rbac_paths = [
                        p for p in (
                            "/v1/education/reports/enrollment",
                            "/v1/education/finance/overview",
                            "/v1/hr/payroll/runs",
                            "/v1/platform/centres",
                        )
                        if p in known_paths or any(e["path"] == p for e in static_routes)
                    ]
                    lower_roles = [
                        r for r in resolved_roles
                        if r["role"] in ("student", "guardian", "viewer", "teacher")
                        or str(r["role"]).startswith("custom")
                    ]
                    for lr in lower_roles:
                        for gp in gated_rbac_paths[:2]:
                            if lr["role"] == "viewer" and "finance" in gp:
                                continue
                            if requests_used >= max_requests or time.monotonic() >= soft_deadline:
                                break
                            try:
                                requests_used += 1
                                assertions += 1
                                rbac_resp = client.get(f"{api_origin}{gp}", headers=lr["headers"])
                                endpoints_covered.append(f"GET {gp}")
                                trace_records.append(
                                    {"phase": "cross_role_rbac", "role": lr["role"], "path": gp, "status": rbac_resp.status_code}
                                )
                                if rbac_resp.status_code >= 500:
                                    add_finding(
                                        fid=f"QA-FUZZ-{len(findings) + 1:03d}",
                                        fp=f"confirmed_bug|rbac500:{lr['role']}:{gp}",
                                        classification="confirmed_bug",
                                        severity="high",
                                        title=f"Cross-role RBAC probe triggered HTTP {rbac_resp.status_code} on GET {gp}",
                                        endpoint_or_route=f"GET {gp}",
                                        check_mode="status_gte_500",
                                        repro_cmd=f"curl -i {api_origin}{gp}",
                                        verified_outcome=f"Role {lr['role']} on {gp} returned HTTP {rbac_resp.status_code}",
                                        method="GET",
                                        rel_path=gp,
                                        headers=lr["headers"],
                                        token_env=lr.get("tokenEnv"),
                                        headers_env=lr.get("headersEnv"),
                                        required_header_keys=lr.get("requiredHeaderKeys"),
                                    )
                                elif lr["role"] in ("student", "guardian") and rbac_resp.status_code == 200 and rbac_resp.text.strip():
                                    add_finding(
                                        fid=f"QA-FUZZ-{len(findings) + 1:03d}",
                                        fp=f"confirmed_bug|rbac_leak:{lr['role']}:{gp}",
                                        classification="confirmed_bug",
                                        severity="critical",
                                        title=f"Privilege escalation: {lr['role']} accessed staff endpoint {gp} with HTTP 200",
                                        endpoint_or_route=f"GET {gp}",
                                        check_mode="unauth_protected_200",
                                        repro_cmd=f"curl -i {api_origin}{gp}",
                                        verified_outcome=f"Expected 401/403 for {lr['role']} on {gp}, got HTTP 200",
                                        method="GET",
                                        rel_path=gp,
                                        headers=lr["headers"],
                                        token_env=lr.get("tokenEnv"),
                                        headers_env=lr.get("headersEnv"),
                                        required_header_keys=lr.get("requiredHeaderKeys"),
                                    )
                            except Exception as exc:
                                trace_records.append({"phase": "cross_role_rbac", "role": lr["role"], "path": gp, "error": str(exc)})

                    # Cross-tenant IDOR check between distinct tenant owners
                    owners_by_tenant: dict[str, dict[str, Any]] = {}
                    for r in resolved_roles:
                        if r["role"].startswith("owner") and r["tenantId"] and r["tenantId"] not in owners_by_tenant:
                            owners_by_tenant[r["tenantId"]] = r
                    tenant_owners = list(owners_by_tenant.values())
                    if len(tenant_owners) >= 2 and ("/v1/education/groups" in known_paths or "/v1/education/courses" in known_paths):
                        owner_a, owner_b = tenant_owners[0], tenant_owners[1]
                        for list_ep, detail_prefix in [
                            ("/v1/education/groups", "/v1/education/groups"),
                            ("/v1/education/courses", "/v1/education/courses"),
                        ]:
                            if requests_used + 2 > max_requests or time.monotonic() >= soft_deadline:
                                break
                            try:
                                requests_used += 1
                                l_resp = client.get(f"{api_origin}{list_ep}", headers=owner_b["headers"])
                                endpoints_covered.append(f"GET {list_ep}")
                                items_data = l_resp.json() if l_resp.status_code == 200 else {}
                                items_list = items_data.get("items") if isinstance(items_data, dict) else (items_data if isinstance(items_data, list) else [])
                                if items_list and isinstance(items_list[0], dict) and items_list[0].get("id"):
                                    foreign_id = items_list[0]["id"]
                                    detail_path = f"{detail_prefix}/{foreign_id}"
                                    requests_used += 1
                                    assertions += 1
                                    idor_r = client.get(f"{api_origin}{detail_path}", headers=owner_a["headers"])
                                    endpoints_covered.append(f"GET {detail_prefix}/{{id}}")
                                    trace_records.append(
                                        {
                                            "phase": "cross_tenant_idor",
                                            "actorRole": owner_a["role"],
                                            "targetTenant": owner_b["tenantId"],
                                            "path": detail_prefix,
                                            "status": idor_r.status_code,
                                        }
                                    )
                                    if idor_r.status_code == 200 and idor_r.text.strip():
                                        add_finding(
                                            fid=f"QA-FUZZ-{len(findings) + 1:03d}",
                                            fp=f"confirmed_bug|cross_tenant_idor:{detail_prefix}",
                                            classification="confirmed_bug",
                                            severity="critical",
                                            title=f"Cross-tenant IDOR: {owner_a['role']} read foreign tenant resource on {detail_prefix}",
                                            endpoint_or_route=f"GET {detail_prefix}/{{id}}",
                                            check_mode="unauth_protected_200",
                                            repro_cmd=f"curl -i {api_origin}{detail_path}",
                                            verified_outcome=f"Expected 403/404 across tenants, got HTTP 200",
                                            method="GET",
                                            rel_path=detail_path,
                                            headers=owner_a["headers"],
                                            token_env=owner_a.get("tokenEnv"),
                                            headers_env=owner_a.get("headersEnv"),
                                            required_header_keys=owner_a.get("requiredHeaderKeys"),
                                        )
                            except Exception as exc:
                                trace_records.append({"phase": "cross_tenant_idor", "path": list_ep, "error": str(exc)})

        # Phase 2: Hypothesis Stateful CRUD + RuleBasedStateMachine + Unicode/Vietnamese + Negative Payloads
        has_items_crud = "/api/items" in known_paths and "/api/items/{id}" in known_paths
        if api_reachable and has_items_crud and requests_used + 5 <= max_requests and time.monotonic() < soft_deadline:
            tool_used = "hypothesis"
            vietnamese_samples = [
                "Khoa hoc Tieng Viet -- Dang Ngoc Hai",
                "L\u1eadp tr\u00ecnh Python n\u00e2ng cao \u01b0\u01a1\u0103 \u0111\u1ec3 ki\u1ec3m th\u1eed",
                "QA Boundary \u00e0\u00e1\u1ea3\u00e3\u1ea1",
            ]

            @settings(
                database=None,
                deadline=None,
                max_examples=min(max_examples, 3),
                suppress_health_check=list(HealthCheck),
                phases=[Phase.explicit, Phase.generate],
            )
            @given(name=st.sampled_from(vietnamese_samples))
            def run_unicode_crud_property(name: str) -> None:
                nonlocal requests_used, assertions
                if requests_used + 5 > max_requests or time.monotonic() >= soft_deadline:
                    return
                requests_used += 1
                assertions += 1
                mark_role("anonymous")
                c_resp = client.post(f"{api_origin}/api/items", json={"name": name, "tenantId": "tenantA"})
                endpoints_covered.append("POST /api/items")
                trace_records.append({"phase": "hypothesis_crud", "method": "POST", "path": "/api/items", "status": c_resp.status_code})
                if c_resp.status_code >= 500:
                    add_finding(
                        fid=f"QA-FUZZ-{len(findings) + 1:03d}",
                        fp="confirmed_bug|500:POST /api/items",
                        classification="confirmed_bug",
                        severity="high",
                        title="Unicode payload triggered HTTP 5xx on POST /api/items",
                        endpoint_or_route="POST /api/items",
                        check_mode="status_gte_500",
                        repro_cmd=f"curl -i -X POST {api_origin}/api/items",
                        verified_outcome=f"POST /api/items with Unicode payload returned HTTP {c_resp.status_code}",
                        method="POST",
                        rel_path="/api/items",
                        json_body={"name": name, "tenantId": "tenantA"},
                    )
                    return
                if c_resp.status_code in (200, 201):
                    try:
                        created = c_resp.json()
                    except Exception as json_exc:
                        add_finding(
                            fid=f"QA-FUZZ-{len(findings) + 1:03d}",
                            fp="confirmed_bug|json:POST /api/items",
                            classification="confirmed_bug",
                            severity="high",
                            title="Malformed JSON returned on POST /api/items",
                            endpoint_or_route="POST /api/items",
                            check_mode="invalid_json_body",
                            repro_cmd=f"curl -i -X POST {api_origin}/api/items",
                            verified_outcome=f"POST /api/items returned invalid JSON: {json_exc}",
                            method="POST",
                            rel_path="/api/items",
                            json_body={"name": name, "tenantId": "tenantA"},
                        )
                        return
                    item_id = created.get("id") if isinstance(created, dict) else None
                    if item_id is not None:
                        # GET -> PATCH -> DELETE -> GET 404
                        if requests_used < max_requests:
                            requests_used += 1
                            assertions += 1
                            g_resp = client.get(f"{api_origin}/api/items/{item_id}")
                            endpoints_covered.append("GET /api/items/{id}")
                            trace_records.append({"phase": "hypothesis_crud", "method": "GET", "path": f"/api/items/{item_id}", "status": g_resp.status_code})
                            if g_resp.status_code != 200:
                                add_finding(
                                    fid=f"QA-FUZZ-{len(findings) + 1:03d}",
                                    fp=f"confirmed_bug|crud_get:{g_resp.status_code}:/api/items/{{id}}",
                                    classification="confirmed_bug",
                                    severity="high",
                                    title=f"Read-after-create GET /api/items/{{id}} returned HTTP {g_resp.status_code}",
                                    endpoint_or_route="GET /api/items/{id}",
                                    check_mode="status_gte_500" if g_resp.status_code >= 500 else "crud_read_after_write",
                                    repro_cmd=f"curl -i {api_origin}/api/items/{item_id}",
                                    verified_outcome=f"Created item {item_id} via POST /api/items, then GET /api/items/{item_id} returned HTTP {g_resp.status_code}",
                                    method="GET",
                                    rel_path=f"/api/items/{item_id}",
                                )
                        if requests_used < max_requests:
                            requests_used += 1
                            assertions += 1
                            patch_body = {"name": f"{name} (patched)"}
                            p_resp = client.patch(f"{api_origin}/api/items/{item_id}", json=patch_body)
                            endpoints_covered.append("PATCH /api/items/{id}")
                            trace_records.append({"phase": "hypothesis_crud", "method": "PATCH", "path": f"/api/items/{item_id}", "status": p_resp.status_code})
                            if p_resp.status_code >= 500:
                                add_finding(
                                    fid=f"QA-FUZZ-{len(findings) + 1:03d}",
                                    fp="confirmed_bug|500:PATCH /api/items/{id}",
                                    classification="confirmed_bug",
                                    severity="high",
                                    title=f"PATCH /api/items/{{id}} returned HTTP {p_resp.status_code}",
                                    endpoint_or_route="PATCH /api/items/{id}",
                                    check_mode="status_gte_500",
                                    repro_cmd=f"curl -i -X PATCH {api_origin}/api/items/{item_id}",
                                    verified_outcome=f"PATCH /api/items/{item_id} on created item returned HTTP {p_resp.status_code}",
                                    method="PATCH",
                                    rel_path=f"/api/items/{item_id}",
                                    json_body=patch_body,
                                )
                        requests_used += 1
                        assertions += 1
                        d_resp = client.delete(f"{api_origin}/api/items/{item_id}")
                        endpoints_covered.append("DELETE /api/items/{id}")
                        trace_records.append({"phase": "hypothesis_crud", "method": "DELETE", "path": f"/api/items/{item_id}", "status": d_resp.status_code})
                        if d_resp.status_code >= 500:
                            add_finding(
                                fid=f"QA-FUZZ-{len(findings) + 1:03d}",
                                fp="confirmed_bug|500:DELETE /api/items/{id}",
                                classification="confirmed_bug",
                                severity="high",
                                title=f"DELETE /api/items/{{id}} returned HTTP {d_resp.status_code}",
                                endpoint_or_route="DELETE /api/items/{id}",
                                check_mode="status_gte_500",
                                repro_cmd=f"curl -i -X DELETE {api_origin}/api/items/{item_id}",
                                verified_outcome=f"DELETE /api/items/{item_id} on created item returned HTTP {d_resp.status_code}",
                                method="DELETE",
                                rel_path=f"/api/items/{item_id}",
                            )
                        if requests_used < max_requests:
                            requests_used += 1
                            assertions += 1
                            after_del = client.get(f"{api_origin}/api/items/{item_id}")
                            trace_records.append({"phase": "hypothesis_crud", "method": "GET_AFTER_DELETE", "path": f"/api/items/{item_id}", "status": after_del.status_code})
                            if after_del.status_code == 200:
                                add_finding(
                                    fid=f"QA-FUZZ-{len(findings) + 1:03d}",
                                    fp="confirmed_bug|delete_persisted:/api/items",
                                    classification="confirmed_bug",
                                    severity="high",
                                    title="Deleted item still retrievable via GET after DELETE",
                                    endpoint_or_route="DELETE /api/items/{id}",
                                    check_mode="status_gte_500",
                                    repro_cmd=f"curl -i {api_origin}/api/items/{item_id}",
                                    verified_outcome=f"GET /api/items/{item_id} returned 200 after DELETE",
                                    method="GET",
                                    rel_path=f"/api/items/{item_id}",
                                )

            try:
                run_unicode_crud_property()
            except AssertionError as exc:
                trace_records.append({"phase": "hypothesis_crud", "error": repr(exc)})
                add_finding(
                    fid=f"QA-FUZZ-{len(findings) + 1:03d}",
                    fp="confirmed_bug|hypothesis_crud_assertion",
                    classification="confirmed_bug",
                    severity="high",
                    title="Hypothesis CRUD property check raised assertion failure",
                    endpoint_or_route="/api/items",
                    check_mode="status_gte_500",
                    repro_cmd=f"curl -i {api_origin}/api/items",
                    verified_outcome=sanitize_text(str(exc) or repr(exc)),
                    method="GET",
                    rel_path="/api/items",
                )
            except Exception as exc:
                trace_records.append({"phase": "hypothesis_crud", "error": repr(exc)})
                add_finding(
                    fid=f"QA-FUZZ-{len(findings) + 1:03d}",
                    fp="runtime_degraded|hypothesis_crud_exception",
                    classification="runtime_degraded",
                    severity="medium",
                    title="Hypothesis CRUD property check failed with unexpected error",
                    endpoint_or_route="/api/items",
                    check_mode="unreachable",
                    repro_cmd=f"curl -i {api_origin}/api/items",
                    verified_outcome=sanitize_text(f"{type(exc).__name__}: {exc}"),
                )

            # Hypothesis RuleBasedStateMachine over /api/items CRUD transitions
            if requests_used + 4 <= max_requests and time.monotonic() < soft_deadline:
                class ItemsCrudStateMachine(RuleBasedStateMachine):
                    items = Bundle("items")

                    def __init__(self) -> None:
                        super().__init__()
                        self.live_ids: set[Any] = set()

                    @rule(target=items, name=st.sampled_from(vietnamese_samples))
                    def create_item(self, name: str) -> Any:
                        nonlocal requests_used, assertions
                        if requests_used >= max_requests or time.monotonic() >= soft_deadline:
                            return None
                        requests_used += 1
                        assertions += 1
                        mark_role("anonymous")
                        resp = client.post(f"{api_origin}/api/items", json={"name": name, "tenantId": "tenantA"})
                        endpoints_covered.append("POST /api/items")
                        if resp.status_code >= 500:
                            add_finding(
                                fid=f"QA-FUZZ-{len(findings) + 1:03d}",
                                fp="confirmed_bug|500:POST /api/items",
                                classification="confirmed_bug",
                                severity="high",
                                title=f"Stateful POST /api/items returned HTTP {resp.status_code}",
                                endpoint_or_route="POST /api/items",
                                check_mode="status_gte_500",
                                repro_cmd=f"curl -i -X POST {api_origin}/api/items",
                                verified_outcome=f"RuleBasedStateMachine POST /api/items returned HTTP {resp.status_code}",
                                method="POST",
                                rel_path="/api/items",
                                json_body={"name": name, "tenantId": "tenantA"},
                            )
                            return None
                        if resp.status_code in (200, 201):
                            try:
                                cid = resp.json().get("id")
                            except Exception:
                                cid = None
                            if cid is not None:
                                self.live_ids.add(cid)
                                return cid
                        return None

                    @rule(item_id=items)
                    def read_item(self, item_id: Any) -> None:
                        nonlocal requests_used, assertions
                        if item_id is None or requests_used >= max_requests or time.monotonic() >= soft_deadline:
                            return
                        requests_used += 1
                        assertions += 1
                        mark_role("anonymous")
                        resp = client.get(f"{api_origin}/api/items/{item_id}")
                        endpoints_covered.append("GET /api/items/{id}")
                        if resp.status_code >= 500 or (item_id in self.live_ids and resp.status_code != 200):
                            add_finding(
                                fid=f"QA-FUZZ-{len(findings) + 1:03d}",
                                fp=f"confirmed_bug|crud_get:{resp.status_code}:/api/items/{{id}}",
                                classification="confirmed_bug",
                                severity="high",
                                title=f"Stateful GET /api/items/{{id}} returned HTTP {resp.status_code}",
                                endpoint_or_route="GET /api/items/{id}",
                                check_mode="status_gte_500" if resp.status_code >= 500 else "crud_read_after_write",
                                repro_cmd=f"curl -i {api_origin}/api/items/{item_id}",
                                verified_outcome=f"RuleBasedStateMachine GET /api/items/{item_id} returned HTTP {resp.status_code}",
                                method="GET",
                                rel_path=f"/api/items/{item_id}",
                            )

                    @rule(item_id=items, new_name=st.sampled_from(vietnamese_samples))
                    def patch_item(self, item_id: Any, new_name: str) -> None:
                        nonlocal requests_used, assertions
                        if item_id is None or item_id not in self.live_ids or requests_used >= max_requests or time.monotonic() >= soft_deadline:
                            return
                        requests_used += 1
                        assertions += 1
                        mark_role("anonymous")
                        patch_body = {"name": f"{new_name} (sm)"}
                        resp = client.patch(f"{api_origin}/api/items/{item_id}", json=patch_body)
                        endpoints_covered.append("PATCH /api/items/{id}")
                        if resp.status_code >= 500:
                            add_finding(
                                fid=f"QA-FUZZ-{len(findings) + 1:03d}",
                                fp="confirmed_bug|500:PATCH /api/items/{id}",
                                classification="confirmed_bug",
                                severity="high",
                                title=f"PATCH /api/items/{{id}} returned HTTP {resp.status_code}",
                                endpoint_or_route="PATCH /api/items/{id}",
                                check_mode="status_gte_500",
                                repro_cmd=f"curl -i -X PATCH {api_origin}/api/items/{item_id}",
                                verified_outcome=f"RuleBasedStateMachine PATCH /api/items/{item_id} returned HTTP {resp.status_code}",
                                method="PATCH",
                                rel_path=f"/api/items/{item_id}",
                                json_body=patch_body,
                            )

                    @rule(item_id=items)
                    def delete_item(self, item_id: Any) -> None:
                        nonlocal requests_used, assertions
                        if item_id is None or item_id not in self.live_ids or requests_used >= max_requests or time.monotonic() >= soft_deadline:
                            return
                        requests_used += 1
                        assertions += 1
                        mark_role("anonymous")
                        resp = client.delete(f"{api_origin}/api/items/{item_id}")
                        endpoints_covered.append("DELETE /api/items/{id}")
                        self.live_ids.discard(item_id)
                        if resp.status_code >= 500:
                            add_finding(
                                fid=f"QA-FUZZ-{len(findings) + 1:03d}",
                                fp="confirmed_bug|500:DELETE /api/items/{id}",
                                classification="confirmed_bug",
                                severity="high",
                                title=f"DELETE /api/items/{{id}} returned HTTP {resp.status_code}",
                                endpoint_or_route="DELETE /api/items/{id}",
                                check_mode="status_gte_500",
                                repro_cmd=f"curl -i -X DELETE {api_origin}/api/items/{item_id}",
                                verified_outcome=f"RuleBasedStateMachine DELETE /api/items/{item_id} returned HTTP {resp.status_code}",
                                method="DELETE",
                                rel_path=f"/api/items/{item_id}",
                            )

                    def teardown(self) -> None:
                        nonlocal requests_used
                        for rem_id in list(self.live_ids):
                            try:
                                requests_used += 1
                                client.delete(f"{api_origin}/api/items/{rem_id}")
                            except Exception:
                                pass
                        self.live_ids.clear()

                try:
                    run_state_machine_as_test(
                        ItemsCrudStateMachine,
                        settings=settings(
                            database=None,
                            deadline=None,
                            max_examples=min(max_examples, 2),
                            stateful_step_count=4,
                            suppress_health_check=list(HealthCheck),
                        ),
                    )
                except AssertionError as exc:
                    trace_records.append({"phase": "hypothesis_state_machine", "error": repr(exc)})
                    add_finding(
                        fid=f"QA-FUZZ-{len(findings) + 1:03d}",
                        fp="confirmed_bug|hypothesis_sm_assertion",
                        classification="confirmed_bug",
                        severity="high",
                        title="Hypothesis RuleBasedStateMachine detected stateful invariant failure",
                        endpoint_or_route="/api/items",
                        check_mode="status_gte_500",
                        repro_cmd=f"curl -i {api_origin}/api/items",
                        verified_outcome=sanitize_text(str(exc) or repr(exc)),
                        method="GET",
                        rel_path="/api/items",
                    )
                except Exception as exc:
                    trace_records.append({"phase": "hypothesis_state_machine", "error": repr(exc)})

            # Negative input boundary checks (empty string, invalid id, malformed JSON)
            negative_probes = [
                ("POST", "/api/items", {"json": {"name": ""}}),
                ("GET", "/api/items/not-an-integer", {}),
            ]
            for m, rel_p, kw in negative_probes:
                if requests_used >= max_requests:
                    break
                try:
                    requests_used += 1
                    assertions += 1
                    mark_role("anonymous")
                    n_resp = client.request(m, f"{api_origin}{rel_p}", **kw)
                    trace_records.append({"phase": "negative", "method": m, "path": rel_p, "status": n_resp.status_code})
                    if m == "POST" and rel_p == "/api/items" and n_resp.status_code in (200, 201):
                        try:
                            neg_id = n_resp.json().get("id")
                            if neg_id is not None:
                                client.delete(f"{api_origin}/api/items/{neg_id}")
                        except Exception:
                            pass
                    if n_resp.status_code >= 500:
                        add_finding(
                            fid=f"QA-FUZZ-{len(findings) + 1:03d}",
                            fp=f"confirmed_bug|neg500:{m} {rel_p}",
                            classification="confirmed_bug",
                            severity="high",
                            title=f"Negative input triggered HTTP {n_resp.status_code} on {m} {rel_p}",
                            endpoint_or_route=f"{m} {rel_p}",
                            check_mode="status_gte_500",
                            repro_cmd=f"curl -i -X {m} {api_origin}{rel_p}",
                            verified_outcome=f"Negative payload returned HTTP {n_resp.status_code}",
                            method=m,
                            rel_path=rel_p,
                            json_body=kw.get("json") if isinstance(kw, dict) else None,
                        )
                except Exception as exc:
                    trace_records.append({"phase": "negative", "path": rel_p, "error": str(exc)})

        # Phase 2B: Authenticated Live CRUD + PUT + Hypothesis RuleBasedStateMachine + Negative Checks
        has_announcements_crud = (
            "/v1/education/groups/{group_id}/announcements" in known_paths
            and "/v1/education/announcements/{announcement_id}" in known_paths
        )
        staff_actor = None
        for rc in configured_roles:
            tok = resolve_role_token(rc)
            role_hdrs, role_hdr_env, role_hdr_keys = resolve_role_headers(rc)
            rl = str(rc.get("role") or rc.get("name") or "")
            if (tok or role_hdrs) and rl in ("owner", "owner_dev", "admin", "manager"):
                hdrs = dict(role_hdrs)
                if tok:
                    hdrs["Authorization"] = f"Bearer {tok}"
                staff_actor = {
                    "role": rl,
                    "headers": hdrs,
                    "tokenEnv": str(rc.get("tokenEnv")) if rc.get("tokenEnv") else None,
                    "headersEnv": role_hdr_env,
                    "requiredHeaderKeys": role_hdr_keys,
                }
                break
        if api_reachable and not has_items_crud and has_announcements_crud and staff_actor and requests_used + 6 <= max_requests and time.monotonic() < soft_deadline:
            tool_used = "hypothesis"
            mark_role(staff_actor["role"])
            actor_hdrs = staff_actor["headers"]
            actor_token_env = staff_actor.get("tokenEnv")
            actor_headers_env = staff_actor.get("headersEnv")
            actor_header_keys = staff_actor.get("requiredHeaderKeys")
            target_group_id = None
            try:
                requests_used += 1
                grp_resp = client.get(f"{api_origin}/v1/education/groups", headers=actor_hdrs)
                endpoints_covered.append("GET /v1/education/groups")
                if grp_resp.status_code == 200:
                    try:
                        grp_json = grp_resp.json()
                    except Exception as json_exc:
                        add_finding(
                            fid=f"QA-FUZZ-{len(findings) + 1:03d}",
                            fp="confirmed_bug|json:GET /v1/education/groups",
                            classification="confirmed_bug",
                            severity="high",
                            title="Malformed JSON returned on GET /v1/education/groups",
                            endpoint_or_route="GET /v1/education/groups",
                            check_mode="invalid_json_body",
                            repro_cmd=f"curl -i {api_origin}/v1/education/groups",
                            verified_outcome=f"GET /v1/education/groups returned invalid JSON: {json_exc}",
                            method="GET",
                            rel_path="/v1/education/groups",
                            headers=actor_hdrs,
                            token_env=actor_token_env,
                            headers_env=actor_headers_env,
                            required_header_keys=actor_header_keys,
                        )
                        grp_json = {}
                    grp_items = grp_json.get("items") if isinstance(grp_json, dict) else (grp_json if isinstance(grp_json, list) else [])
                    if grp_items and isinstance(grp_items[0], dict) and grp_items[0].get("id"):
                        target_group_id = str(grp_items[0]["id"])
            except Exception as exc:
                trace_records.append({"phase": "live_crud_setup", "error": str(exc)})

            if target_group_id:
                vi_samples = [
                    "__autqa_Khoa hoc Tieng Viet -- Dang Ngoc Hai",
                    "__autqa_Thong bao kiem thu \u01b0\u01a1\u0103 \u0111\u1ec3 ki\u1ec3m ch\u1ee9ng",
                ]
                created_cleanup_ids: set[str] = set()

                @settings(
                    database=None,
                    deadline=None,
                    max_examples=min(max_examples, 2),
                    suppress_health_check=list(HealthCheck),
                    phases=[Phase.explicit, Phase.generate],
                )
                @given(title=st.sampled_from(vi_samples))
                def run_live_announcement_property(title: str) -> None:
                    nonlocal requests_used, assertions
                    if requests_used + 5 > max_requests or time.monotonic() >= soft_deadline:
                        return
                    requests_used += 1
                    assertions += 1
                    c_path = f"/v1/education/groups/{target_group_id}/announcements"
                    c_resp = client.post(
                        f"{api_origin}{c_path}",
                        headers=actor_hdrs,
                        json={"title": title, "body": "__autqa_draft_body", "audience": "both", "status": "draft"},
                    )
                    endpoints_covered.append("POST /v1/education/groups/{group_id}/announcements")
                    trace_records.append({"phase": "live_hypothesis_crud", "method": "POST", "path": c_path, "status": c_resp.status_code})
                    if c_resp.status_code >= 500:
                        add_finding(
                            fid=f"QA-FUZZ-{len(findings) + 1:03d}",
                            fp="confirmed_bug|500:POST /v1/education/groups/{group_id}/announcements",
                            classification="confirmed_bug",
                            severity="high",
                            title=f"Unicode draft creation triggered HTTP {c_resp.status_code}",
                            endpoint_or_route="POST /v1/education/groups/{group_id}/announcements",
                            check_mode="status_gte_500",
                            repro_cmd=f"curl -i -X POST {api_origin}{c_path}",
                            verified_outcome=f"POST draft announcement returned HTTP {c_resp.status_code}",
                            method="POST",
                            rel_path=c_path,
                            headers=actor_hdrs,
                            json_body={"title": title, "body": "__autqa_draft_body", "audience": "both", "status": "draft"},
                            token_env=actor_token_env,
                            headers_env=actor_headers_env,
                            required_header_keys=actor_header_keys,
                        )
                        return
                    if c_resp.status_code in (200, 201):
                        try:
                            created = c_resp.json()
                        except Exception as json_exc:
                            add_finding(
                                fid=f"QA-FUZZ-{len(findings) + 1:03d}",
                                fp="confirmed_bug|json:POST /v1/education/groups/{group_id}/announcements",
                                classification="confirmed_bug",
                                severity="high",
                                title="Malformed JSON returned on POST draft announcement",
                                endpoint_or_route="POST /v1/education/groups/{group_id}/announcements",
                                check_mode="invalid_json_body",
                                repro_cmd=f"curl -i -X POST {api_origin}{c_path}",
                                verified_outcome=f"POST draft announcement returned invalid JSON: {json_exc}",
                                method="POST",
                                rel_path=c_path,
                                headers=actor_hdrs,
                                json_body={"title": title, "body": "__autqa_draft_body", "audience": "both", "status": "draft"},
                                token_env=actor_token_env,
                                headers_env=actor_headers_env,
                                required_header_keys=actor_header_keys,
                            )
                            return
                        ann_id = created.get("id") if isinstance(created, dict) else None
                        if ann_id:
                            ann_id = str(ann_id)
                            created_cleanup_ids.add(ann_id)
                            # GET
                            if requests_used < max_requests:
                                requests_used += 1
                                assertions += 1
                                g_resp = client.get(f"{api_origin}/v1/education/announcements/{ann_id}", headers=actor_hdrs)
                                endpoints_covered.append("GET /v1/education/announcements/{announcement_id}")
                                trace_records.append({"phase": "live_hypothesis_crud", "method": "GET", "status": g_resp.status_code})
                                if g_resp.status_code != 200:
                                    add_finding(
                                        fid=f"QA-FUZZ-{len(findings) + 1:03d}",
                                        fp="confirmed_bug|crud_get:/v1/education/announcements/{announcement_id}",
                                        classification="confirmed_bug",
                                        severity="high",
                                        title=f"Read-after-create GET announcement returned HTTP {g_resp.status_code}",
                                        endpoint_or_route="GET /v1/education/announcements/{announcement_id}",
                                        check_mode="crud_read_after_write",
                                        repro_cmd=f"curl -i {api_origin}/v1/education/announcements/{ann_id}",
                                        verified_outcome=f"GET after POST returned HTTP {g_resp.status_code}",
                                        method="GET",
                                        rel_path=f"/v1/education/announcements/{ann_id}",
                                        headers=actor_hdrs,
                                        token_env=actor_token_env,
                                        headers_env=actor_headers_env,
                                        required_header_keys=actor_header_keys,
                                    )
                            # PATCH
                            if requests_used < max_requests:
                                requests_used += 1
                                assertions += 1
                                p_resp = client.patch(
                                    f"{api_origin}/v1/education/announcements/{ann_id}",
                                    headers=actor_hdrs,
                                    json={"title": f"{title} (patched)"},
                                )
                                endpoints_covered.append("PATCH /v1/education/announcements/{announcement_id}")
                                trace_records.append({"phase": "live_hypothesis_crud", "method": "PATCH", "status": p_resp.status_code})
                                if p_resp.status_code >= 500:
                                    add_finding(
                                        fid=f"QA-FUZZ-{len(findings) + 1:03d}",
                                        fp="confirmed_bug|500:PATCH /v1/education/announcements/{announcement_id}",
                                        classification="confirmed_bug",
                                        severity="high",
                                        title=f"PATCH announcement returned HTTP {p_resp.status_code}",
                                        endpoint_or_route="PATCH /v1/education/announcements/{announcement_id}",
                                        check_mode="status_gte_500",
                                        repro_cmd=f"curl -i -X PATCH {api_origin}/v1/education/announcements/{ann_id}",
                                        verified_outcome=f"PATCH draft announcement returned HTTP {p_resp.status_code}",
                                        method="PATCH",
                                        rel_path=f"/v1/education/announcements/{ann_id}",
                                        headers=actor_hdrs,
                                        json_body={"title": f"{title} (patched)"},
                                        token_env=actor_token_env,
                                        headers_env=actor_headers_env,
                                        required_header_keys=actor_header_keys,
                                    )
                            # DELETE + GET 404 verification (always delete created item even at budget cap)
                            requests_used += 1
                            assertions += 1
                            d_resp = client.delete(f"{api_origin}/v1/education/announcements/{ann_id}", headers=actor_hdrs)
                            endpoints_covered.append("DELETE /v1/education/announcements/{announcement_id}")
                            trace_records.append({"phase": "live_hypothesis_crud", "method": "DELETE", "status": d_resp.status_code})
                            if d_resp.status_code in (200, 204):
                                created_cleanup_ids.discard(ann_id)
                            if d_resp.status_code >= 500:
                                add_finding(
                                    fid=f"QA-FUZZ-{len(findings) + 1:03d}",
                                    fp="confirmed_bug|500:DELETE /v1/education/announcements/{announcement_id}",
                                    classification="confirmed_bug",
                                    severity="high",
                                    title=f"DELETE draft announcement returned HTTP {d_resp.status_code}",
                                    endpoint_or_route="DELETE /v1/education/announcements/{announcement_id}",
                                    check_mode="status_gte_500",
                                    repro_cmd=f"curl -i -X DELETE {api_origin}/v1/education/announcements/{ann_id}",
                                    verified_outcome=f"DELETE draft announcement returned HTTP {d_resp.status_code}",
                                    method="DELETE",
                                    rel_path=f"/v1/education/announcements/{ann_id}",
                                    headers=actor_hdrs,
                                    token_env=actor_token_env,
                                    headers_env=actor_headers_env,
                                    required_header_keys=actor_header_keys,
                                )
                            if requests_used < max_requests:
                                requests_used += 1
                                assertions += 1
                                ad_resp = client.get(f"{api_origin}/v1/education/announcements/{ann_id}", headers=actor_hdrs)
                                trace_records.append({"phase": "live_hypothesis_crud", "method": "GET_AFTER_DELETE", "status": ad_resp.status_code})
                                if ad_resp.status_code == 200:
                                    add_finding(
                                        fid=f"QA-FUZZ-{len(findings) + 1:03d}",
                                        fp="confirmed_bug|delete_persisted:/v1/education/announcements",
                                        classification="confirmed_bug",
                                        severity="high",
                                        title="Deleted draft announcement still retrievable via GET",
                                        endpoint_or_route="DELETE /v1/education/announcements/{announcement_id}",
                                        check_mode="status_gte_500",
                                        repro_cmd=f"curl -i {api_origin}/v1/education/announcements/{ann_id}",
                                        verified_outcome="GET after DELETE returned 200",
                                        method="GET",
                                        rel_path=f"/v1/education/announcements/{ann_id}",
                                        headers=actor_hdrs,
                                        token_env=actor_token_env,
                                        headers_env=actor_headers_env,
                                        required_header_keys=actor_header_keys,
                                    )

                try:
                    run_live_announcement_property()
                except Exception as exc:
                    trace_records.append({"phase": "live_hypothesis_crud", "error": repr(exc)})

                # Live RuleBasedStateMachine over draft announcements
                if requests_used + 4 <= max_requests and time.monotonic() < soft_deadline:
                    class LiveAnnouncementStateMachine(RuleBasedStateMachine):
                        drafts = Bundle("drafts")

                        def __init__(self) -> None:
                            super().__init__()
                            self.live_ids: set[str] = set()

                        @rule(target=drafts, title=st.sampled_from(vi_samples))
                        def create_draft(self, title: str) -> str | None:
                            nonlocal requests_used, assertions
                            if requests_used >= max_requests or time.monotonic() >= soft_deadline:
                                return None
                            requests_used += 1
                            assertions += 1
                            resp = client.post(
                                f"{api_origin}/v1/education/groups/{target_group_id}/announcements",
                                headers=actor_hdrs,
                                json={"title": f"{title} sm", "body": "__autqa_sm", "audience": "both", "status": "draft"},
                            )
                            endpoints_covered.append("POST /v1/education/groups/{group_id}/announcements")
                            if resp.status_code in (200, 201):
                                try:
                                    created_sm = resp.json()
                                except Exception as json_exc:
                                    add_finding(
                                        fid=f"QA-FUZZ-{len(findings) + 1:03d}",
                                        fp="confirmed_bug|json:POST /v1/education/groups/{group_id}/announcements",
                                        classification="confirmed_bug",
                                        severity="high",
                                        title="Malformed JSON returned on stateful POST draft announcement",
                                        endpoint_or_route="POST /v1/education/groups/{group_id}/announcements",
                                        check_mode="invalid_json_body",
                                        repro_cmd=f"curl -i -X POST {api_origin}/v1/education/groups/{target_group_id}/announcements",
                                        verified_outcome=f"Stateful POST draft announcement returned invalid JSON: {json_exc}",
                                        method="POST",
                                        rel_path=f"/v1/education/groups/{target_group_id}/announcements",
                                        headers=actor_hdrs,
                                        json_body={"title": f"{title} sm", "body": "__autqa_sm", "audience": "both", "status": "draft"},
                                        token_env=actor_token_env,
                                        headers_env=actor_headers_env,
                                        required_header_keys=actor_header_keys,
                                    )
                                    return None
                                cid = created_sm.get("id") if isinstance(created_sm, dict) else None
                                if cid:
                                    cid_s = str(cid)
                                    self.live_ids.add(cid_s)
                                    created_cleanup_ids.add(cid_s)
                                    return cid_s
                            return None

                        @rule(ann_id=drafts)
                        def read_draft(self, ann_id: str | None) -> None:
                            nonlocal requests_used, assertions
                            if not ann_id or requests_used >= max_requests or time.monotonic() >= soft_deadline:
                                return
                            requests_used += 1
                            assertions += 1
                            resp = client.get(f"{api_origin}/v1/education/announcements/{ann_id}", headers=actor_hdrs)
                            endpoints_covered.append("GET /v1/education/announcements/{announcement_id}")
                            if resp.status_code >= 500 or (ann_id in self.live_ids and resp.status_code != 200):
                                add_finding(
                                    fid=f"QA-FUZZ-{len(findings) + 1:03d}",
                                    fp=f"confirmed_bug|live_sm_get:{resp.status_code}",
                                    classification="confirmed_bug",
                                    severity="high",
                                    title=f"Stateful GET announcement returned HTTP {resp.status_code}",
                                    endpoint_or_route="GET /v1/education/announcements/{announcement_id}",
                                    check_mode="status_gte_500" if resp.status_code >= 500 else "crud_read_after_write",
                                    repro_cmd=f"curl -i {api_origin}/v1/education/announcements/{ann_id}",
                                    verified_outcome=f"RuleBasedStateMachine GET returned HTTP {resp.status_code}",
                                    method="GET",
                                    rel_path=f"/v1/education/announcements/{ann_id}",
                                    headers=actor_hdrs,
                                    token_env=actor_token_env,
                                    headers_env=actor_headers_env,
                                    required_header_keys=actor_header_keys,
                                )

                        @rule(ann_id=drafts)
                        def delete_draft(self, ann_id: str | None) -> None:
                            nonlocal requests_used, assertions
                            if not ann_id or ann_id not in self.live_ids or requests_used >= max_requests or time.monotonic() >= soft_deadline:
                                return
                            requests_used += 1
                            assertions += 1
                            resp = client.delete(f"{api_origin}/v1/education/announcements/{ann_id}", headers=actor_hdrs)
                            endpoints_covered.append("DELETE /v1/education/announcements/{announcement_id}")
                            if resp.status_code in (200, 204):
                                self.live_ids.discard(ann_id)
                                created_cleanup_ids.discard(ann_id)

                        def teardown(self) -> None:
                            for rem_id in list(self.live_ids | created_cleanup_ids):
                                try:
                                    client.delete(f"{api_origin}/v1/education/announcements/{rem_id}", headers=actor_hdrs)
                                    created_cleanup_ids.discard(rem_id)
                                except Exception:
                                    pass
                            self.live_ids.clear()

                    try:
                        run_state_machine_as_test(
                            LiveAnnouncementStateMachine,
                            settings=settings(
                                database=None,
                                deadline=None,
                                max_examples=1,
                                stateful_step_count=4,
                                suppress_health_check=list(HealthCheck),
                            ),
                        )
                    except Exception as exc:
                        trace_records.append({"phase": "live_hypothesis_sm", "error": repr(exc)})

                # Ensure cleanup of any remaining draft IDs
                for rem_id in list(created_cleanup_ids):
                    try:
                        client.delete(f"{api_origin}/v1/education/announcements/{rem_id}", headers=actor_hdrs)
                    except Exception:
                        pass

                # Idempotent PUT exercise via GET -> PUT /v1/education/notification-preferences + negative checks
                if "/v1/education/notification-preferences" in known_paths and requests_used + 2 <= max_requests:
                    try:
                        requests_used += 1
                        assertions += 1
                        np_get = client.get(f"{api_origin}/v1/education/notification-preferences", headers=actor_hdrs)
                        endpoints_covered.append("GET /v1/education/notification-preferences")
                        if np_get.status_code == 200:
                            try:
                                np_data = np_get.json()
                            except Exception as json_exc:
                                add_finding(
                                    fid=f"QA-FUZZ-{len(findings) + 1:03d}",
                                    fp="confirmed_bug|json:GET /v1/education/notification-preferences",
                                    classification="confirmed_bug",
                                    severity="high",
                                    title="Malformed JSON returned on GET /v1/education/notification-preferences",
                                    endpoint_or_route="GET /v1/education/notification-preferences",
                                    check_mode="invalid_json_body",
                                    repro_cmd=f"curl -i {api_origin}/v1/education/notification-preferences",
                                    verified_outcome=f"GET /v1/education/notification-preferences returned invalid JSON: {json_exc}",
                                    method="GET",
                                    rel_path="/v1/education/notification-preferences",
                                    headers=actor_hdrs,
                                    token_env=actor_token_env,
                                    headers_env=actor_headers_env,
                                    required_header_keys=actor_header_keys,
                                )
                                np_data = None
                            if np_data is not None:
                                np_items = np_data.get("items") if isinstance(np_data, dict) else (np_data.get("preferences") if isinstance(np_data, dict) else [])
                                put_body: dict[str, Any] = {"items": []}
                                if isinstance(np_items, list) and np_items and isinstance(np_items[0], dict) and np_items[0].get("type"):
                                    first_pref = np_items[0]
                                    put_body = {
                                        "items": [
                                            {
                                                "type": first_pref["type"],
                                                "in_app": first_pref.get("in_app"),
                                                "web_push": first_pref.get("web_push"),
                                            }
                                        ]
                                    }
                                requests_used += 1
                                assertions += 1
                                np_put = client.put(
                                    f"{api_origin}/v1/education/notification-preferences",
                                    headers=actor_hdrs,
                                    json=put_body,
                                )
                                endpoints_covered.append("PUT /v1/education/notification-preferences")
                                trace_records.append({"phase": "live_put_roundtrip", "path": "/v1/education/notification-preferences", "status": np_put.status_code})
                                if np_put.status_code >= 500:
                                    add_finding(
                                        fid=f"QA-FUZZ-{len(findings) + 1:03d}",
                                        fp="confirmed_bug|500:PUT /v1/education/notification-preferences",
                                        classification="confirmed_bug",
                                        severity="high",
                                        title=f"PUT /v1/education/notification-preferences returned HTTP {np_put.status_code}",
                                        endpoint_or_route="PUT /v1/education/notification-preferences",
                                        check_mode="status_gte_500",
                                        repro_cmd=f"curl -i -X PUT {api_origin}/v1/education/notification-preferences",
                                        verified_outcome=f"PUT returned HTTP {np_put.status_code}",
                                        method="PUT",
                                        rel_path="/v1/education/notification-preferences",
                                        headers=actor_hdrs,
                                        json_body=put_body,
                                        token_env=actor_token_env,
                                        headers_env=actor_headers_env,
                                        required_header_keys=actor_header_keys,
                                    )
                                elif 400 <= np_put.status_code < 500:
                                    body_preview = sanitize_text(np_put.text[:240]).replace("\n", " ")
                                    add_finding(
                                        fid=f"QA-FUZZ-{len(findings) + 1:03d}",
                                        fp=f"spec_gap|put_roundtrip_4xx:PUT /v1/education/notification-preferences:{np_put.status_code}",
                                        classification="spec_gap",
                                        severity="medium",
                                        title=f"GET -> PUT round-trip on /v1/education/notification-preferences rejected with HTTP {np_put.status_code}",
                                        endpoint_or_route="PUT /v1/education/notification-preferences",
                                        check_mode="put_roundtrip_4xx",
                                        repro_cmd=f"curl -i -X PUT {api_origin}/v1/education/notification-preferences",
                                        verified_outcome=(
                                            f"Idempotent GET -> PUT round-trip returned HTTP {np_put.status_code} "
                                            f"(request/response schema mismatch or undocumented required field): {body_preview}"
                                        ),
                                        method="PUT",
                                        rel_path="/v1/education/notification-preferences",
                                        headers=actor_hdrs,
                                        json_body=put_body,
                                        token_env=actor_token_env,
                                        headers_env=actor_headers_env,
                                        required_header_keys=actor_header_keys,
                                    )
                    except Exception as exc:
                        trace_records.append({"phase": "live_put_roundtrip", "error": str(exc)})

                # Authenticated negative boundary checks on :3200
                live_neg_probes = [
                    ("POST", f"/v1/education/groups/{target_group_id}/announcements", {"json": {"title": ""}}),
                    ("GET", "/v1/education/announcements/not-a-valid-uuid", {}),
                ]
                for m, rel_p, kw in live_neg_probes:
                    if requests_used >= max_requests:
                        break
                    try:
                        requests_used += 1
                        assertions += 1
                        n_resp = client.request(m, f"{api_origin}{rel_p}", headers=actor_hdrs, **kw)
                        trace_records.append({"phase": "live_negative", "method": m, "path": rel_p, "status": n_resp.status_code})
                        if n_resp.status_code >= 500:
                            add_finding(
                                fid=f"QA-FUZZ-{len(findings) + 1:03d}",
                                fp=f"confirmed_bug|live_neg500:{m} {rel_p}",
                                classification="confirmed_bug",
                                severity="high",
                                title=f"Negative payload triggered HTTP {n_resp.status_code} on {m} {rel_p}",
                                endpoint_or_route=f"{m} {rel_p}",
                                check_mode="status_gte_500",
                                repro_cmd=f"curl -i -X {m} {api_origin}{rel_p}",
                                verified_outcome=f"Negative payload returned HTTP {n_resp.status_code}",
                                method=m,
                                rel_path=rel_p,
                                headers=actor_hdrs,
                                json_body=kw.get("json") if isinstance(kw, dict) else None,
                                token_env=actor_token_env,
                                headers_env=actor_headers_env,
                                required_header_keys=actor_header_keys,
                            )
                    except Exception as exc:
                        trace_records.append({"phase": "live_negative", "path": rel_p, "error": str(exc)})

        # Phase 3: Schemathesis OpenAPI Fuzzing (live OpenAPI or HAR-synthesized OpenAPI)
        primary_auth_headers: dict[str, str] = {}
        primary_auth_role: str | None = None
        primary_auth_token_env: str | None = None
        primary_auth_headers_env: str | None = None
        primary_auth_header_keys: list[str] = []
        for rc in configured_roles:
            tok = resolve_role_token(rc)
            eh, h_env, h_keys = resolve_role_headers(rc)
            merged_h = dict(eh)
            if tok:
                merged_h["Authorization"] = f"Bearer {tok}"
            if merged_h:
                primary_auth_headers = merged_h
                primary_auth_role = str(rc.get("role") or rc.get("name") or "authenticated")
                primary_auth_token_env = str(rc.get("tokenEnv")) if rc.get("tokenEnv") else None
                primary_auth_headers_env = h_env
                primary_auth_header_keys = h_keys
                break

        if spec_dict is not None and requests_used < max_requests and time.monotonic() < soft_deadline:
            tool_used = "schemathesis"
            try:
                schema = schemathesis.openapi.from_dict(spec_dict)
                operations = []
                for res in schema.get_all_operations():
                    ok_op = res.ok()
                    if ok_op is not None:
                        operations.append(ok_op)

                # Prioritize operations that are non-hang / fast and cap total budget
                for op in operations:
                    if requests_used >= max_requests or time.monotonic() >= soft_deadline:
                        break
                    op_label = f"{op.method.upper()} {op.path}"
                    if "/hang" in op.path:
                        continue
                    if spec_source == "synthesized_har_openapi" and op.method.upper() not in ("GET", "HEAD", "OPTIONS"):
                        # Keep synthesized HAR fuzzing non-destructive by default
                        continue
                    endpoints_covered.append(op_label)
                    remaining = max_requests - requests_used
                    per_op_examples = max(1, min(max_examples, 2, remaining))
                    created_ids_in_op: list[Any] = []

                    def exec_case(case: Any) -> None:
                        nonlocal requests_used, assertions
                        if requests_used >= max_requests or time.monotonic() >= soft_deadline:
                            return
                        requests_used += 1
                        assertions += 1
                        call_headers: dict[str, str] | None = None
                        if spec_source == "synthesized_har_openapi" and primary_auth_headers:
                            call_headers = dict(primary_auth_headers)
                            mark_role(primary_auth_role or "authenticated")
                        else:
                            mark_role("anonymous")
                        resp = case.call(base_url=api_origin, headers=call_headers, timeout=3.0)
                        trace_records.append(
                            {
                                "phase": "schemathesis",
                                "specSource": spec_source,
                                "op": op_label,
                                "path": case.formatted_path,
                                "status": resp.status_code,
                            }
                        )
                        if op.method.upper() == "POST" and op.path == "/api/items" and resp.status_code in (200, 201):
                            try:
                                cid = resp.json().get("id")
                                if cid is not None:
                                    created_ids_in_op.append(cid)
                            except Exception:
                                pass

                        case_rel_path = case.formatted_path
                        if isinstance(case.query, dict) and case.query:
                            qs = urlencode(case.query, doseq=True)
                            if qs:
                                sep = "&" if "?" in case_rel_path else "?"
                                case_rel_path = f"{case_rel_path}{sep}{qs}"
                        case_headers = (
                            {str(k): str(v) for k, v in case.headers.items()}
                            if isinstance(case.headers, dict) and case.headers
                            else None
                        )
                        if case.body is NOT_SET:
                            case_body = None
                        elif isinstance(case.body, bytes):
                            try:
                                case_body = json.loads(case.body.decode("utf-8", errors="replace"))
                            except Exception:
                                case_body = case.body.decode("utf-8", errors="replace")
                        else:
                            case_body = case.body

                        if resp.status_code >= 500:
                            add_finding(
                                fid=f"QA-FUZZ-{len(findings) + 1:03d}",
                                fp=f"confirmed_bug|500:{op.method.upper()} {case.formatted_path}",
                                classification="confirmed_bug",
                                severity="high",
                                title=f"Schemathesis detected HTTP {resp.status_code} on {op.method.upper()} {case.formatted_path}",
                                endpoint_or_route=f"{op.method.upper()} {case.formatted_path}",
                                check_mode="status_gte_500",
                                repro_cmd=case.as_curl_command(),
                                verified_outcome=f"Fuzz case for {op_label} returned HTTP {resp.status_code}",
                                method=op.method.upper(),
                                rel_path=case_rel_path,
                                headers=case_headers,
                                json_body=case_body,
                            )
                            return

                        ct = str(resp.headers.get("content-type", "")).lower()
                        if resp.status_code == 200 and "json" in ct and resp.text.strip():
                            try:
                                resp.json()
                            except Exception as json_exc:
                                add_finding(
                                    fid=f"QA-FUZZ-{len(findings) + 1:03d}",
                                    fp=f"confirmed_bug|json:{op.method.upper()} {case.formatted_path}",
                                    classification="confirmed_bug",
                                    severity="high",
                                    title=f"Malformed JSON returned on HTTP 200 for {op.method.upper()} {case.formatted_path}",
                                    endpoint_or_route=f"{op.method.upper()} {case.formatted_path}",
                                    check_mode="invalid_json_body",
                                    repro_cmd=case.as_curl_command(),
                                    verified_outcome=f"JSON decode failed: {json_exc}",
                                    method=op.method.upper(),
                                    rel_path=case_rel_path,
                                    headers=case_headers,
                                    json_body=case_body,
                                )
                                return

                        try:
                            case.validate_response(resp)
                        except (FailureGroup, AssertionError) as val_err:
                            msg = str(val_err)
                            if "500" in msg or "Server error" in msg:
                                add_finding(
                                    fid=f"QA-FUZZ-{len(findings) + 1:03d}",
                                    fp=f"confirmed_bug|schema:{op_label}",
                                    classification="confirmed_bug",
                                    severity="high",
                                    title=f"Schemathesis response validation failed for {op_label}",
                                    endpoint_or_route=op_label,
                                    check_mode="status_gte_500",
                                    repro_cmd=case.as_curl_command(),
                                    verified_outcome=sanitize_text(msg[:300]),
                                    method=op.method.upper(),
                                    rel_path=case_rel_path,
                                    headers=case_headers,
                                    json_body=case_body,
                                )

                    try:
                        if "{" not in op.path:
                            exec_case(op.Case())
                        if requests_used < max_requests and time.monotonic() < soft_deadline and per_op_examples > 0:
                            strategy = op.as_strategy(generation_mode=GenerationMode.POSITIVE)

                            @settings(
                                database=None,
                                deadline=None,
                                max_examples=per_op_examples,
                                suppress_health_check=list(HealthCheck),
                                phases=[Phase.generate],
                            )
                            @given(case=strategy)
                            def run_op_fuzz(case: Any) -> None:
                                exec_case(case)

                            run_op_fuzz()
                    except Exception as op_exc:
                        trace_records.append({"phase": "schemathesis_op", "op": op_label, "error": str(op_exc)})

                    for cid in created_ids_in_op:
                        try:
                            requests_used += 1
                            client.delete(f"{api_origin}/api/items/{cid}")
                        except Exception:
                            pass
            except Exception as sch_exc:
                trace_records.append({"phase": "schemathesis_init", "error": str(sch_exc)})

        # Phase 4: Static-Catalog Route Probing & Negative Boundary Checks (unauth + authenticated probes)
        if static_routes and api_reachable and requests_used < max_requests and time.monotonic() < soft_deadline:
            if spec_dict is None:
                tool_used = "hypothesis"
            unparam_gets = [
                e for e in static_routes
                if e["method"] == "GET" and "{" not in e["path"] and "/logout" not in e["path"] and "/sse" not in e["path"]
            ]
            param_gets = [
                e for e in static_routes
                if e["method"] == "GET" and "{" in e["path"] and "/logout" not in e["path"] and "/sse" not in e["path"]
            ]
            # Prioritize a mix of protected/admin routes and general routes
            protected_gets = [
                e for e in unparam_gets
                if e["gates"] or e["scopes"] or "/admin" in e["path"] or "/staff" in e["path"] or "/platform-admin" in e["path"]
            ]
            other_gets = [e for e in unparam_gets if e not in protected_gets]
            selected_static: list[tuple[dict[str, Any], str, bool]] = []
            for e in protected_gets[:4]:
                selected_static.append((e, e["path"], True))
            for e in other_gets[:3]:
                selected_static.append((e, e["path"], False))
            for e in param_gets[:2]:
                bad_path = re.sub(r"\{[^}]+\}", "not-a-valid-uuid", e["path"]) + "?limit=-1&page=abc"
                selected_static.append((e, bad_path, False))

            probe_budget = min(max_requests - requests_used, 14)
            probed_count = 0
            for entry, req_path, expect_protected in selected_static:
                if probed_count >= probe_budget or requests_used >= max_requests or time.monotonic() >= soft_deadline:
                    break
                probed_count += 1
                try:
                    requests_used += 1
                    assertions += 1
                    mark_role("anonymous")
                    s_resp = client.get(f"{api_origin}{req_path}")
                    endpoints_covered.append(f"GET {entry['path']}")
                    trace_records.append(
                        {
                            "phase": "static_catalog_probe",
                            "mode": "unauthenticated",
                            "path": req_path,
                            "template": entry["path"],
                            "expectProtected": expect_protected,
                            "status": s_resp.status_code,
                        }
                    )
                    if s_resp.status_code >= 500:
                        add_finding(
                            fid=f"QA-FUZZ-{len(findings) + 1:03d}",
                            fp=f"confirmed_bug|static500:GET {req_path}",
                            classification="confirmed_bug",
                            severity="high",
                            title=f"Static-catalog probe triggered HTTP {s_resp.status_code} on GET {req_path}",
                            endpoint_or_route=f"GET {entry['path']}",
                            check_mode="status_gte_500",
                            repro_cmd=f"curl -i {api_origin}{req_path}",
                            verified_outcome=f"GET {req_path} returned HTTP {s_resp.status_code}",
                            method="GET",
                            rel_path=req_path,
                        )
                    else:
                        ct = str(s_resp.headers.get("content-type", "")).lower()
                        if s_resp.status_code == 200 and "json" in ct and s_resp.text.strip():
                            try:
                                s_resp.json()
                            except Exception as json_exc:
                                add_finding(
                                    fid=f"QA-FUZZ-{len(findings) + 1:03d}",
                                    fp=f"confirmed_bug|static_json:GET {req_path}",
                                    classification="confirmed_bug",
                                    severity="high",
                                    title=f"Malformed JSON on HTTP 200 for GET {req_path}",
                                    endpoint_or_route=f"GET {entry['path']}",
                                    check_mode="invalid_json_body",
                                    repro_cmd=f"curl -i {api_origin}{req_path}",
                                    verified_outcome=f"JSON decode failed: {json_exc}",
                                    method="GET",
                                    rel_path=req_path,
                                )
                                continue
                        is_strictly_gated = any(
                            g in ("staff_only", "admin_only", "owner_only", "platform_admin") for g in entry["gates"]
                        ) or bool(entry["scopes"])
                        if expect_protected and is_strictly_gated and s_resp.status_code == 200 and "json" in ct and s_resp.text.strip():
                            add_finding(
                                fid=f"QA-FUZZ-{len(findings) + 1:03d}",
                                fp=f"confirmed_bug|unauth_static:GET {entry['path']}",
                                classification="confirmed_bug",
                                severity="critical",
                                title=f"Unauthenticated GET returned HTTP 200 on protected route {entry['path']}",
                                endpoint_or_route=f"GET {entry['path']}",
                                check_mode="unauth_protected_200",
                                repro_cmd=f"curl -i {api_origin}{req_path}",
                                verified_outcome=f"Expected 401/403 for gated route {entry['path']}, got HTTP 200",
                                method="GET",
                                rel_path=req_path,
                            )
                    # Follow up with authenticated probe when unauth returned 401/403 so endpoint handler is exercised
                    if (
                        primary_auth_headers
                        and s_resp.status_code in (401, 403)
                        and probed_count < probe_budget
                        and requests_used < max_requests
                        and time.monotonic() < soft_deadline
                    ):
                        probed_count += 1
                        requests_used += 1
                        assertions += 1
                        mark_role(primary_auth_role or "authenticated")
                        a_resp = client.get(f"{api_origin}{req_path}", headers=primary_auth_headers)
                        trace_records.append(
                            {
                                "phase": "static_catalog_probe",
                                "mode": "authenticated",
                                "role": primary_auth_role or "authenticated",
                                "path": req_path,
                                "template": entry["path"],
                                "status": a_resp.status_code,
                            }
                        )
                        if a_resp.status_code >= 500:
                            add_finding(
                                fid=f"QA-FUZZ-{len(findings) + 1:03d}",
                                fp=f"confirmed_bug|static_auth500:GET {req_path}",
                                classification="confirmed_bug",
                                severity="high",
                                title=f"Authenticated static-catalog probe triggered HTTP {a_resp.status_code} on GET {req_path}",
                                endpoint_or_route=f"GET {entry['path']}",
                                check_mode="status_gte_500",
                                repro_cmd=f"curl -i {api_origin}{req_path}",
                                verified_outcome=f"Authenticated GET {req_path} ({primary_auth_role}) returned HTTP {a_resp.status_code}",
                                method="GET",
                                rel_path=req_path,
                                headers=primary_auth_headers,
                                token_env=primary_auth_token_env,
                                headers_env=primary_auth_headers_env,
                                required_header_keys=primary_auth_header_keys,
                            )
                except Exception as exc:
                    trace_records.append({"phase": "static_catalog_probe", "path": req_path, "error": str(exc)})

    status = "passed"
    if any(f["classification"] == "confirmed_bug" for f in findings):
        status = "failed"
    elif any(f["classification"] in ("runtime_degraded", "spec_gap") for f in findings):
        status = "degraded"
    elif assertions == 0:
        status = "skipped_non_applicable"

    trace_payload = {
        "tool": tool_used,
        "mode": "stateful",
        "status": status,
        "apiOrigin": api_origin,
        "requestsUsed": requests_used,
        "assertions": assertions,
        "endpointsCovered": list(dict.fromkeys(endpoints_covered)),
        "findings": findings,
        "records": trace_records,
    }
    write_json_atomic(trace_path, trace_payload)

    return finish(
        status=status,
        tool=tool_used,
        mode="stateful",
        requests_used=requests_used,
        endpoints=endpoints_covered,
        roles=roles_covered,
        assertions=assertions,
        findings=findings,
        traces=[rel_trace],
        reg_tests=reg_tests,
        notes=(
            f"Executed {requests_used} API fuzz/stateful/RBAC request(s) across "
            f"{len(set(endpoints_covered))} endpoint(s); findings={len(findings)}."
        ),
    )


if __name__ == "__main__":
    sys.exit(main())
