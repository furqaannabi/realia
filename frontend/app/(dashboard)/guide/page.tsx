"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { ChevronDown, Copy, Check, ExternalLink, AlertTriangle } from "lucide-react"

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

// --- ENV EXAMPLE ---
const envConfigExample = `# ────────────── Agentverse .env Example ──────────────

# Core Service Endpoints – No need to change these unless instructed
EMBEDDING_URL=https://embedding.furqaannabi.com/get_image_embedding
REALIA_FACTORY_CONTRACT_ADDRESS=0xFD82a430CFdE70A1746346a822AB9a2c8857D7A7
REALIA_NFT_CONTRACT_ADDRESS=0x26C6b15F92129a81C0BdEFC8998204Ed946E2Ecf

# ─────── WALLET CONFIGURATION ───────

# WALLET_SEED: (Recommended) Mnemonic seed phrase for your agent's wallet (leave blank if using WALLET_PRIVATE_KEY)
WALLET_SEED=

# WALLET_PRIVATE_KEY: Private key for your agent's wallet (used if WALLET_SEED is empty)
WALLET_PRIVATE_KEY=

# ─────── AGENTVERSE CONNECTIONS ───────

# ALCHEMY_API_KEY: Get your key at https://dashboard.alchemy.com (for blockchain access)
ALCHEMY_API_KEY=

# QDRANT_API_KEY: For vector DB (obtain from Qdrant Cloud, or leave empty for local no-auth)
QDRANT_API_KEY=

# QDRANT_BASE_URL: Your Qdrant instance (eg. https://YOUR-CLOUD-URL or http://localhost:6333)
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

// --- PYUSD Wallet Tip for Step 5 ---
function PyusdWalletTip() {
  return (
    <div className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-400 dark:border-yellow-600 rounded-xl px-4 py-3 mb-5">
      <AlertTriangle className="text-yellow-500 dark:text-yellow-200 size-5 flex-shrink-0" />
      <span className="font-semibold text-yellow-800 dark:text-yellow-100">
        <b>Important:</b> Before starting your agent, make sure your wallet has a minimum balance of{" "}
        <span className="font-bold">0.05 PYUSD</span>.
      </span>
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
        {/* Header */}
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
                  {/* After step4, show the little instruction box with the provided github repos */}
                  {step.id === "step4" && <GithubInstructionBox />}
                  {/* On step5, show the PYUSD wallet tip */}
                  {step.id === "step5" && <PyusdWalletTip />}
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* ENV CONFIG EXAMPLE */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-20 space-y-6"
        >
          <div>
            <h2 className="text-3xl font-bold mb-2">Environment Configuration (.env)</h2>
            <p className="text-muted-foreground">
              Configure your agent by setting the following variables in your <b>.env</b> file.
              <br />
              <span className="text-xs text-white/70">Best practice: copy the sample below as <code>.env</code> in your agent directory.</span>
            </p>
          </div>
          <EnvBlock code={envConfigExample} />
        </motion.section>

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
                q: "Do I need to code?",
                a: "No, Agentverse has a visual builder. JavaScript knowledge is optional for advanced customization.",
              },
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
