import { useEffect, useRef, useState, type FormEvent } from "react";
import { toAuthFailure } from "../../domain/mappers/AuthFailureMapper";
import { AuthError } from "../../domain/models/AuthError";
import type { AuthFailure } from "../../domain/models/AuthFailure";
import type { AuthMode } from "../../domain/models/AuthMode";
import type {
  FormErrors,
  FormField,
  FormValues,
} from "../../domain/models/FormErrors";
import { validate } from "../../domain/services/AuthValidationService";
import { useAuthSession } from "./useAuthSession";

interface Options {
  mode: AuthMode;
  token?: string;
  onConsumeLink?: () => void;
}

const EMPTY_VALUES: FormValues = { email: "", password: "", confirm: "" };

export function useAuthSubmission({ mode, token, onConsumeLink }: Options) {
  const { auth, signIn } = useAuthSession();
  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [failure, setFailure] = useState<AuthFailure | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const busy = useRef(false);
  const mounted = useRef(true);
  const formRef = useRef<HTMLFormElement>(null);
  const locked = pending || Boolean(failure?.terminal);

  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, []);

  function setValue(field: FormField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function perform() {
    switch (mode) {
      case "login": {
        const identity = await auth.login(values.email, values.password);

        if (mounted.current) {
          signIn(identity);
        }

        return;
      }

      case "forgot": {
        await auth.forgot(values.email);

        return;
      }

      default: {
        if (!token) {
          throw new AuthError(0);
        }

        await auth.reset(token, values.password);
        onConsumeLink?.();
      }
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();

    if (busy.current || failure?.terminal) {
      return;
    }

    const found = validate(mode, values);
    const firstInvalid = Object.keys(found)[0];

    setErrors(found);
    setFailure(null);

    if (firstInvalid) {
      formRef.current
        ?.querySelector<HTMLInputElement>(`#${firstInvalid}`)
        ?.focus();

      return;
    }

    if (!navigator.onLine) {
      setFailure({ kind: "offline", terminal: false });

      return;
    }

    busy.current = true;
    setPending(true);

    try {
      await perform();

      if (mounted.current) {
        setValues((current) => ({ ...current, password: "", confirm: "" }));
        setDone(true);
      }
    } catch (error) {
      if (mounted.current) {
        setFailure(toAuthFailure(error, mode));
        setValues((current) => ({ ...current, password: "", confirm: "" }));
      }
    } finally {
      busy.current = false;

      if (mounted.current) {
        setPending(false);
      }
    }
  }

  return { values, setValue, errors, failure, pending, locked, done, formRef, submit };
}
