import type { User } from "../API/types";

export default function UserInfo({ user }: { user: User }) {
  return (
    <section aria-label="Logged-in user">
      <h2>Logged in</h2>
      <p>
        {user.first_name} {user.last_name}
      </p>
      <p>{user.email}</p>
    </section>
  );
}
