export interface ParsedArgs {
  command?: string;
  positional: string[];
  flags: Map<string, string | boolean>;
}

export function parseArgs(argv: string[]): ParsedArgs {
  const positional: string[] = [];
  const flags = new Map<string, string | boolean>();
  let i = 0;

  while (i < argv.length) {
    const arg = argv[i]!;

    if (arg === "--") {
      positional.push(...argv.slice(i + 1));
      break;
    }

    if (arg.startsWith("--")) {
      const eq = arg.indexOf("=");
      if (eq !== -1) {
        flags.set(arg.slice(2, eq), arg.slice(eq + 1));
      } else {
        const key = arg.slice(2);
        const next = argv[i + 1];
        if (next && !next.startsWith("-")) {
          flags.set(key, next);
          i += 1;
        } else {
          flags.set(key, true);
        }
      }
    } else if (arg.startsWith("-") && arg.length > 1 && arg !== "-") {
      for (let j = 1; j < arg.length; j += 1) {
        flags.set(arg[j]!, true);
      }
    } else {
      positional.push(arg);
    }

    i += 1;
  }

  const [command, ...rest] = positional;
  return { command, positional: rest, flags };
}

export function flagString(
  flags: Map<string, string | boolean>,
  name: string,
  fallback?: string,
): string | undefined {
  const value = flags.get(name);
  if (value === undefined || value === true) return fallback;
  if (value === false) return fallback;
  return value;
}
