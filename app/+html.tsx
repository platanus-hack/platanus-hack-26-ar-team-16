import { type PropsWithChildren } from "react";
import { ScrollViewStyleReset } from "expo-router/html";

// Custom HTML wrapper for Expo Web (gohan-app-theta.vercel.app).
// Adds apple-touch-icon + Web App meta so iOS "Add to Home Screen" picks the
// right icon and treats the app as a standalone web app instead of a Safari tab.
// Files referenced live in /public and are served verbatim by Expo Router.
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <ScrollViewStyleReset />

        {/* iOS Add to Home Screen */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Gohan AI" />

        {/* Generic theme color for browser chrome (matches splash bg) */}
        <meta name="theme-color" content="#0F172A" />
      </head>
      <body>{children}</body>
    </html>
  );
}
