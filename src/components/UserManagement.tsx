import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/useToast";
import { UserX, UserCheck, Plus, Trash2, Users } from "lucide-react";

interface UserManagementProps {
  relayUrl: string;
}

interface BannedUser {
  pubkey: string;
  reason?: string;
}

interface AllowedUser {
  pubkey: string;
  reason?: string;
}

// Helper function to create NIP-98 auth header
async function createAuthHeader(url: string, method: string, payload?: string) {
  if (!window.nostr) {
    throw new Error("NIP-07 extension not found");
  }

  const event = {
    kind: 27235,
    content: "",
    tags: [
      ["u", url],
      ["method", method],
    ],
    created_at: Math.floor(Date.now() / 1000),
  };

  if (payload) {
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload));
    const hashHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
    event.tags.push(["payload", hashHex]);
  }

  const signedEvent = await window.nostr.signEvent(event);
  return `Nostr ${btoa(JSON.stringify(signedEvent))}` as string;
}

// API functions for relay management
async function callRelayAPI(relayUrl: string, method: string, params: (string | number | undefined)[] = []) {
  const httpUrl = relayUrl.replace(/^wss?:\/\//, 'https://');
  const payload = JSON.stringify({ method, params });
  
  const authHeader = await createAuthHeader(httpUrl, 'POST', payload);
  
  const response = await fetch(httpUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/nostr+json+rpc',
      'Authorization': authHeader,
    },
    body: payload,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const result = await response.json();
  if (result.error) {
    throw new Error(result.error);
  }

  return result.result;
}

export function UserManagement({ relayUrl }: UserManagementProps) {
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newPubkey, setNewPubkey] = useState("");
  const [newReason, setNewReason] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'ban' | 'allow'>('ban');

  // Query for banned users
  const { data: bannedUsers, isLoading: loadingBanned, error: bannedError } = useQuery({
    queryKey: ['banned-users', relayUrl],
    queryFn: () => callRelayAPI(relayUrl, 'listbannedpubkeys'),
    enabled: !!relayUrl && !!user,
  });

  // Query for allowed users
  const { data: allowedUsers, isLoading: loadingAllowed, error: allowedError } = useQuery({
    queryKey: ['allowed-users', relayUrl],
    queryFn: () => callRelayAPI(relayUrl, 'listallowedpubkeys'),
    enabled: !!relayUrl && !!user,
  });

  // Mutation for banning users
  const banUserMutation = useMutation({
    mutationFn: ({ pubkey, reason }: { pubkey: string; reason?: string }) =>
      callRelayAPI(relayUrl, 'banpubkey', [pubkey, reason]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banned-users', relayUrl] });
      toast({ title: "User banned successfully" });
      setIsAddDialogOpen(false);
      setNewPubkey("");
      setNewReason("");
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to ban user", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Mutation for allowing users
  const allowUserMutation = useMutation({
    mutationFn: ({ pubkey, reason }: { pubkey: string; reason?: string }) =>
      callRelayAPI(relayUrl, 'allowpubkey', [pubkey, reason]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allowed-users', relayUrl] });
      toast({ title: "User allowed successfully" });
      setIsAddDialogOpen(false);
      setNewPubkey("");
      setNewReason("");
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to allow user", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleAddUser = () => {
    if (!newPubkey.trim()) {
      toast({ 
        title: "Invalid input", 
        description: "Please enter a valid pubkey",
        variant: "destructive" 
      });
      return;
    }

    if (actionType === 'ban') {
      banUserMutation.mutate({ pubkey: newPubkey.trim(), reason: newReason.trim() || undefined });
    } else {
      allowUserMutation.mutate({ pubkey: newPubkey.trim(), reason: newReason.trim() || undefined });
    }
  };

  const handleRemoveUser = async (pubkey: string, type: 'ban' | 'allow') => {
    try {
      if (type === 'ban') {
        // Note: NIP-86 doesn't define an "unban" method, so we'd need to implement this
        // For now, we'll show a message that this isn't supported
        toast({ 
          title: "Not supported", 
          description: "Unbanning users is not supported by NIP-86",
          variant: "destructive" 
        });
      } else {
        // Similar issue with removing from allow list
        toast({ 
          title: "Not supported", 
          description: "Removing from allow list is not supported by NIP-86",
          variant: "destructive" 
        });
      }
    } catch (error) {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive" 
      });
    }
  };

  if (!user) {
    return (
      <Alert>
        <AlertDescription>
          Please log in to manage users.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-muted-foreground">Manage banned and allowed users on your relay</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add User</DialogTitle>
              <DialogDescription>
                Add a user to the ban list or allow list
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Action</Label>
                <div className="flex space-x-2 mt-1">
                  <Button
                    variant={actionType === 'ban' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActionType('ban')}
                  >
                    <UserX className="h-4 w-4 mr-1" />
                    Ban
                  </Button>
                  <Button
                    variant={actionType === 'allow' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActionType('allow')}
                  >
                    <UserCheck className="h-4 w-4 mr-1" />
                    Allow
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="pubkey">Public Key (hex)</Label>
                <Input
                  id="pubkey"
                  value={newPubkey}
                  onChange={(e) => setNewPubkey(e.target.value)}
                  placeholder="Enter 64-character hex pubkey"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="reason">Reason (optional)</Label>
                <Textarea
                  id="reason"
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  placeholder="Enter reason for this action"
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddUser}
                disabled={banUserMutation.isPending || allowUserMutation.isPending}
              >
                {actionType === 'ban' ? 'Ban User' : 'Allow User'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="banned" className="space-y-4">
        <TabsList>
          <TabsTrigger value="banned" className="flex items-center space-x-2">
            <UserX className="h-4 w-4" />
            <span>Banned Users</span>
          </TabsTrigger>
          <TabsTrigger value="allowed" className="flex items-center space-x-2">
            <UserCheck className="h-4 w-4" />
            <span>Allowed Users</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="banned">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserX className="h-5 w-5" />
                <span>Banned Users</span>
              </CardTitle>
              <CardDescription>
                Users who are banned from posting to this relay
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingBanned ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-64" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                      <Skeleton className="h-8 w-20" />
                    </div>
                  ))}
                </div>
              ) : bannedError ? (
                <Alert>
                  <AlertDescription>
                    Failed to load banned users: {bannedError.message}
                  </AlertDescription>
                </Alert>
              ) : !bannedUsers || bannedUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No banned users</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bannedUsers.map((user: BannedUser, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-mono text-sm">{user.pubkey}</p>
                        {user.reason && (
                          <p className="text-sm text-muted-foreground mt-1">{user.reason}</p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveUser(user.pubkey, 'ban')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="allowed">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserCheck className="h-5 w-5" />
                <span>Allowed Users</span>
              </CardTitle>
              <CardDescription>
                Users who are explicitly allowed to post to this relay
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAllowed ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-64" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                      <Skeleton className="h-8 w-20" />
                    </div>
                  ))}
                </div>
              ) : allowedError ? (
                <Alert>
                  <AlertDescription>
                    Failed to load allowed users: {allowedError.message}
                  </AlertDescription>
                </Alert>
              ) : !allowedUsers || allowedUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No explicitly allowed users</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {allowedUsers.map((user: AllowedUser, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-mono text-sm">{user.pubkey}</p>
                        {user.reason && (
                          <p className="text-sm text-muted-foreground mt-1">{user.reason}</p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveUser(user.pubkey, 'allow')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}