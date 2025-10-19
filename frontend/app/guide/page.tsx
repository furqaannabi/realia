"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { ChevronDown, Copy, Check, ExternalLink, AlertTriangle, Sparkles, KeyRound } from "lucide-react"

// --- STEP DATA ---
interface Step {
  id: string
  title: string
  image?: string
  description: string
}

const steps: Step[] = [
  {
    id: "step1",
    title: "Create an Agentverse Account",
    description:
      "Visit agentverse.ai and sign up with your email. Verify your email and complete your profile setup.",
  },
  {
    id: "step2",
    title: "Create a New Agent",
    image: "agentverse/2.png",
    description: "Click 'Create Agent' from the dashboard, give your agent a name.",
  },
  {
    id: "step3",
    title: "Select the Blank Agent Template",
    image: "agentverse/3.png",
    description: "Choose the 'Blank' agent template to start building your agent from scratch.",
  },
  {
    id: "step4",
    title: "Go to Build Tab & Copy Required Files",
    image: "agentverse/4.png",
    description:
      "In the build tab, copy the <strong>agent.py</strong> and <strong>.env</strong> files from the provided GitHub repositories. Make sure to follow the instructions in the repository README for configuration.",
  },
  {
    id: "step5",
    title: "Start Your Agent",
    image: "agentverse/5.png",
    description:
      "Launch your agent and watch it operate! Click the <strong>Start Agent</strong> button in the dashboard. Your agent will now begin handling the tasks you've configured.",
  },
]

// --- GITHUB REPOS LIST ---
const githubRepos = [
  {
    name: "agentverse/agent.py repository",
    url: "https://github.com/furqaannabi/realia/blob/main/agent/agent.py"
  },
  {
    name: "agentverse/.env example repository",
    url: "https://github.com/furqaannabi/realia/blob/main/agent/.env.sample"
  }
]

// --- ENV KEYS SUBSTEPS DATA ---
const envPlatforms = [
  {
    key: "wallet-seed",
    name: "WALLET_SEED",
    icon: <KeyRound className="size-5 text-yellow-600" />,
    steps: [
      {
        description: `In MetaMask, click your profile icon (top right), then go to <b>Settings</b> &rarr; <b>Security & Privacy</b> &rarr; <b>Reveal Secret Recovery Phrase</b>. (Or similar path in your chosen wallet tool.)`,
        image: "agentverse/metamask_seed/1.png"
      },
      {
        description: `Securely store the <b>12- or 24-word Secret Recovery Phrase</b> displayed. <span class="text-yellow-800 dark:text-yellow-200">Never share this phrase with anyone!</span>`,
        image: "agentverse/metamask_seed/2.png"
      },
      {
        description: `Paste your seed phrase into your <code>.env</code> file as the value for <code>WALLET_SEED</code>.`,
        image: "agentverse/metamask_seed/3.png"
      }
    ]
  },
  {
    key: "wallet-private-key",
    name: "WALLET_PRIVATE_KEY",
    icon: <KeyRound className="size-5 text-orange-600" />,
    steps: [
      {
        description: `For MetaMask: Click the three bars (<b>menu icon</b>), then <b>Account details</b> &rarr; <b>Export Private Key</b>. <br />Only do this if you fully understand the risks—keep it confidential!`,
        image: "agentverse/metamask_private_key/1.png"
      },
      {
        description: `Copy your private key. <b>Keep it safe and never share it.</b>`,
        image: "agentverse/metamask_private_key/2.png"
      },
      {
        description: `Paste your private key into your <code>.env</code> file as the value for <code>WALLET_PRIVATE_KEY</code>.`,
        image: "agentverse/metamask_private_key/3.png"
      }
    ]
  },
  {
    key: "alchemy",
    name: "ALCHEMY_API_KEY ",
    icon: <KeyRound className="size-5 text-blue-600" />,
    steps: [
      {
        description: `Go to <a href="https://dashboard.alchemy.com" target="_blank" rel="noopener noreferrer" class="underline text-blue-700 dark:text-blue-200 flex items-center gap-1">dashboard.alchemy.com<ExternalLink class="inline size-3 align-text-bottom" /></a> and sign up or log in.`,
        image: "agentverse/alchemy/1.png"
      },
      {
        description: `Click <strong>"Create App"</strong>, then select your desired network (e.g., Ethereum, Arbitrum, or Polygon).`,
        image: "agentverse/alchemy/2.png"
      },
      {
        description: `In your app settings, copy the <b>HTTP API Key</b>. Paste it in your <code>.env</code> file as <code>ALCHEMY_API_KEY</code>.`,
        image: "agentverse/alchemy/3.png"
      }
    ]
  },
  {
    key: "qdrant",
    name: "QDRANT_API_KEY & QDRANT_BASE_URL ",
    icon: <KeyRound className="size-5 text-green-700" />,
    steps: [
      {
        description: `Go to <a href="https://cloud.qdrant.io" target="_blank" rel="noopener noreferrer" class="underline text-blue-700 dark:text-blue-200 flex items-center gap-1">cloud.qdrant.io<ExternalLink class="inline size-3 align-text-bottom" /></a> and sign up or log in.`,
        image: "agentverse/qdrant/1.png"
      },
      {
        description: `Create a cluster or select an existing one from the dashboard.`,
        image: "agentverse/qdrant/2.png"
      },
      {
        description: `In your cluster overview, copy the <b>API Key</b> <i>(for <code>QDRANT_API_KEY</code>)</i> and <b>Endpoint URL</b> <i>(for <code>QDRANT_BASE_URL</code>)</i>.`,
        image: "agentverse/qdrant/3.png"
      },
      {
        description: `Find your <b>QDRANT_BASE_URL</b> in your cluster's details and copy it.<br />`,
        image: "agentverse/qdrant/4.png"
      }
    ]
  }
]

// --- ENV EXAMPLE ---
const envConfigExample = `# ────────────── Agentverse .env Example ──────────────

# Core Service Endpoints – No need to change these unless instructed
EMBEDDING_URL=https://embedding.furqaannabi.com/get_image_embedding
REALIA_FACTORY_CONTRACT_ADDRESS=0xFD82a430CFdE70A1746346a822AB9a2c8857D7A7
REALIA_NFT_CONTRACT_ADDRESS=0x26C6b15F92129a81C0BdEFC8998204Ed946E2Ecf

# ─────── WALLET CONFIGURATION ───────

# WALLET_SEED: (Required, mnemonic phrase for your agent's wallet. Provide either this or WALLET_PRIVATE_KEY.)
WALLET_SEED=

# WALLET_PRIVATE_KEY: (Required if not using WALLET_SEED. Private key for your agent's wallet.)
WALLET_PRIVATE_KEY=

# ─────── AGENTVERSE CONNECTIONS ───────

# ALCHEMY_API_KEY: (Required) Blockchain access key, get at https://dashboard.alchemy.com
ALCHEMY_API_KEY=

# QDRANT_API_KEY: (Required) For vector DB (obtain from Qdrant Cloud)
QDRANT_API_KEY=

# QDRANT_BASE_URL: (Required) Your Qdrant instance URL (eg. https://YOUR-CLOUD-URL)
QDRANT_BASE_URL=
`

// --- RENDERED .env BLOCK ---
function EnvBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="relative max-w-2xl mx-auto">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-3 z-10 px-2 py-1 bg-neutral-900 rounded-md hover:bg-neutral-800 transition text-xs text-white/80 flex items-center gap-1"
        title="Copy code"
      >
        {copied ? (<Check className="size-4 text-green-400" />) : (<Copy className="size-4"/>)}
        {copied ? "Copied" : "Copy"}
      </button>
      <div className="bg-black rounded-xl border border-white/10 overflow-x-auto p-6 shadow-md">
        <pre className="text-[13px] xl:text-sm font-mono text-white/90 whitespace-pre">{code}</pre>
      </div>
    </div>
  )
}

// Steps state
type ExpandedStepsState = Record<string, boolean>
type ExpandedEnvSubSteps = Record<string, boolean>

// --- Github Instruction Box ---
function GithubInstructionBox() {
  return (
    <div className="mt-6 mb-2 bg-blue-50/60 dark:bg-blue-900/20 border border-blue-400 dark:border-blue-600 rounded-xl p-5 flex flex-col gap-2">
      <span className="font-medium flex items-center gap-1 text-blue-900 dark:text-blue-300">
        <ExternalLink className="size-4 mr-1 text-blue-500" />
        Required files for local agent:
      </span>
      <ul className="list-inside list-disc space-y-1 ml-2">
        {githubRepos.map(repo => (
          <li key={repo.url}>
            <a
              href={repo.url}
              className="text-blue-700 dark:text-blue-200 hover:underline inline-flex items-center gap-1"
              target="_blank"
              rel="noopener noreferrer"
            >
              {repo.name}
              <ExternalLink className="size-3 inline ml-0.5 align-text-bottom" />
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-muted-foreground">
        Make sure to follow the README instructions in each repository for correct setup and configuration.
      </p>
    </div>
  )
}

// --- ENV KEYS BEAUTIFUL SUBSTEPS ---
function EnvKeysGuide() {
  const [expanded, setExpanded] = useState<ExpandedEnvSubSteps>({});
  return (
    <div className="mb-8 mt-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        viewport={{ once: true }}
        className="rounded-2xl bg-gradient-to-tr from-blue-100/60 via-blue-50/40 to-white/40 dark:from-blue-900/30 dark:via-neutral-900/50 dark:to-neutral-900/30 border border-blue-300 dark:border-blue-700 px-4 py-6"
      >
        <div className="flex items-center gap-2 mb-2">
          <KeyRound className="text-blue-600 dark:text-blue-200 size-5" />
          <span className="font-semibold text-blue-800 dark:text-blue-100 text-lg">Get Your .env Keys (All Required)</span>
        </div>
        <p className="text-muted-foreground mb-4 text-sm max-w-2xl">
          <b className="text-red-700 dark:text-red-300">All environment variables below are required.</b> Your agent will not work without configuring each one.
        </p>
        <div className="space-y-3">
          {envPlatforms.map(platform => (
            <div
              key={platform.key}
              className="rounded-xl bg-white/70 dark:bg-blue-950/30 shadow border border-white/20"
            >
              <button
                onClick={() => setExpanded(e => ({ ...e, [platform.key]: !e[platform.key] }))}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-blue-50/40 dark:hover:bg-blue-900/30 transition rounded-xl"
                aria-expanded={!!expanded[platform.key]}
              >
                <span className="flex items-center gap-2 text-blue-900 dark:text-blue-100 font-medium text-base">
                  {platform.icon} {platform.name}
                </span>
                <ChevronDown
                  className={`size-5 text-blue-500 transition-transform ${expanded[platform.key] ? "rotate-180" : ""}`}
                />
              </button>
              <motion.div
                initial={false}
                animate={expanded[platform.key] ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                {expanded[platform.key] && (
                  <ol className="divide-y divide-blue-100 dark:divide-blue-800 px-5 pb-4 pt-2 space-y-0.5">
                    {platform.steps.map((s, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 py-3"
                      >
                        <div className="flex-shrink-0">
                          <span className="inline-flex items-center justify-center rounded-full bg-blue-600 dark:bg-blue-800 text-white size-7 font-bold text-xs">{i + 1}</span>
                        </div>
                        <div className="flex-1">
                          <div
                            className="text-blue-950 dark:text-blue-200 text-sm"
                            dangerouslySetInnerHTML={{
                              __html: s.description
                            }}
                          />
                          {s.image && (
                            <div className="mt-3 mb-1 w-full rounded-lg overflow-hidden border border-blue-200 dark:border-blue-800 shadow-inner max-w-xl">
                              <AspectRatio ratio={16 / 9}>
                                <img
                                  src={s.image}
                                  alt={(platform.name || "") + ` step ${i + 1}`}
                                  className="w-full h-full object-contain" 
                                />
                              </AspectRatio>
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </motion.div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

// --- PYUSD Wallet Tip for Step 5 ---
function PyusdWalletTip() {
  return (
    <div className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-400 dark:border-yellow-600 rounded-xl px-4 py-3 mb-5">
      <AlertTriangle className="text-yellow-500 dark:text-yellow-200 size-5 flex-shrink-0" />
      <span className="font-semibold text-yellow-800 dark:text-yellow-100">
        <b>Important:</b> Before starting your agent, make sure your wallet has a minimum balance of{" "}
        <span className="font-bold">0.05 PYUSD and Some ETH too</span>.
      </span>
    </div>
  )
}

function PageHero() {
  return (
    <div className="mb-12">
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center pt-8 pb-8"
      >
        <span className="inline-flex items-center gap-2 px-5 py-2 mb-3 bg-gradient-to-r from-blue-500/80 via-teal-400/80 to-violet-500/80 rounded-full text-white font-semibold shadow-md text-sm">
          <Sparkles className="size-5 text-yellow-100 drop-shadow" />
          New in Web3 Automation
          <Sparkles className="size-5 text-yellow-100 drop-shadow" />
        </span>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-center bg-clip-text text-transparent bg-gradient-to-br from-white to-blue-200">
          Agentverse Quickstart Guide
        </h1>
        <p className="mt-5 text-lg md:text-xl text-muted-foreground text-center max-w-2xl">
          Everything you need to launch your first onchain AI agent. No crypto or AI knowledge required.
        </p>
      </motion.div>
    </div>
  )
}

export default function GuidePage() {
  const [expandedSteps, setExpandedSteps] = useState<ExpandedStepsState>({})

  const toggleStep = (id: string) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 md:p-12 max-w-6xl mx-auto">
        {/* New Hero Header for stronger intro */}
        <PageHero />

        {/* Old Header (kept for structure; can be removed or repurposed if preferred) */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 mb-16">
          <h1 className="text-5xl md:text-6xl font-bold">Agentverse Guide</h1>
          <p className="text-xl text-muted-foreground max-w-3xl">
            Learn how to create, deploy, and manage intelligent agents on Agentverse. Follow these simple steps to get started.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="space-y-6">
          {steps.map((step, idx) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="border border-white/10 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => toggleStep(step.id)}
                className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors text-left"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center font-bold text-lg">
                    {idx + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{step.title}</h3>
                    <p
                      className="text-muted-foreground text-sm mt-1"
                      dangerouslySetInnerHTML={{ __html: step.description }}
                    />
                  </div>
                </div>
                <ChevronDown
                  className={`size-5 text-muted-foreground transition-transform flex-shrink-0 ${
                    expandedSteps[step.id] ? "rotate-180" : ""
                  }`}
                />
              </button>
              {/* Expanded step content */}
              {expandedSteps[step.id] && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border-t border-white/10 p-8 bg-white/5"
                >
                  {/* Show image for all steps except step1 */}
                  {"image" in step && step.image ? (
                    <div className="rounded-xl overflow-hidden border border-white/10 mb-6">
                      <AspectRatio ratio={16 / 9}>
                        <img
                          src={step.image || "/placeholder.svg"}
                          alt={step.title}
                          className="w-full h-full object-cover"
                        />
                      </AspectRatio>
                    </div>
                  ) : null}
                  {/* After step4, show the little instruction box with the provided github repos and env keys guide */}
                  {step.id === "step4" && (
                    <>
                      <GithubInstructionBox />
                      <EnvKeysGuide />
                    </>
                  )}
                  {/* On step5, show the PYUSD wallet tip */}
                  {step.id === "step5" && <PyusdWalletTip />}
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

       
        {/* FAQ */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-20 space-y-6"
        >
          <h2 className="text-3xl font-bold">FAQ</h2>
          <div className="space-y-4">
            {[
              
              {
                q: "How much does it cost?",
                a: "Agentverse offers a free tier. Premium plans available for production deployments.",
              },
              {
                q: "Can I deploy multiple agents?",
                a: "Yes, you can create and deploy unlimited agents independently.",
              },
              {
                q: "How do I monitor performance?",
                a: "The dashboard provides real-time monitoring with logs and performance metrics.",
              },
              {
                q: "Are all .env variables required?",
                a: "Yes. To ensure your agent works properly, you must provide values for every listed .env variable.",
              },
            ].map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="p-6 rounded-xl border border-white/10 bg-white/5 space-y-2"
              >
                <h3 className="font-bold">{faq.q}</h3>
                <p className="text-muted-foreground text-sm">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 p-10 rounded-xl border border-white/10 bg-white/5 text-center space-y-4"
        >
          <h3 className="text-2xl font-bold">Ready to Build?</h3>
          <p className="text-muted-foreground">Visit Agentverse and start creating intelligent agents today.</p>
          <a
            href="https://agentverse.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 py-3 bg-white text-black rounded-lg hover:bg-white/90 transition font-bold"
          >
            Go to Agentverse
          </a>
        </motion.div>
      </div>
    </div>
  )
}
