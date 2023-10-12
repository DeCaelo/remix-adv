import { cssBundleHref } from "@remix-run/css-bundle";
import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useLocation,
  useSubmit,
} from "@remix-run/react";
import type { ShouldRevalidateFunction } from "@remix-run/react";
import { useCallback, useEffect, useRef, useState } from "react";

import { getUser } from "~/session.server";
import stylesheet from "~/tailwind.css";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./components/ui/alert-dialog";
import { Button } from "./components/ui/button";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return json({ user: await getUser(request) });
};

export default function App() {
  const { user } = useLoaderData<typeof loader>();
  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="h-full bg-theme-100">
        <Outlet />
        {user ? <LogoutTimer /> : null}
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}

// This is important to avoid re-fetching root queries on sub-navigations
export const shouldRevalidate: ShouldRevalidateFunction = ({
  formMethod,
  currentUrl,
  nextUrl,
}) => {
  // revalidate when a mutation is performed e.g add to cart, login...
  if (formMethod && formMethod !== "GET") {
    return true;
  }

  // revalidate when manually revalidating via useRevalidator
  if (currentUrl.toString() === nextUrl.toString()) {
    return true;
  }

  return false;
};

function LogoutTimer() {
  const [status, setStatus] = useState<"idle" | "show-modal">("idle");
  const location = useLocation();
  const submit = useSubmit();
  const logoutTime = 1000 * 60 * 60 * 24;
  const modalTime = logoutTime - 1000 * 60 * 2;

  const modalTimer = useRef<ReturnType<typeof setTimeout>>();
  const logoutTimer = useRef<ReturnType<typeof setTimeout>>();

  const logout = useCallback(() => {
    submit(
      { redirectTo: location.pathname },
      { method: "post", action: "/logout" },
    );
  }, [submit, location.pathname]);

  const cleanupTimers = useCallback(() => {
    clearTimeout(modalTimer.current);
    clearTimeout(logoutTimer.current);
  }, []);

  const resetTimers = useCallback(() => {
    cleanupTimers();
    modalTimer.current = setTimeout(() => {
      setStatus("show-modal");
    }, modalTime);
    logoutTimer.current = setTimeout(logout, logoutTime);
  }, [cleanupTimers, logout, logoutTime, modalTime]);

  useEffect(() => resetTimers(), [resetTimers, location.key]);
  useEffect(() => cleanupTimers, [cleanupTimers]);

  function closeModal() {
    setStatus("idle");
    resetTimers();
  }

  return (
    <AlertDialog
      aria-label="Pending Logout Notification"
      open={status === "show-modal"}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you still there?</AlertDialogTitle>
          <AlertDialogDescription>
            You are going to be logged out due to inactivity. Close this modal
            to stay logged in.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant={"destructive"} onClick={logout}>
            Logout
          </Button>
          <AlertDialogAction onClick={closeModal}>
            Remain Logged In
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
