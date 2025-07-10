// src/components/Footer.tsx
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Github, Mail, FileText } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-4 gap-8">
              {/* Company Info */}
              <div>
                <h3 className="font-semibold mb-3">Quantum Portfolio</h3>
                <p className="text-sm text-muted-foreground">
                  Advanced portfolio optimization using quantum computing technology.
                </p>
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="font-semibold mb-3">Quick Links</h4>
                <div className="space-y-2">
                  <Link href="/" className="block text-sm text-muted-foreground hover:text-foreground">
                    Home
                  </Link>
                  <Link href="/portfolio" className="block text-sm text-muted-foreground hover:text-foreground">
                    Portfolio
                  </Link>
                  <Link href="/results" className="block text-sm text-muted-foreground hover:text-foreground">
                    Results
                  </Link>
                </div>
              </div>

              {/* Resources */}
              <div>
                <h4 className="font-semibold mb-3">Resources</h4>
                <div className="space-y-2">
                  <Link href="/docs" className="block text-sm text-muted-foreground hover:text-foreground">
                    Documentation
                  </Link>
                  <Link href="/api" className="block text-sm text-muted-foreground hover:text-foreground">
                    API Reference
                  </Link>
                  <Link href="/support" className="block text-sm text-muted-foreground hover:text-foreground">
                    Support
                  </Link>
                </div>
              </div>

              {/* Contact */}
              <div>
                <h4 className="font-semibold mb-3">Connect</h4>
                <div className="flex space-x-2">
                  <Button variant="outline" size="icon">
                    <Github className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Mail className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <FileText className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
              <p>&copy; 2025 Quantum Portfolio Optimizer. All rights reserved.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </footer>
  )
}