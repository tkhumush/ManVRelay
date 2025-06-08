import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";

interface ConnectionStatusProps {
  relayUrl: string;
}

async function checkRelayConnection(relayUrl: string) {
  try {
    // Try to fetch relay info
    const httpUrl = relayUrl.replace(/^wss?:\/\//, 'https://');
    const response = await fetch(httpUrl, {
      headers: { 'Accept': 'application/nostr+json' },
      mode: 'cors',
    });
    
    if (response.ok) {
      return { status: 'connected', info: await response.json() };
    } else {
      return { status: 'http_error', error: `HTTP ${response.status}` };
    }
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('CORS')) {
      return { status: 'cors_error', error: 'CORS not supported' };
    }
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      return { status: 'network_error', error: 'Network error' };
    }
    return { status: 'error', error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export function ConnectionStatus({ relayUrl }: ConnectionStatusProps) {
  const { data: connectionStatus, isLoading } = useQuery({
    queryKey: ['connection-status', relayUrl],
    queryFn: () => checkRelayConnection(relayUrl),
    enabled: !!relayUrl,
    refetchInterval: 30000, // Check every 30 seconds
  });

  if (isLoading) {
    return (
      <Badge variant="secondary" className="flex items-center space-x-1">
        <Clock className="h-3 w-3 animate-spin" />
        <span>Checking...</span>
      </Badge>
    );
  }

  if (!connectionStatus) {
    return (
      <Badge variant="secondary" className="flex items-center space-x-1">
        <AlertCircle className="h-3 w-3" />
        <span>Unknown</span>
      </Badge>
    );
  }

  switch (connectionStatus.status) {
    case 'connected':
      return (
        <Badge variant="default" className="flex items-center space-x-1 bg-green-600">
          <CheckCircle className="h-3 w-3" />
          <span>Connected</span>
        </Badge>
      );
    case 'cors_error':
      return (
        <Badge variant="secondary" className="flex items-center space-x-1 bg-yellow-600">
          <AlertCircle className="h-3 w-3" />
          <span>CORS Issue</span>
        </Badge>
      );
    case 'network_error':
    case 'http_error':
    case 'error':
    default:
      return (
        <Badge variant="destructive" className="flex items-center space-x-1">
          <XCircle className="h-3 w-3" />
          <span>Error</span>
        </Badge>
      );
  }
}