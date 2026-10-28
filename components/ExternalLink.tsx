import { Link, type Href } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import type { ComponentProps } from "react";
import { Platform } from "react-native";

type ExternalLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  href: Href;
};

export function ExternalLink(props: ExternalLinkProps) {
  return (
    <Link
      target="_blank"
      {...props}
      href={props.href}
      onPress={(e) => {
        props.onPress?.(e);

        if (Platform.OS !== "web") {
          // Keep external links inside the app on native platforms.
          e.preventDefault();
          void WebBrowser.openBrowserAsync(String(props.href));
        }
      }}
    />
  );
}
