import { Link } from "react-router";
import { bg } from "../assets/copy";

export function BackLinks() {
  return (
    <div className="stack">
      <Link className="btn primary" to="/forgot-password">
        {bg.newLink}
      </Link>
      <Link className="btn" to="/login">
        {bg.back}
      </Link>
    </div>
  );
}
