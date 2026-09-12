"use client";

import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

// Кэш id студии по slug в рамках сессии: убирает лишний RTT
// (поиск студии по slug) при каждом переходе между разделами.
const studioIdCache = new Map<string, string>();

export async function getCachedStudioId(
  supabase: SupabaseClient,
  slug: string,
): Promise<string | null> {
  const cached = studioIdCache.get(slug);
  if (cached) return cached;
  const { data } = await supabase.from("studios").select("id").eq("slug", slug).single();
  if (data?.id) studioIdCache.set(slug, data.id);
  return data?.id ?? null;
}

export function useStudioId(supabase: SupabaseClient, slug: string) {
  const [studioId, setStudioId] = useState<string | null>(studioIdCache.get(slug) ?? null);

  useEffect(() => {
    if (studioIdCache.has(slug)) {
      // Кэш уже синхронен — но начальный стейт мог быть null при смене slug
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStudioId(studioIdCache.get(slug)!);
      return;
    }
    let cancelled = false;
    supabase
      .from("studios")
      .select("id")
      .eq("slug", slug)
      .single()
      .then(({ data }) => {
        if (cancelled) return;
        if (data?.id) {
          studioIdCache.set(slug, data.id);
          setStudioId(data.id);
        } else {
          setStudioId(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [supabase, slug]);

  return studioId;
}
