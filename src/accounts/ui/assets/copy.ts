import { apiMessages, roleLabels } from "../../../common/ui/assets/copy";
import type { Role } from "../../../common/domain/models/Role";
import type { AccountStatus } from "../../domain/models/Account";
import type { DraftErrorKind } from "../../domain/models/AccountDraft";
import type { AccountFailureKind } from "../../domain/models/AccountFailure";

export const accountsCopy = {
  title: "Акаунти",
  subtitle: "Управлявайте потребителските акаунти и техните роли.",
  newAccount: "Нов акаунт",
  searchLabel: "Търсене на акаунти",
  searchPlaceholder: "Търсене по име или имейл…",
  roleFilter: "Филтър по роля",
  statusFilter: "Филтър по статус",
  allRoles: "Всички роли",
  allStatuses: "Всички статуси",
  tableCaption: "Списък с акаунти",
  columns: {
    name: "Име",
    email: "Имейл",
    roles: "Роли",
    status: "Статус",
    created: "Създаден на",
    actions: "Действия",
  },
  noName: "Без име",
  actionsFor: (name: string) => `Действия за ${name}`,
  menu: {
    edit: "Редактирай",
    resend: "Изпрати покана отново",
    deactivate: "Деактивирай",
    remove: "Изтрий",
  },
  previous: "Предишна",
  next: "Следваща",
  pageLabel: "Странициране",
  currentPage: (page: number) => `Страница ${page}`,
  shown: (count: number) =>
    count === 1 ? "Показан е 1 акаунт" : `Показани са ${count} акаунта`,
  loading: "Зареждане на акаунтите…",
  emptyTitle: "Няма акаунти",
  emptyBody:
    "Все още няма създадени потребителски акаунти. Създайте първия акаунт, за да започнете.",
  noResultsTitle: "Няма намерени акаунти",
  noResultsBody: "Променете търсенето или филтрите.",
  clearFilters: "Изчисти филтрите",
  errorTitle: "Възникна грешка",
  errorBody: "Неуспешно зареждане на акаунтите. Моля, опитайте отново.",
  retry: "Опитай отново",
  create: {
    title: "Нов акаунт",
    steps: ["Основна информация", "Роли и статус", "Преглед"],
    stepsLabel: "Стъпки",
    basicTitle: "Основна информация",
    basicSub: "Въведете имейл адрес и по желание име.",
    rolesTitle: "Роли и статус",
    rolesSub: "Изберете една или повече роли и статус на акаунта.",
    reviewTitle: "Преглед",
    reviewSub: "Проверете данните, преди да създадете акаунта.",
    submit: "Създай акаунт",
  },
  edit: { title: "Редакция на акаунт", submit: "Запази промените" },
  close: "Затвори",
  cancel: "Отказ",
  continue: "Продължи",
  back: "Назад",
  pending: "Изпращане…",
  fields: {
    email: "Имейл адрес",
    emailPlaceholder: "user@taxi.bg",
    emailHint: "Ще бъде изпратена покана на този имейл.",
    firstName: "Име",
    firstNamePlaceholder: "Иван",
    lastName: "Фамилия",
    lastNamePlaceholder: "Петров",
    optional: "по избор",
    roles: "Роли",
    status: "Статус",
  },
  roles: roleLabels,
  roleHints: {
    ADMIN: "Пълен достъп до системата и настройките.",
    DISPATCHER: "Управление на поръчки и шофьори.",
    DRIVER: "Достъп до мобилното приложение.",
  } satisfies Record<Role, string>,
  statuses: {
    ACTIVE: "Активен",
    DISABLED: "Деактивиран",
  } satisfies Record<AccountStatus, string>,
  statusHints: {
    ACTIVE: "Потребителят може да влиза в системата.",
    DISABLED: "Потребителят не може да влиза.",
  } satisfies Record<AccountStatus, string>,
  review: { none: "Не е посочено" },
  remove: {
    title: "Изтриване на акаунт",
    body: "Сигурни ли сте, че искате да изтриете този акаунт? Това действие е необратимо.",
    confirm: "Изтрий завинаги",
  },
  invitation: {
    title: "Поканата е изпратена",
    body: (email: string) => `Покана за достъп е изпратена на ${email}.`,
    confirm: "Разбрах",
  },
  notices: {
    saved: "Промените са запазени.",
    deactivated: "Акаунтът е деактивиран.",
    removed: "Акаунтът е изтрит.",
  },
  dismiss: "Затвори съобщението",
} as const;

export const accountFailureText: Record<AccountFailureKind, string> = {
  unauthenticated: apiMessages.sessionEnded,
  forbidden: apiMessages.forbidden,
  notFound: "Акаунтът не е намерен. Може вече да е изтрит.",
  conflict:
    "Имейлът вече се използва или акаунтът е променен междувременно. Презаредете и опитайте отново.",
  invalid: apiMessages.invalid,
  size: apiMessages.size,
  throttled: apiMessages.throttled,
  unavailable: apiMessages.unavailable,
  offline: apiMessages.offline,
};

export const draftErrorText: Record<DraftErrorKind, string> = {
  emailInvalid: "Въведете валиден имейл (до 254 знака).",
  nameInvalid: "Използвайте до 100 знака без управляващи символи.",
  rolesRequired: "Изберете поне една роля.",
};
