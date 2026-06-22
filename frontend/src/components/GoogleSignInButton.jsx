import { useEffect, useRef } from 'react';

/**
 * Google Identity Services button. Set VITE_GOOGLE_CLIENT_ID (same OAuth Web client as backend GOOGLE_CLIENT_ID).
 */
export default function GoogleSignInButton({ onCredential }) {
  const divRef = useRef(null);
  const cbRef = useRef(onCredential);
  cbRef.current = onCredential;
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId || !divRef.current) return undefined;

    let cancelled = false;
    const timer = setInterval(() => {
      if (cancelled || !window.google?.accounts?.id || !divRef.current) return;
      clearInterval(timer);
      if (cancelled) return;

      const el = divRef.current;
      el.innerHTML = '';

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response?.credential) {
            cbRef.current(response.credential);
          }
        },
      });

      window.google.accounts.id.renderButton(el, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        width: Math.min(360, el.offsetWidth || 320),
      });
    }, 100);

    return () => {
      cancelled = true;
      clearInterval(timer);
      if (divRef.current) {
        divRef.current.innerHTML = '';
      }
    };
  }, [clientId]);

  if (!clientId) {
    return (
      <p className="text-center text-xs text-gray-500 px-2">
        Add <code className="text-emerald-600">VITE_GOOGLE_CLIENT_ID</code> in{' '}
        <code className="text-emerald-600">frontend/.env</code> for Google sign-in.
      </p>
    );
  }

  return (
    <div
      ref={divRef}
      className="w-full min-h-[44px] flex justify-center [&_.gsi-material-button]:!w-full"
    />
  );
}
