import { Icon } from "../../../common/ui/components/Icon";
import { ridesCopy } from "../assets/rideCopy";

export type RideNoticeState =
  /** A write is in flight; the server has not confirmed anything yet. */
  | { tone: "pending"; title: string; body: string }
  /** Only ever set after the server confirmed the change. */
  | { tone: "success"; title: string; body: string };

interface RideNoticeProps {
  notice?: RideNoticeState;
  onDismiss: () => void;
}

/**
 * Page-level feedback. The live region stays mounted so that a notice appearing later is
 * announced; failures are reported where they happened, inside the dialog, as alerts.
 */
export function RideNotice({ notice, onDismiss }: RideNoticeProps) {
  return (
    <div className="toast-region" role="status" aria-live="polite">
      {notice && (
        <div className={`toast ${notice.tone}`}>
          {notice.tone === "pending" ? (
            <span className="spinner" aria-hidden="true" />
          ) : (
            <Icon name="checkCircle" size={22} />
          )}
          <div className="toast-text">
            <strong>{notice.title}</strong>
            <span>{notice.body}</span>
          </div>
          {notice.tone === "success" && (
            <button
              type="button"
              className="icon-button"
              aria-label={ridesCopy.dismiss}
              onClick={onDismiss}
            >
              <Icon name="close" size={18} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
