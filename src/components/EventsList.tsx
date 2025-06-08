import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNostr } from "@/hooks/useNostr";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAuthor } from "@/hooks/useAuthor";
import { useToast } from "@/hooks/useToast";
import { genUserName } from "@/lib/genUserName";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  FileText, 
  MoreVertical, 
  Shield, 
  ShieldX, 
  ShieldCheck, 
  User, 
  Clock, 
  Hash, 
  RefreshCw,
  Ban,
  CheckCircle,
  Copy,
  AlertTriangle
} from "lucide-react";
import type { NostrEvent } from "@nostrify/nostrify";

interface EventsListProps {
  relayUrl: string;
}

interface EventWithModeration extends NostrEvent {
  moderationStatus?: 'pending' | 'approved' | 'banned';
  moderationReason?: string;
}

// NIP-98 HTTP Auth helper
async function createNip98Auth(url: string, method: string, payload?: string): Promise<string> {
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
  return `Nostr ${btoa(JSON.stringify(signedEvent))}`;
}

// NIP-86 Relay Management API
async function callRelayAPI(relayUrl: string, method: string, params: (string | number | undefined)[] = []) {
  const httpUrl = relayUrl.replace(/^wss?:\/\//, 'https://');
  const payload = JSON.stringify({ method, params });
  
  try {
    const authHeader = await createNip98Auth(httpUrl, 'POST', payload);
    
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
  } catch (error) {
    console.warn(`NIP-86 API call failed for ${method}:`, error);
    // Return empty array for list methods to avoid breaking the UI
    if (method.startsWith('list')) {
      return [];
    }
    throw error;
  }
}

function EventCard({ event, onModerate }: { 
  event: EventWithModeration; 
  onModerate: (eventId: string, action: 'allow' | 'ban', reason?: string) => void;
}) {
  const author = useAuthor(event.pubkey);
  const [moderationDialogOpen, setModerationDialogOpen] = useState(false);
  const [moderationAction, setModerationAction] = useState<'allow' | 'ban'>('ban');
  const [moderationReason, setModerationReason] = useState('');

  const metadata = author.data?.metadata;
  const displayName = metadata?.name || genUserName(event.pubkey);
  const profileImage = metadata?.picture;

  const handleModerate = () => {
    onModerate(event.id!, moderationAction, moderationReason.trim() || undefined);
    setModerationDialogOpen(false);
    setModerationReason('');
  };

  const getKindName = (kind: number) => {
    const kindNames: Record<number, string> = {
      0: 'Profile',
      1: 'Text Note',
      3: 'Contacts',
      4: 'DM',
      5: 'Delete',
      6: 'Repost',
      7: 'Reaction',
      1984: 'Report',
      30023: 'Article',
    };
    return kindNames[kind] || `Kind ${kind}`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const truncateContent = (content: string, maxLength: number = 200) => {
    if (content.length <= maxLength) return content;
    return content.slice(0, maxLength) + '...';
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast here
  };

  return (
    <>
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              {profileImage ? (
                <img 
                  src={profileImage} 
                  alt={displayName}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <User className="h-5 w-5 text-gray-500" />
                </div>
              )}
              <div>
                <p className="font-semibold text-sm">{displayName}</p>
                <p className="text-xs text-muted-foreground font-mono">
                  {event.pubkey.slice(0, 16)}...
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {getKindName(event.kind)}
              </Badge>
              {event.moderationStatus && (
                <Badge 
                  variant={
                    event.moderationStatus === 'approved' ? 'default' :
                    event.moderationStatus === 'banned' ? 'destructive' : 'secondary'
                  }
                  className="text-xs"
                >
                  {event.moderationStatus}
                </Badge>
              )}
              
              {/* Moderation Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setModerationDialogOpen(true)}>
                    <Shield className="h-4 w-4 mr-2" />
                    Moderate Event
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => copyToClipboard(event.id!)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Event ID
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => copyToClipboard(event.pubkey)}>
                    <User className="h-4 w-4 mr-2" />
                    Copy Pubkey
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => copyToClipboard(JSON.stringify(event, null, 2))}>
                    <Hash className="h-4 w-4 mr-2" />
                    Copy Event JSON
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {event.content && (
              <div className="text-sm">
                <p className="whitespace-pre-wrap break-words">
                  {truncateContent(event.content)}
                </p>
              </div>
            )}
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatTimestamp(event.created_at)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Hash className="h-3 w-3" />
                  <span className="font-mono">{event.id?.slice(0, 8)}...</span>
                </div>
              </div>
              {event.tags.length > 0 && (
                <span>{event.tags.length} tags</span>
              )}
            </div>

            {event.moderationReason && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Moderation reason:</strong> {event.moderationReason}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Moderation Dialog */}
      <Dialog open={moderationDialogOpen} onOpenChange={setModerationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Moderate Event</DialogTitle>
            <DialogDescription>
              Choose an action for this event. This will affect how it's handled by your relay.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Action</Label>
              <Select value={moderationAction} onValueChange={(value: 'allow' | 'ban') => setModerationAction(value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="allow">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Allow Event</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="ban">
                    <div className="flex items-center space-x-2">
                      <Ban className="h-4 w-4 text-red-600" />
                      <span>Ban Event</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="moderation-reason">Reason (optional)</Label>
              <Textarea
                id="moderation-reason"
                value={moderationReason}
                onChange={(e) => setModerationReason(e.target.value)}
                placeholder="Enter reason for this moderation action"
                className="mt-1"
              />
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm font-medium">Event Details:</p>
              <p className="text-xs text-muted-foreground mt-1">
                ID: {event.id}<br/>
                Kind: {event.kind}<br/>
                Author: {event.pubkey}<br/>
                Created: {formatTimestamp(event.created_at)}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModerationDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleModerate}
              variant={moderationAction === 'ban' ? 'destructive' : 'default'}
            >
              {moderationAction === 'allow' ? (
                <>
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Allow Event
                </>
              ) : (
                <>
                  <ShieldX className="h-4 w-4 mr-2" />
                  Ban Event
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function EventsList({ relayUrl }: EventsListProps) {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [kindFilter, setKindFilter] = useState<string>('all');
  const [limit, setLimit] = useState(20);
  const [customKind, setCustomKind] = useState('');

  // Query for recent events
  const { data: events, isLoading: loadingEvents, error: eventsError, refetch } = useQuery({
    queryKey: ['relay-events', relayUrl, kindFilter, limit, customKind],
    queryFn: async () => {
      const signal = AbortSignal.timeout(10000);
      
      const filter: { limit: number; kinds?: number[] } = { limit };
      
      if (kindFilter !== 'all') {
        if (kindFilter === 'custom' && customKind) {
          const kind = parseInt(customKind);
          if (!isNaN(kind)) {
            filter.kinds = [kind];
          }
        } else if (kindFilter !== 'custom') {
          const kinds = kindFilter.split(',').map(k => parseInt(k)).filter(k => !isNaN(k));
          if (kinds.length > 0) {
            filter.kinds = kinds;
          }
        }
      }

      const events = await nostr.query([filter], { signal });
      return events.sort((a, b) => b.created_at - a.created_at);
    },
    enabled: !!relayUrl && !!nostr,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Query for banned events to mark them
  const { data: bannedEvents } = useQuery({
    queryKey: ['banned-events', relayUrl],
    queryFn: () => callRelayAPI(relayUrl, 'listbannedevents'),
    enabled: !!relayUrl && !!user,
  });

  // Query for events needing moderation
  const { data: eventsNeedingModeration } = useQuery({
    queryKey: ['events-needing-moderation', relayUrl],
    queryFn: () => callRelayAPI(relayUrl, 'listeventsneedingmoderation'),
    enabled: !!relayUrl && !!user,
  });

  // Mutation for event moderation
  const moderateEventMutation = useMutation({
    mutationFn: ({ eventId, action, reason }: { eventId: string; action: 'allow' | 'ban'; reason?: string }) => {
      const method = action === 'allow' ? 'allowevent' : 'banevent';
      return callRelayAPI(relayUrl, method, [eventId, reason]);
    },
    onSuccess: (_, { action, eventId }) => {
      queryClient.invalidateQueries({ queryKey: ['banned-events', relayUrl] });
      queryClient.invalidateQueries({ queryKey: ['events-needing-moderation', relayUrl] });
      toast({ 
        title: `Event ${action === 'allow' ? 'approved' : 'banned'}`,
        description: `Event ${eventId.slice(0, 8)}... has been ${action === 'allow' ? 'approved' : 'banned'}.`
      });
    },
    onError: (error: Error, { action }) => {
      toast({ 
        title: `Failed to ${action} event`, 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleModerateEvent = (eventId: string, action: 'allow' | 'ban', reason?: string) => {
    moderateEventMutation.mutate({ eventId, action, reason });
  };

  // Enhance events with moderation status
  const enhancedEvents: EventWithModeration[] = events?.map(event => {
    const isBanned = bannedEvents?.some((banned: { id: string }) => banned.id === event.id);
    const needsModeration = eventsNeedingModeration?.some((pending: { id: string }) => pending.id === event.id);
    
    return {
      ...event,
      moderationStatus: isBanned ? 'banned' : needsModeration ? 'pending' : undefined,
      moderationReason: isBanned ? bannedEvents?.find((banned: { id: string; reason?: string }) => banned.id === event.id)?.reason : 
                       needsModeration ? eventsNeedingModeration?.find((pending: { id: string; reason?: string }) => pending.id === event.id)?.reason : undefined,
    };
  }) || [];

  const kindOptions = [
    { value: 'all', label: 'All Events' },
    { value: '1', label: 'Text Notes (1)' },
    { value: '0', label: 'Profiles (0)' },
    { value: '3', label: 'Contacts (3)' },
    { value: '6', label: 'Reposts (6)' },
    { value: '7', label: 'Reactions (7)' },
    { value: 'custom', label: 'Custom Kind' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Events & Moderation</h2>
          <p className="text-muted-foreground">View and moderate events using NIP-86</p>
        </div>
        <Button onClick={() => refetch()} disabled={loadingEvents}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loadingEvents ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="kind-filter">Event Kind</Label>
              <Select value={kindFilter} onValueChange={setKindFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {kindOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {kindFilter === 'custom' && (
              <div>
                <Label htmlFor="custom-kind">Custom Kind Number</Label>
                <Input
                  id="custom-kind"
                  type="number"
                  value={customKind}
                  onChange={(e) => setCustomKind(e.target.value)}
                  placeholder="Enter kind number"
                  className="mt-1"
                />
              </div>
            )}
            
            <div>
              <Label htmlFor="limit">Limit</Label>
              <Select value={limit.toString()} onValueChange={(value) => setLimit(parseInt(value))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 events</SelectItem>
                  <SelectItem value="20">20 events</SelectItem>
                  <SelectItem value="50">50 events</SelectItem>
                  <SelectItem value="100">100 events</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events List */}
      <div>
        {loadingEvents ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : eventsError ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to load events: {eventsError.message}
            </AlertDescription>
          </Alert>
        ) : !enhancedEvents || enhancedEvents.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No events found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Try adjusting your filters or check if the relay is active
              </p>
            </CardContent>
          </Card>
        ) : (
          <div>
            <div className="mb-4 text-sm text-muted-foreground">
              Showing {enhancedEvents.length} events
              {eventsNeedingModeration && eventsNeedingModeration.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {eventsNeedingModeration.length} pending moderation
                </Badge>
              )}
            </div>
            {enhancedEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onModerate={handleModerateEvent}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}