import { Icon } from "../../../common/ui/components/Icon";
import { carsCopy } from "../assets/copy";

interface CarsToolbarProps {
  text: string;
  onTextChange: (text: string) => void;
}

export function CarsToolbar({ text, onTextChange }: CarsToolbarProps) {
  return (
    <div className="toolbar single" role="search">
      <div className="search">
        <Icon name="search" size={18} />
        <input
          type="search"
          aria-label={carsCopy.searchLabel}
          placeholder={carsCopy.searchPlaceholder}
          maxLength={100}
          autoComplete="off"
          value={text}
          onChange={(event) => onTextChange(event.target.value)}
        />
      </div>
    </div>
  );
}
