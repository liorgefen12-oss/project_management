import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import App from "./app";
import "./styles/theme.css";
//sets global query defaults:
// data stays fresh for 30 seconds,
// and data isn't refetched when the window regains focus.
// mounts the React Query devtools.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // data counts as "fresh" for 30s
      refetchOnWindowFocus: false, // optional: stops refetch when you alt-tab back
    },
  },
});

//create root dom object, and insert "app" in it
//app containes the pages and components in them
createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
    <ReactQueryDevtools initialIsOpen={false} />
  </QueryClientProvider>,
);
