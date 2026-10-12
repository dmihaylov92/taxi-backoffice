import { useEffect, useRef } from "react";
import type { AuthFailure } from "../../domain/models/AuthFailure";
import { failureText } from "../assets/copy";

export function FailureAlert({ failure }: { failure: AuthFailure }) {
  const alert = useRef<HTMLDivElement>(null);

  useEffect(() => {
    alert.current?.focus();
  }, [failure]);

  return (
    <div ref={alert} className="banner error" role="alert" tabIndex={-1}>
      {failureText[failure.kind]}
    </div>
  );
}
