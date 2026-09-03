'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, CheckCircle2, AlertCircle, Unlink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useTelegramStatus,
  useCreateTelegramLink,
  useUnlinkTelegram,
} from '@/features/account/hooks/use-telegram';
import { toast } from '@/lib/toast';
import { useLanguage } from '@/lib/i18n/language-provider';

function formatDate(dateString?: string | null, locale = 'en'): string {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleDateString(locale === 'am' ? 'am-ET' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function TelegramConnectedCard() {
  const { locale } = useLanguage();
  const { data: status, isLoading, isError, refetch } = useTelegramStatus();
  const createLinkMutation = useCreateTelegramLink();
  const unlinkMutation = useUnlinkTelegram();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const wasConnectedRef = useRef<boolean | undefined>(undefined);

  const isAmharic = locale === 'am';

  useEffect(() => {
    if (status?.connected && wasConnectedRef.current === false) {
      toast.success(
        isAmharic ? 'የቴሌግራም መለያዎ በስኬት ተገናኝቷል!' : 'Telegram Connected Successfully!',
        isAmharic
          ? 'የቴሌግራም መለያዎ ከአካዳሚ መለያዎ ጋር በስኬት ተገናኝቷል።'
          : 'Your Telegram account is now connected to your academy profile.',
      );
    }
    if (status !== undefined) {
      wasConnectedRef.current = Boolean(status.connected);
    }
  }, [status?.connected, isAmharic]);

  const handleConnect = async () => {
    if (createLinkMutation.isPending || isRedirecting) return;
    setIsRedirecting(true);
    try {
      const result = await createLinkMutation.mutateAsync();
      if (result.alreadyLinked) {
        toast.info(
          isAmharic ? 'ቴሌግራም መለያዎ አስቀድሞ ተገናኝቷል።' : 'Telegram Already Connected',
          isAmharic
            ? 'የቴሌግራም መለያዎ ከአካዳሚው ጋር ተገናኝቷል።'
            : 'Your Telegram account is already linked to your profile.',
        );
        void refetch();
        return;
      }

      if (result.telegramUrl) {
        toast.success(
          isAmharic ? 'ወደ ቴሌግራም ቦት በማዞር ላይ...' : 'Telegram Connection Link Ready!',
          isAmharic
            ? 'እባክዎ በቴሌግራም ውስጥ START የሚለውን በመጫን ግንኙነቱን ያጠናቅቁ።'
            : 'Opening Telegram... Click START in Telegram to finish linking.',
        );
        window.open(result.telegramUrl, '_blank', 'noopener,noreferrer');
      } else {
        toast.error(
          isAmharic ? 'የቴሌግራም ማገናኛ መፍጠር አልተቻለም።' : 'Unable to Generate Telegram Link',
          isAmharic ? 'እባክዎ ቆየት ብለው እንደገና ይሞክሩ።' : 'Please try again in a few moments.',
        );
      }
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const message = err?.response?.data?.message || err?.message || 'Connection failed';
      toast.error(isAmharic ? 'የቴሌግራም ማገናኛ መፍጠር አልተቻለም' : 'Telegram Connection Failed', message);
    } finally {
      setIsRedirecting(false);
    }
  };

  const handleUnlink = async () => {
    try {
      await unlinkMutation.mutateAsync();
      toast.success(
        isAmharic ? 'የቴሌግራም ግንኙነት ተቋርጧል' : 'Telegram Account Disconnected',
        isAmharic
          ? 'የቴሌግራም መለያዎ ከአካዳሚው በስኬት ተለያይቷል።'
          : 'Your Telegram account has been unlinked from your academy profile.',
      );
      void refetch();
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      toast.error(
        isAmharic ? 'ግንኙነቱን ማቋረጥ አልተቻለም' : 'Failed to Disconnect Telegram',
        err?.response?.data?.message || err?.message || 'Please try again.',
      );
    }
  };

  if (isLoading) {
    return (
      <Card className="h-full border-border/80">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full rounded-md" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="h-full border-border/80">
        <CardHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="size-4" />
            <CardTitle className="text-base">
              {isAmharic ? 'የቴሌግራም ሁኔታን መጫን አልተቻለም' : 'Telegram Connection Error'}
            </CardTitle>
          </div>
          <CardDescription>
            {isAmharic
              ? 'የቴሌግራም መለያ ሁኔታን ማግኘት አልተቻለም።'
              : 'Unable to check Telegram connection status.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            {isAmharic ? 'እንደገና ሞክር' : 'Retry'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isConnected = Boolean(status?.connected);
  const formattedDate = formatDate(status?.linkedAt, locale);
  const displayUsername = status?.username
    ? status.username.startsWith('@')
      ? status.username
      : `@${status.username}`
    : isAmharic
      ? 'የቴሌግራም መለያ ተገናኝቷል'
      : 'Telegram Account Connected';

  return (
    <Card className="h-full border-border/80 transition-all duration-200 hover:border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-500">
              <TelegramMark />
            </div>
            <div>
              <CardTitle className="text-base">Telegram</CardTitle>
            </div>
          </div>
          <Badge
            variant={isConnected ? 'default' : 'secondary'}
            className={
              isConnected
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                : 'text-muted-foreground'
            }
          >
            {isConnected
              ? isAmharic
                ? 'ተገናኝቷል'
                : 'Connected'
              : isAmharic
                ? 'አልተገናኘም'
                : 'Not Connected'}
          </Badge>
        </div>
        <CardDescription className="pt-1.5">
          {isConnected
            ? isAmharic
              ? 'የቴሌግራም መለያዎ ከአካዳሚው ጋር ተገናኝቷል።'
              : 'Your Telegram account is connected to your academy profile.'
            : isAmharic
              ? 'የአካዳሚ ዝመናዎችን ለማግኘት እና የቴሌግራም አገልግሎቶችን ለመጠቀም መለያዎን ያገናኙ።'
              : 'Connect your Telegram account to receive academy updates and access Telegram services.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConnected ? (
          <div className="rounded-lg border border-border/60 bg-accent/40 p-3.5 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{isAmharic ? 'የተጠቃሚ ስም' : 'Username'}:</span>
              <span className="font-medium text-foreground">{displayUsername}</span>
            </div>
            {formattedDate ? (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{isAmharic ? 'የተገናኘበት ቀን' : 'Connected'}:</span>
                <span>{formattedDate}</span>
              </div>
            ) : null}
            <div className="flex items-center justify-between pt-2 border-t border-border/40">
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="size-3.5" />
                <span>{isAmharic ? 'ንቁ ግንኙነት' : 'Active Connection'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5 px-2.5 text-[#24A1DE] border-[#24A1DE]/30 hover:bg-[#24A1DE]/10"
                  onClick={() =>
                    window.open(
                      'https://t.me/Joel_Talargie_Academy_Bot',
                      '_blank',
                      'noopener,noreferrer',
                    )
                  }
                >
                  <Send className="size-3.5" />
                  <span>{isAmharic ? 'ቴሌግራም ክፈት' : 'Open Telegram'}</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5 px-2.5"
                  disabled={unlinkMutation.isPending}
                  onClick={handleUnlink}
                >
                  {unlinkMutation.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Unlink className="size-3.5" />
                  )}
                  <span>{isAmharic ? 'ግንኙነት አቋርጥ' : 'Disconnect'}</span>
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <Button
            type="button"
            className="w-full gap-2 bg-[#24A1DE] text-white hover:bg-[#208bbf] transition-colors"
            disabled={createLinkMutation.isPending || isRedirecting}
            onClick={handleConnect}
          >
            {createLinkMutation.isPending || isRedirecting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>{isAmharic ? 'በማገናኘት ላይ...' : 'Connecting...'}</span>
              </>
            ) : (
              <>
                <Send className="size-4" />
                <span>{isAmharic ? 'ቴሌግራም አገናኝ' : 'Connect Telegram'}</span>
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function TelegramMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 fill-current">
      <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.56 8.16l-2.02 9.52c-.15.68-.55.85-1.12.53l-3.08-2.27-1.49 1.43c-.16.16-.3.3-.61.3l.22-3.15 5.73-5.18c.25-.22-.05-.34-.39-.12l-7.09 4.46-3.06-.96c-.66-.21-.67-.66.14-.98l11.96-4.61c.55-.2 1.04.14.81 1.03z" />
    </svg>
  );
}
