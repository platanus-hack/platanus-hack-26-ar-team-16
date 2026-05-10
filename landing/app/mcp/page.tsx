import type { Metadata } from "next";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { Reveal } from "@/components/reveal";
import { Eyebrow, Arrow } from "@/components/primitives";

export const metadata: Metadata = {
  title: "Gohan AI — MCP integration",
  description:
    "Plug Gohan AI into your gym app via the Model Context Protocol. Nine tools, one Node process, your data stays in your Supabase.",
};

const TOOLS: { name: string; tagline: string; params: [string, string][] }[] = [
  {
    name: "get_user_routine",
    tagline: "Read a member's active routine — days, exercises, ai_reasoning.",
    params: [["user_id", "string"]],
  },
  {
    name: "list_exercises_for_day",
    tagline: "Same shape, scoped to one day of the week.",
    params: [
      ["user_id", "string"],
      ["day_of_week", "0–6"],
    ],
  },
  {
    name: "update_exercise",
    tagline: "Mutate sets / reps / weight / notes. Only fields passed are touched.",
    params: [
      ["exercise_id", "string"],
      ["sets / reps / weight_kg / notes", "optional"],
    ],
  },
  {
    name: "add_exercise",
    tagline: "Append to the end of a routine day. order_index auto-assigned.",
    params: [
      ["routine_day_id", "string"],
      ["exercise_name", "string"],
    ],
  },
  {
    name: "remove_exercise",
    tagline: "Delete an exercise. Siblings keep their order_index — gaps are fine.",
    params: [["exercise_id", "string"]],
  },
  {
    name: "replace_exercise",
    tagline: "Swap an exercise while keeping its position. Internally delete + insert (new UUID).",
    params: [
      ["exercise_id", "string"],
      ["exercise_name", "string"],
    ],
  },
  {
    name: "get_user_profile",
    tagline: "Full profile row — display_name, fitness_level, goals, training_days_per_week.",
    params: [["user_id", "string"]],
  },
  {
    name: "get_tenant_info",
    tagline: "Brand colour + logo + slug for a gym. Drives client theming per tenant.",
    params: [["tenant_slug", "string"]],
  },
  {
    name: "list_tenant_users",
    tagline: "All users belonging to a gym. Useful for admin dashboards.",
    params: [["tenant_slug", "string"]],
  },
];

export default function McpPage() {
  return (
    <main className="relative">
      <Nav />
      <Hero />
      <WhatYouGet />
      <Architecture />
      <Install />
      <Tools />
      <Patterns />
      <Security />
      <Footer />
    </main>
  );
}

// ─────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative pt-28 pb-20 md:pt-44 md:pb-32 bg-[var(--color-paper)]">
      <div className="mx-auto max-w-[1440px] px-6 md:px-10">
        <Reveal>
          <Eyebrow number="MCP">Integration · v1.0</Eyebrow>
        </Reveal>
        <Reveal delay={120}>
          <h1 className="display mt-8 text-[12vw] sm:text-[14vw] md:text-[12vw] lg:text-[10rem] -tracking-[0.04em] [text-wrap:balance]">
            Plug Gohan AI
            <br />
            <span className="display-italic text-[var(--color-flame)]">
              into your app.
            </span>
          </h1>
        </Reveal>
        <Reveal delay={260}>
          <p className="mt-10 text-xl md:text-2xl leading-[1.4] text-[var(--color-graphite)] max-w-3xl">
            Nine tools. One Node process speaking the{" "}
            <span className="font-mono text-[0.92em]">Model Context Protocol</span>{" "}
            over stdio. Your members keep using your app. Your data stays in your
            Supabase. Our intelligence drops in via the agent host you already run.
          </p>
        </Reveal>
        <Reveal delay={400} className="mt-12">
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="#install"
              className="btn-shine inline-flex items-center justify-between gap-6 px-6 py-4 rounded-full bg-[var(--color-ink)] text-[var(--color-paper)] hover:bg-[var(--color-flame)] transition-colors group"
            >
              <span className="font-medium text-[15px]">Quick install</span>
              <Arrow className="ml-2" />
            </a>
            <a
              href="https://github.com/platanus-hack/platanus-hack-26-ar-team-16/blob/main/mcp-server/README.md"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-between gap-6 px-6 py-4 rounded-full border border-[var(--color-ink)]/15 hover:border-[var(--color-ink)] transition-colors group"
            >
              <span className="font-medium text-[15px]">Full reference on GitHub</span>
              <Arrow className="ml-2" />
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function WhatYouGet() {
  const items = [
    {
      h: "9 tools, one binary",
      b: "Routine reads, exercise CRUD, profile reads, multi-tenant branding, tenant user listings. All exposed as MCP tools through a single Node process.",
    },
    {
      h: "Stdio, no HTTP",
      b: "Your host spawns the server as a subprocess and exchanges JSON-RPC over stdin/stdout. No new endpoint to monitor, no new auth surface to defend.",
    },
    {
      h: "Direct Supabase access",
      b: "The server talks to the Gohan AI Postgres via a service-role key. No relay, no rate-limited middleman. Sub-millisecond writes; routine updates land in realtime.",
    },
  ];
  return (
    <section className="py-24 md:py-32 border-y border-[color-mix(in_srgb,var(--color-ink)_10%,transparent)] bg-[var(--color-cream)]">
      <div className="mx-auto max-w-[1440px] px-6 md:px-10">
        <Reveal>
          <Eyebrow number="01">What you get</Eyebrow>
        </Reveal>
        <div className="mt-16 grid md:grid-cols-3 gap-px bg-[color-mix(in_srgb,var(--color-ink)_15%,transparent)]">
          {items.map((it, i) => (
            <Reveal key={it.h} delay={i * 100}>
              <article className="bg-[var(--color-cream)] p-8 md:p-10 min-h-[260px]">
                <h3 className="display text-2xl md:text-3xl mb-4 leading-snug">
                  {it.h}
                </h3>
                <p className="text-[var(--color-mute)] leading-relaxed text-[15px]">
                  {it.b}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Architecture() {
  return (
    <section className="py-24 md:py-32 bg-[var(--color-ink)] text-[var(--color-paper)]">
      <div className="mx-auto max-w-[1440px] px-6 md:px-10 grid md:grid-cols-12 gap-10">
        <div className="md:col-span-4">
          <Reveal>
            <Eyebrow number="02" variant="invert">
              Architecture
            </Eyebrow>
          </Reveal>
          <Reveal delay={100}>
            <h2 className="display text-4xl md:text-5xl mt-6 leading-tight">
              Your host.
              <br />
              <span className="display-italic text-[var(--color-flame)]">
                Our brain.
              </span>
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <p className="mt-6 text-[var(--color-paper)]/65 text-[15px] leading-relaxed">
              Three actors, two boundaries. Your host trusts the server because
              it spawned it; the server trusts your host for the same reason.
              Supabase is the source of truth.
            </p>
          </Reveal>
        </div>
        <Reveal delay={260} className="md:col-span-8">
          <div className="bg-[var(--color-graphite)] border border-[var(--color-paper)]/10 rounded-2xl p-6 md:p-8 overflow-x-auto">
            <pre className="font-mono text-[12px] md:text-[13px] leading-relaxed text-[var(--color-paper)]/85 whitespace-pre">
{`┌──────────────────────┐  stdio  ┌───────────────────┐  HTTPS  ┌──────────────┐
│  MCP host            │ ──────▶ │ gohan-ai server   │ ──────▶ │  Supabase    │
│  Claude Desktop,     │ ◀────── │ (Node process)    │ ◀────── │  (Postgres)  │
│  your gym backend,   │   tools │ SERVICE_ROLE auth │         │              │
│  custom agent…       │         │                   │         │              │
└──────────────────────┘         └───────────────────┘         └──────────────┘`}
            </pre>
            <ul className="mt-6 space-y-2 text-sm text-[var(--color-paper)]/65">
              <li>
                <span className="text-[var(--color-flame)] font-mono mr-2">·</span>
                Transport: stdio. No HTTP listener. The host owns the lifecycle.
              </li>
              <li>
                <span className="text-[var(--color-flame)] font-mono mr-2">·</span>
                Host ↔ server: trusted by process boundary.
              </li>
              <li>
                <span className="text-[var(--color-flame)] font-mono mr-2">·</span>
                Server ↔ Supabase:{" "}
                <span className="font-mono text-[0.9em]">SUPABASE_SERVICE_ROLE_KEY</span>.
                Bypasses RLS — keep it server-side.
              </li>
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Install() {
  return (
    <section id="install" className="py-24 md:py-32">
      <div className="mx-auto max-w-[1440px] px-6 md:px-10 grid md:grid-cols-12 gap-10">
        <div className="md:col-span-4">
          <Reveal>
            <Eyebrow number="03">Install</Eyebrow>
          </Reveal>
          <Reveal delay={100}>
            <h2 className="display text-4xl md:text-5xl mt-6 leading-tight">
              Three commands.
              <br />
              <span className="display-italic text-[var(--color-flame)]">
                Then it&rsquo;s yours.
              </span>
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <p className="mt-6 text-[var(--color-mute)] leading-relaxed">
              Node ≥ 18 and a Supabase project provisioned with the Gohan AI
              schema. Service-role key in env. The server starts even with
              missing creds — the failure surfaces on the first tool call so
              your host can decide what to do.
            </p>
          </Reveal>
        </div>
        <div className="md:col-span-8 space-y-6">
          <Reveal delay={260}>
            <CodeBlock
              title="Build"
              lines={[
                ["c", "# clone this repo, then"],
                ["k", "cd "],
                ["v", "mcp-server"],
                [],
                ["k", "npm install"],
                ["k", "npm run build"],
                ["c", "# emits dist/index.js"],
              ]}
            />
          </Reveal>
          <Reveal delay={360}>
            <CodeBlock
              title="claude_desktop_config.json"
              lines={[
                ["b", "{"],
                ["b", "  \"mcpServers\": {"],
                ["b", "    \"gohan-ai\": {"],
                ["b", "      \"command\": \"node\","],
                ["b", "      \"args\": [\"/path/to/mcp-server/dist/index.js\"],"],
                ["b", "      \"env\": {"],
                ["b", "        \"SUPABASE_URL\": \"https://your-project.supabase.co\","],
                ["b", "        \"SUPABASE_SERVICE_ROLE_KEY\": \"your-service-role-key\""],
                ["b", "      }"],
                ["b", "    }"],
                ["b", "  }"],
                ["b", "}"],
              ]}
            />
          </Reveal>
          <Reveal delay={460}>
            <CodeBlock
              title="Or wire it from your own MCP host (Node)"
              lines={[
                ["k", "import "],
                ["b", "{ Client } "],
                ["k", "from "],
                ["s", "'@modelcontextprotocol/sdk/client/index.js'"],
                ["b", ";"],
                ["k", "import "],
                ["b", "{ StdioClientTransport } "],
                ["k", "from "],
                ["s", "'@modelcontextprotocol/sdk/client/stdio.js'"],
                ["b", ";"],
                [],
                ["k", "const "],
                ["b", "transport = "],
                ["k", "new "],
                ["b", "StdioClientTransport({ command: "],
                ["s", "'node'"],
                ["b", ", args: […], env: {…} });"],
                [],
                ["k", "const "],
                ["b", "client = "],
                ["k", "new "],
                ["b", "Client({ name: "],
                ["s", "'my-gym-app'"],
                ["b", ", version: "],
                ["s", "'1.0.0'"],
                ["b", " }, { capabilities: {} });"],
                ["k", "await "],
                ["b", "client.connect(transport);"],
                [],
                ["k", "const "],
                ["b", "result = "],
                ["k", "await "],
                ["b", "client.callTool({ name: "],
                ["s", "'get_user_routine'"],
                ["b", ", arguments: { user_id } });"],
              ]}
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function CodeBlock({
  title,
  lines,
}: {
  title: string;
  /** [class, text] tuples per line. Class: c=comment, k=keyword, s=string, v=value, b=base. */
  lines: ([string, string] | [])[];
}) {
  const colourFor = (cls: string) => {
    switch (cls) {
      case "c":
        return "color: var(--color-fade)";
      case "k":
        return "color: #9aa5b1; font-style: italic";
      case "s":
        return "color: var(--color-flame)";
      case "v":
        return "color: var(--color-flame)";
      default:
        return "color: var(--color-paper)";
    }
  };

  return (
    <div className="bg-[var(--color-graphite)] rounded-2xl border border-[color-mix(in_srgb,var(--color-paper)_15%,transparent)] overflow-hidden shadow-2xl">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[color-mix(in_srgb,var(--color-paper)_10%,transparent)]">
        <span className="w-2.5 h-2.5 rounded-full bg-[color-mix(in_srgb,var(--color-paper)_25%,transparent)]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[color-mix(in_srgb,var(--color-paper)_25%,transparent)]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[color-mix(in_srgb,var(--color-paper)_25%,transparent)]" />
        <span className="ml-3 text-xs font-mono text-[color-mix(in_srgb,var(--color-paper)_60%,transparent)]">
          {title}
        </span>
      </div>
      <pre className="px-6 py-5 text-[12.5px] leading-[1.7] font-mono overflow-x-auto whitespace-pre">
        {lines.map((line, i) => {
          if (line.length === 0) return <span key={i}>{"\n"}</span>;
          const [cls, text] = line;
          return (
            <span key={i} style={{ ...parseStyle(colourFor(cls)) }}>
              {text}
              {"\n"}
            </span>
          );
        })}
      </pre>
    </div>
  );
}

// Tiny inline style parser so I don't have to ship the mini classes as Tailwind utilities
function parseStyle(s: string) {
  const out: Record<string, string> = {};
  s.split(";").forEach((kv) => {
    const [k, v] = kv.split(":").map((x) => x.trim());
    if (k && v) {
      const camel = k.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      out[camel] = v;
    }
  });
  return out;
}

function Tools() {
  return (
    <section className="py-24 md:py-32 bg-[var(--color-cream)]">
      <div className="mx-auto max-w-[1440px] px-6 md:px-10">
        <div className="grid md:grid-cols-12 gap-8 mb-16">
          <div className="md:col-span-4">
            <Reveal>
              <Eyebrow number="04">Tool reference</Eyebrow>
            </Reveal>
          </div>
          <Reveal delay={100} className="md:col-span-8">
            <h2 className="display text-4xl md:text-6xl leading-tight">
              Nine tools.
              <br />
              <span className="display-italic text-[var(--color-flame)]">
                Read, mutate, brand.
              </span>
            </h2>
            <p className="mt-6 text-[var(--color-mute)] leading-relaxed max-w-2xl">
              Read tools return JSON-stringified payloads. Write tools return a
              human-readable status string. Errors are returned in the same
              shape with the text prefixed by{" "}
              <span className="font-mono text-[0.92em]">Error:</span>. Tools
              never throw to the host.
            </p>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[color-mix(in_srgb,var(--color-ink)_10%,transparent)]">
          {TOOLS.map((tool, i) => (
            <Reveal key={tool.name} delay={i * 60}>
              <article className="bg-[var(--color-cream)] p-7 md:p-8 h-full flex flex-col gap-4">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-xs text-[var(--color-flame)] tabular tracking-wider">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <code className="font-mono text-[15px] text-[var(--color-ink)]">
                    {tool.name}
                  </code>
                </div>
                <p className="text-[var(--color-mute)] text-[14px] leading-relaxed flex-1">
                  {tool.tagline}
                </p>
                <ul className="flex flex-wrap gap-1.5 text-[11px] font-mono">
                  {tool.params.map(([k, v]) => (
                    <li
                      key={k}
                      className="px-2 py-1 rounded-full bg-[var(--color-ink)]/5 border border-[var(--color-ink)]/10"
                    >
                      <span className="text-[var(--color-graphite)]">{k}</span>
                      <span className="mx-1 text-[var(--color-fade)]">:</span>
                      <span className="text-[var(--color-flame)]">{v}</span>
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Patterns() {
  const cards = [
    {
      h: "Claude Desktop",
      b: "Drop the JSON config into claude_desktop_config.json. Restart. Tools appear under the gohan-ai server. Useful for prototyping a B2B integration in minutes.",
    },
    {
      h: "Your own MCP host",
      b: "Spawn the server from a Node process via @modelcontextprotocol/sdk. Wrap each tool call in your own auth + tenant gate. Production path.",
    },
    {
      h: "Gym backend agent",
      b: "Your backend runs an LLM agent that orchestrates your business logic plus Gohan tools. End users only ever talk to your backend over HTTPS — the service-role key never leaves your infrastructure.",
    },
  ];
  return (
    <section className="py-24 md:py-32">
      <div className="mx-auto max-w-[1440px] px-6 md:px-10">
        <Reveal>
          <Eyebrow number="05">Integration patterns</Eyebrow>
        </Reveal>
        <Reveal delay={100}>
          <h2 className="display text-4xl md:text-6xl mt-8 leading-tight max-w-4xl">
            Three ways to wire it.
            <br />
            <span className="display-italic text-[var(--color-flame)]">
              Pick the trust boundary you want.
            </span>
          </h2>
        </Reveal>
        <div className="mt-16 grid md:grid-cols-3 gap-px bg-[color-mix(in_srgb,var(--color-ink)_15%,transparent)]">
          {cards.map((c, i) => (
            <Reveal key={c.h} delay={i * 100}>
              <article className="bg-[var(--color-paper)] p-8 md:p-10 min-h-[280px] flex flex-col">
                <div className="font-mono text-xs text-[var(--color-flame)] tracking-wider mb-6">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="display text-2xl md:text-3xl mb-4">{c.h}</h3>
                <p className="text-[var(--color-mute)] text-[15px] leading-relaxed">
                  {c.b}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Security() {
  return (
    <section className="py-24 md:py-32 bg-[var(--color-ink)] text-[var(--color-paper)] relative overflow-hidden">
      <div className="grain-overlay grain-overlay-light" />
      <div className="mx-auto max-w-[1440px] px-6 md:px-10 grid md:grid-cols-12 gap-10 relative">
        <div className="md:col-span-4">
          <Reveal>
            <Eyebrow number="06" variant="invert">
              Security
            </Eyebrow>
          </Reveal>
          <Reveal delay={100}>
            <h2 className="display text-4xl md:text-5xl mt-6 leading-tight">
              Trusted host only.
              <br />
              <span className="display-italic text-[var(--color-flame)]">
                Never on the device.
              </span>
            </h2>
          </Reveal>
        </div>
        <Reveal delay={200} className="md:col-span-8">
          <ul className="space-y-5 text-[15px] leading-relaxed text-[var(--color-paper)]/80">
            <li className="flex gap-4">
              <span className="text-[var(--color-flame)] font-mono shrink-0">
                01
              </span>
              <span>
                <span className="font-mono text-[0.92em]">SUPABASE_SERVICE_ROLE_KEY</span>{" "}
                bypasses RLS. Any caller of these tools effectively has full
                read/write on the underlying tables.
              </span>
            </li>
            <li className="flex gap-4">
              <span className="text-[var(--color-flame)] font-mono shrink-0">
                02
              </span>
              <span>
                The server does not authenticate the MCP host and does not
                scope tool calls to a tenant. Authorization is your
                responsibility — gate calls in your host before they reach the
                server.
              </span>
            </li>
            <li className="flex gap-4">
              <span className="text-[var(--color-flame)] font-mono shrink-0">
                03
              </span>
              <span>
                Run inside a trusted environment (your backend, not end-user
                devices). For internet-exposed deployments put the server
                behind your own API and authn layer.
              </span>
            </li>
            <li className="flex gap-4">
              <span className="text-[var(--color-flame)] font-mono shrink-0">
                04
              </span>
              <span>
                Validate <span className="font-mono text-[0.92em]">user_id</span>{" "}
                server-side against your own auth before passing it to tools.
                The server takes user IDs at face value.
              </span>
            </li>
          </ul>
          <div className="mt-12 flex flex-col sm:flex-row gap-3">
            <a
              href="https://github.com/platanus-hack/platanus-hack-26-ar-team-16/blob/main/mcp-server/README.md"
              target="_blank"
              rel="noreferrer"
              className="btn-shine inline-flex items-center justify-between gap-6 px-6 py-4 rounded-full bg-[var(--color-paper)] text-[var(--color-ink)] hover:bg-[var(--color-flame)] hover:text-[var(--color-paper)] transition-colors group"
            >
              <span className="font-medium text-[15px]">Read the full reference</span>
              <Arrow className="ml-2" />
            </a>
            <a
              href="/#contact"
              className="inline-flex items-center justify-between gap-6 px-6 py-4 rounded-full border border-[var(--color-paper)]/25 hover:border-[var(--color-paper)] transition-colors group"
            >
              <span className="font-medium text-[15px]">Talk integration</span>
              <Arrow className="ml-2" />
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
