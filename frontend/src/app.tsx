import { useCurrentUser } from "./API/users/useCurrentUser";
import { useGlobalStore } from "./store/useGlobalStore";
import Login from "./pages/login";
import SignedInApp from "./pages/signedInApp";

export default function App() {
  const { isPending } = useCurrentUser();
  const user = useGlobalStore((s) => s.user);

  if (isPending) return <p className="center-page muted">Loading…</p>;
  return user ? <SignedInApp key={user.user_id} /> : <Login />;
}
