import { useState } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { LoginArea } from "@/components/auth/LoginArea";
import { EventsList } from "@/components/EventsList";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Server, FileText, Users, Settings } from "lucide-react";

export function RelayManager() {
  const { user } = useCurrentUser();
  const [relayUrl, setRelayUrl] = useState("wss://relay.damus.io");

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Nostr Relay Manager</CardTitle>
            <CardDescription>
              Manage your Nostr relay with NIP-86 moderation tools. Sign in with your Nostr keys to get started.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <LoginArea className="w-full" />
            </div>
            <div className="text-xs text-muted-foreground text-center">
              Requires a NIP-07 compatible browser extension like Alby, nos2x, or Flamingo.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Server className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Nostr Relay Manager</h1>
                <p className="text-sm text-muted-foreground">NIP-86 Moderation Tools</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="font-mono text-xs">
                {relayUrl.replace('wss://', '')}
              </Badge>
              <LoginArea className="max-w-60" />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Relay URL Input */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Server className="h-5 w-5" />
              <span>Relay Connection</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex space-x-2">
                <div className="flex-1">
                  <Label htmlFor="relay-url">Relay URL</Label>
                  <Input
                    id="relay-url"
                    value={relayUrl}
                    onChange={(e) => setRelayUrl(e.target.value)}
                    placeholder="wss://your-relay.com"
                    className="mt-1"
                  />
                </div>
                <div className="flex items-end">
                  <Button>Connect</Button>
                </div>
              </div>
              
              {/* Quick relay options */}
              <div>
                <Label className="text-sm">Quick Connect:</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {[
                    "wss://relay.damus.io",
                    "wss://nos.lol", 
                    "wss://relay.nostr.band",
                    "wss://nostr.wine"
                  ].map((url) => (
                    <Button
                      key={url}
                      variant="outline"
                      size="sm"
                      onClick={() => setRelayUrl(url)}
                      className="text-xs"
                    >
                      {url.replace('wss://', '')}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs defaultValue="events" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="events" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Events & Moderation</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>User Management</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Relay Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="events">
            <EventsList relayUrl={relayUrl} />
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">User management coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardContent className="py-12 text-center">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">Relay settings coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}