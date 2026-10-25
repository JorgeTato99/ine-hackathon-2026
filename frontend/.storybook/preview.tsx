import type { Preview } from "@storybook/nextjs-vite";
import { AppProviders } from "../src/components/providers/app-providers";
import "../src/theme/fonts.css";
import "leaflet/dist/leaflet.css";
import "../src/app/globals.css";

const preview: Preview = {
  decorators: [
    (Story) => (
      <AppProviders>
        <Story />
      </AppProviders>
    ),
  ],
  parameters: { layout: "centered", a11y: { test: "error" } },
};

export default preview;
