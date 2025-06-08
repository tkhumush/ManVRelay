import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, AlertTriangle, Info, CheckCircle, ExternalLink } from "lucide-react";
import { useState } from "react";

export function TroubleshootingHelp() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Info className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-blue-800 dark:text-blue-200">
                  Troubleshooting & Help
                </CardTitle>
              </div>
              <Button variant="ghost" size="sm">
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </Button>
            </div>
            <CardDescription className="text-blue-700 dark:text-blue-300">
              Common issues and solutions for relay management
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Common Issues */}
            <div>
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">Common Issues</h4>
              <div className="space-y-3">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>CORS Errors:</strong> Many relays don't support cross-origin requests. 
                    This is normal and doesn't affect the relay's functionality - only the web dashboard's ability to fetch info.
                  </AlertDescription>
                </Alert>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Management Features Not Working:</strong> NIP-86 management API is only supported by some relays. 
                    You need to be the relay operator and your relay must implement NIP-86.
                  </AlertDescription>
                </Alert>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Authentication Failed:</strong> Make sure you have a NIP-07 browser extension installed 
                    and your pubkey is authorized to manage the relay.
                  </AlertDescription>
                </Alert>
              </div>
            </div>

            {/* What Works */}
            <div>
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">What Should Work</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Viewing events from any public relay</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Basic relay information (if NIP-11 supported)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">NIP-07 authentication with browser extensions</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Event filtering and real-time updates</span>
                </div>
              </div>
            </div>

            {/* Relay Requirements */}
            <div>
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">For Full Management Features</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">NIP-11</Badge>
                  <span className="text-sm">Relay information document</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">NIP-86</Badge>
                  <span className="text-sm">Relay management API</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">CORS</Badge>
                  <span className="text-sm">Cross-origin resource sharing headers</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">Auth</Badge>
                  <span className="text-sm">Your pubkey must be authorized as relay admin</span>
                </div>
              </div>
            </div>

            {/* Recommended Relays */}
            <div>
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">Recommended Test Relays</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>relay.damus.io</strong> - Popular, reliable, good for testing events
                </div>
                <div>
                  <strong>nos.lol</strong> - Community relay with good uptime
                </div>
                <div>
                  <strong>relay.nostr.band</strong> - Feature-rich with good NIP support
                </div>
              </div>
            </div>

            {/* Browser Extensions */}
            <div>
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">Recommended Browser Extensions</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm"><strong>Alby</strong> - Most popular, feature-rich</span>
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://getalby.com/" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Install
                    </a>
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm"><strong>nos2x</strong> - Lightweight, simple</span>
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://github.com/fiatjaf/nos2x" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Install
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}