import { useGlobalStore } from "../store/useGlobalStore";
import "../styles/UserBar.css";

type UserInfoProps = {
  onLogout: () => void;
  disabled?: boolean;
};

export default function UserInfo({
  onLogout,
  disabled = false,
}: UserInfoProps) {
  const user = useGlobalStore(
    //hook
    (s) => s.user, //selector
  );
  if (!user) return null;

  return (
    <section className="user-bar" aria-label="Logged-in user">
      <span className="user-bar__avatar" aria-hidden="true">
        {/* Show the user's initials as their avatar. */}
        {user.first_name[0]}
        {user.last_name[0]}
      </span>
      <span className="user-bar__details">
        <span className="user-bar__name">
          {user.first_name} {user.last_name}
        </span>
        <span className="user-bar__email">{user.email}</span>
      </span>
      <button
        type="button"
        className="btn btn--secondary"
        onClick={onLogout}
        disabled={disabled}
      >
        Log out
      </button>
    </section>
  );
}
