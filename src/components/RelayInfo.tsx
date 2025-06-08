import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExternalLink, Globe, Mail, Shield, Zap, Clock, Users, FileText } from "lucide-react";

interface RelayInfoProps {
  relayUrl: string;
}

interface RelayInfoData {
  name?: string;
  description?: string;
  banner?: string;
  icon?: string;
  pubkey?: string;
  contact?: string;
  supported_nips?: number[];
  software?: string;
  version?: string;
  privacy_policy?: string;
  terms_of_service?: string;
  relay_countries?: string[];
  language_tags?: string[];
  tags?: string[];
  posting_policy?: string;
  payments_url?: string;
  fees?: {
    admission?: Array<{ amount: number; unit: string }>;
    subscription?: Array<{ amount: number; unit: string; period?: number }>;
    publication?: Array<{ kinds?: number[]; amount: number; unit: string }>;
  };
  limitation?: {
    max_message_length?: number;
    max_subscriptions?: number;
    max_limit?: number;
    max_subid_length?: number;
    max_event_tags?: number;
    max_content_length?: number;
    min_pow_difficulty?: number;
    auth_required?: boolean;
    payment_required?: boolean;
    restricted_writes?: boolean;
    created_at_lower_limit?: number;
    created_at_upper_limit?: number;
    default_limit?: number;
  };
  retention?: Array<{
    kinds?: number[] | Array<[number, number]>;
    time?: number;
    count?: number;
  }>;
}

async function fetchRelayInfo(relayUrl: string): Promise<RelayInfoData> {
  // Convert WebSocket URL to HTTP URL
  const httpUrl = relayUrl.replace(/^wss?:\/\//, 'https://');
  
  try {
    const response = await fetch(httpUrl, {
      headers: {
        'Accept': 'application/nostr+json',
      },
      mode: 'cors',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('CORS')) {
      throw new Error('CORS error: This relay does not allow cross-origin requests. Try connecting directly to the relay or use a relay that supports CORS.');
    }
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('Network error: Unable to connect to the relay. Check the URL and your internet connection.');
    }
    throw error;
  }
}

export function RelayInfo({ relayUrl }: RelayInfoProps) {
  const { data: relayInfo, isLoading, error } = useQuery({
    queryKey: ['relay-info', relayUrl],
    queryFn: () => fetchRelayInfo(relayUrl),
    enabled: !!relayUrl,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Alert>
        <AlertDescription>
          Failed to load relay information. Make sure the relay URL is correct and supports NIP-11.
        </AlertDescription>
      </Alert>
    );
  }

  if (!relayInfo) {
    return (
      <Alert>
        <AlertDescription>
          No relay information available.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start space-x-4">
            {relayInfo.icon && (
              <img 
                src={relayInfo.icon} 
                alt="Relay icon" 
                className="w-16 h-16 rounded-lg object-cover"
              />
            )}
            <div className="flex-1">
              <CardTitle className="text-2xl">{relayInfo.name || 'Unnamed Relay'}</CardTitle>
              <CardDescription className="mt-2">
                {relayInfo.description || 'No description available'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {relayInfo.banner && (
            <img 
              src={relayInfo.banner} 
              alt="Relay banner" 
              className="w-full h-48 rounded-lg object-cover"
            />
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {relayInfo.software && (
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Software:</span>
                <a 
                  href={relayInfo.software} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center space-x-1"
                >
                  <span>{relayInfo.software}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
            
            {relayInfo.version && (
              <div className="flex items-center space-x-2">
                <span className="text-sm">Version:</span>
                <Badge variant="outline">{relayInfo.version}</Badge>
              </div>
            )}
            
            {relayInfo.contact && (
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Contact:</span>
                <span className="text-sm font-mono">{relayInfo.contact}</span>
              </div>
            )}
            
            {relayInfo.pubkey && (
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Admin Pubkey:</span>
                <span className="text-sm font-mono">{relayInfo.pubkey.slice(0, 16)}...</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Supported NIPs */}
      {relayInfo.supported_nips && relayInfo.supported_nips.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Supported NIPs</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {relayInfo.supported_nips.map((nip) => (
                <Badge key={nip} variant="secondary">
                  NIP-{nip.toString().padStart(2, '0')}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Limitations */}
      {relayInfo.limitation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Server Limitations</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {relayInfo.limitation.max_message_length && (
                <div>
                  <span className="text-sm font-medium">Max Message Length</span>
                  <p className="text-sm text-muted-foreground">{relayInfo.limitation.max_message_length.toLocaleString()} bytes</p>
                </div>
              )}
              {relayInfo.limitation.max_subscriptions && (
                <div>
                  <span className="text-sm font-medium">Max Subscriptions</span>
                  <p className="text-sm text-muted-foreground">{relayInfo.limitation.max_subscriptions}</p>
                </div>
              )}
              {relayInfo.limitation.max_limit && (
                <div>
                  <span className="text-sm font-medium">Max Query Limit</span>
                  <p className="text-sm text-muted-foreground">{relayInfo.limitation.max_limit}</p>
                </div>
              )}
              {relayInfo.limitation.max_event_tags && (
                <div>
                  <span className="text-sm font-medium">Max Event Tags</span>
                  <p className="text-sm text-muted-foreground">{relayInfo.limitation.max_event_tags}</p>
                </div>
              )}
              {relayInfo.limitation.min_pow_difficulty && (
                <div>
                  <span className="text-sm font-medium">Min PoW Difficulty</span>
                  <p className="text-sm text-muted-foreground">{relayInfo.limitation.min_pow_difficulty}</p>
                </div>
              )}
              <div>
                <span className="text-sm font-medium">Auth Required</span>
                <p className="text-sm text-muted-foreground">
                  {relayInfo.limitation.auth_required ? 'Yes' : 'No'}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium">Payment Required</span>
                <p className="text-sm text-muted-foreground">
                  {relayInfo.limitation.payment_required ? 'Yes' : 'No'}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium">Restricted Writes</span>
                <p className="text-sm text-muted-foreground">
                  {relayInfo.limitation.restricted_writes ? 'Yes' : 'No'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fees */}
      {relayInfo.fees && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>Fee Schedule</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {relayInfo.fees.admission && (
              <div>
                <h4 className="font-medium mb-2">Admission</h4>
                <div className="space-y-1">
                  {relayInfo.fees.admission.map((fee, index) => (
                    <Badge key={index} variant="outline">
                      {fee.amount.toLocaleString()} {fee.unit}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {relayInfo.fees.subscription && (
              <div>
                <h4 className="font-medium mb-2">Subscription</h4>
                <div className="space-y-1">
                  {relayInfo.fees.subscription.map((fee, index) => (
                    <Badge key={index} variant="outline">
                      {fee.amount.toLocaleString()} {fee.unit}
                      {fee.period && ` / ${Math.floor(fee.period / 86400)} days`}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {relayInfo.fees.publication && (
              <div>
                <h4 className="font-medium mb-2">Publication</h4>
                <div className="space-y-1">
                  {relayInfo.fees.publication.map((fee, index) => (
                    <Badge key={index} variant="outline">
                      {fee.amount.toLocaleString()} {fee.unit}
                      {fee.kinds && ` (kinds: ${fee.kinds.join(', ')})`}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {relayInfo.payments_url && (
              <div className="pt-2">
                <a 
                  href={relayInfo.payments_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center space-x-1"
                >
                  <span>Payment Portal</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Policies */}
      {(relayInfo.privacy_policy || relayInfo.terms_of_service || relayInfo.posting_policy) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Policies</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {relayInfo.privacy_policy && (
              <a 
                href={relayInfo.privacy_policy} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center space-x-1"
              >
                <span>Privacy Policy</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {relayInfo.terms_of_service && (
              <a 
                href={relayInfo.terms_of_service} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center space-x-1"
              >
                <span>Terms of Service</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {relayInfo.posting_policy && (
              <a 
                href={relayInfo.posting_policy} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center space-x-1"
              >
                <span>Posting Policy</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </CardContent>
        </Card>
      )}

      {/* Community Info */}
      {(relayInfo.relay_countries || relayInfo.language_tags || relayInfo.tags) && (
        <Card>
          <CardHeader>
            <CardTitle>Community</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {relayInfo.relay_countries && (
              <div>
                <span className="text-sm font-medium">Countries:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {relayInfo.relay_countries.map((country) => (
                    <Badge key={country} variant="outline">{country}</Badge>
                  ))}
                </div>
              </div>
            )}
            {relayInfo.language_tags && (
              <div>
                <span className="text-sm font-medium">Languages:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {relayInfo.language_tags.map((lang) => (
                    <Badge key={lang} variant="outline">{lang}</Badge>
                  ))}
                </div>
              </div>
            )}
            {relayInfo.tags && relayInfo.tags.length > 0 && (
              <div>
                <span className="text-sm font-medium">Tags:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {relayInfo.tags.map((tag) => (
                    <Badge key={tag} variant="outline">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}