import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Shield, Zap, Globe, BookOpen } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center space-y-8">
          <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            Realia
          </h1>
          <p className="text-xl md:text-2xl text-zinc-300 max-w-3xl mx-auto">
            Verify the authenticity of real-world assets through blockchain technology. 
            Create, mint, and trade verified NFTs with complete transparency.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg" className="bg-white text-black hover:bg-zinc-200">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/verify">
              <Button size="lg" variant="outline" className="border-zinc-600 text-white hover:bg-zinc-800">
                Verify Asset
              </Button>
            </Link>
            <Link href="/guide">
              <Button size="lg" variant="outline" className="border-zinc-600 text-white hover:bg-zinc-800 flex items-center">
                <BookOpen className="mr-2 h-4 w-4" />
                Guide
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center space-y-4 p-6 rounded-lg bg-zinc-800/50 border border-zinc-700">
            <Shield className="h-12 w-12 text-green-400 mx-auto" />
            <h3 className="text-xl font-semibold text-white">Verified Authenticity</h3>
            <p className="text-zinc-400">
              Every asset is thoroughly verified through our multi-step authentication process
            </p>
          </div>
          <div className="text-center space-y-4 p-6 rounded-lg bg-zinc-800/50 border border-zinc-700">
            <Zap className="h-12 w-12 text-yellow-400 mx-auto" />
            <h3 className="text-xl font-semibold text-white">Instant Minting</h3>
            <p className="text-zinc-400">
              Create and mint NFTs of your verified assets in seconds
            </p>
          </div>
          <div className="text-center space-y-4 p-6 rounded-lg bg-zinc-800/50 border border-zinc-700">
            <Globe className="h-12 w-12 text-blue-400 mx-auto" />
            <h3 className="text-xl font-semibold text-white">Global Marketplace</h3>
            <p className="text-zinc-400">
              Trade verified assets on our decentralized marketplace
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center space-y-6 bg-gradient-to-r from-zinc-800/50 to-zinc-900/50 rounded-2xl p-12 border border-zinc-700">
          <h2 className="text-4xl font-bold text-white">
            Ready to Verify Your Assets?
          </h2>
          <p className="text-xl text-zinc-300 max-w-2xl mx-auto">
            Join thousands of users who trust Realia for authentic asset verification and trading.
          </p>
          <Link href="/dashboard">
            <Button size="lg" className="bg-white text-black hover:bg-zinc-200">
              Start Your Journey
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
