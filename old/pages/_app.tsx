import "../styles/globals.scss";

import "@fortawesome/fontawesome-svg-core/styles.css";
import { config } from "@fortawesome/fontawesome-svg-core";
config.autoAddCss = false;

import type { AppProps } from "next/app";
import NavigationHeader from "../components/navigation/NavigationHeader";
import Head from "next/head";
import { useEffect } from "react";
import { ToastContextProvider } from "../context/toast-context";
import ToastList from "../components/utilities/ToastList";
import { AuthContextProvider } from "../context/auth-context";
import { CarContextProvider } from "../context/car-context";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    require("bootstrap/dist/js/bootstrap.bundle.min.js");
  }, []);
  return (
    <>
      <Head>
        <title>My Car App</title>
        <meta name="description" content="Keep track of your car. Refuel, repair and tickes." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <ToastContextProvider>
        <AuthContextProvider>
          <CarContextProvider>
            <NavigationHeader />
            <Component {...pageProps} />
            <ToastList />
          </CarContextProvider>
        </AuthContextProvider>
      </ToastContextProvider>
    </>
  );
}
