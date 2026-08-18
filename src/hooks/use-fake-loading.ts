"use client";

import * as React from "react";

export function useFakeLoading(delay = 450) {
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return loading;
}

export function useFakeLoadingOn(dep: unknown, delay = 350) {
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), delay);
    return () => clearTimeout(t);
  }, [dep, delay]);
  return loading;
}