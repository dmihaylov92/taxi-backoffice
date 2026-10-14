import type { Role } from "../../domain/models/Role";

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
