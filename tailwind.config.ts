// import type { Config } from "tailwindcss";

// export default {
//   content: ["./app/**/*.{js,jsx,ts,tsx}"],
//   theme: {
//     extend: {},
//   },
//   plugins: [],
// } satisfies Config;

import withMT from "@material-tailwind/react/utils/withMT";

export default withMT({
  content: ["./app/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
});
