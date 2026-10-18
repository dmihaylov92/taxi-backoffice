import type { Role } from "../../domain/models/Role";
import type { ViolationReason } from "../../domain/models/ViolationReason";

export const brand = { name: "Taxi", logo: "/logo.svg" };

export const common = {
  skip: "Към съдържанието",
  show: "Покажи",
  hide: "Скрий",
  close: "Затвори",
} as const;

/** Wording for transport-level outcomes, shared so every slice tells the user the same thing. */
export const apiMessages = {
  unavailable: "Услугата не е достъпна. Опитайте отново по-късно.",
  throttled: "Твърде много опити. Изчакайте, преди да опитате отново.",
  invalid: "Заявката е отхвърлена. Проверете въведените данни.",
  size: "Заявката е твърде голяма.",
  forbidden: "Нямате достъп до тази операция.",
  offline: "Няма връзка с мрежата. Свържете се и опитайте отново.",
  sessionEnded: "Сесията приключи. Влезте отново.",
} as const;

export const roleLabels: Record<Role, string> = {
  ADMIN: "Администратор",
  DISPATCHER: "Диспетчер",
  DRIVER: "Шофьор",
};

/** The live event stream: the top-bar indicator and the notice shown while it is down. */
export const stream = {
  status: {
    live: "Онлайн",
    connecting: "Свързване…",
    paused: "Офлайн",
  },
  paused: "Връзката за живи обновления е прекъсната. Опитваме отново…",
} as const;

export const shell = {
  navLabel: "Основна навигация",
  unavailable: "Все още не е налично",
  soon: "Скоро",
  logout: "Изход",
  userLabel: "Текущ потребител",
  items: {
    home: "Начало",
    rides: "Поръчки",
    cars: "Автомобили",
    accounts: "Акаунти",
    settings: "Настройки",
  },
} as const;

export const addressCopy = {
  placeholder: "Въведете адрес",
  searchPlaceholder: "Търсене на адрес…",
  searching: "Търсене на адреси…",
  none: "Няма намерени адреси.",
  failed: "Търсенето на адреси е неуспешно. Можете да въведете адреса ръчно.",
  hint: "Показани са най-подходящите адреси. Продължете да пишете, за да стесните резултатите.",
  noCoordinates:
    "Адресът е избран, но местоположението му не беше получено. Поръчката ще се запази само с адреса.",
} as const;

/** Default wording per API field reason; a form overrides it only where it can say something more useful. */
export const violationText: Record<ViolationReason, string> = {
  REQUIRED: "Полето е задължително.",
  TOO_LONG: "Стойността е твърде дълга.",
  OUT_OF_RANGE: "Стойността е извън допустимия диапазон.",
  INVALID_FORMAT: "Стойността е в невалиден формат.",
  INCOMPLETE: "Данните са непълни.",
  INVALID: "Стойността е невалидна.",
};
