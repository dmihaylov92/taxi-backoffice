import { apiMessages } from "../../../common/ui/assets/copy";
import type { ApiFailureKind } from "../../../common/domain/models/ApiFailure";
import type { ConfirmRemoveCopy } from "../../../common/ui/components/ConfirmRemoveDialog";
import type { EmptyStateCopy } from "../../../common/ui/components/ListStates";
import type { PaginationCopy } from "../../../common/ui/components/Pagination";
import type { DraftErrorKind } from "../../domain/models/CarDraft";

export const carsCopy = {
  title: "Автомобили",
  subtitle: "Управлявайте автопарка и назначавайте шофьори към автомобили.",
  newCar: "Нов автомобил",
  searchLabel: "Търсене на автомобили",
  searchPlaceholder: "Търсене по рег. номер или име на шофьор…",
  tableCaption: "Списък с автомобили",
  columns: {
    plate: "Рег. номер",
    driver: "Шофьор",
    vin: "VIN",
    servicedAt: "Последен сервиз",
    actions: "Действия",
  },
  noDriver: "Няма назначен шофьор",
  noValue: "—",
  actionsFor: (plate: string) => `Действия за ${plate}`,
  menu: {
    edit: "Редактирай",
    drivers: "Шофьори",
    remove: "Изтрий",
  },
  previous: "Предишна",
  next: "Следваща",
  pageLabel: "Странициране",
  currentPage: (page: number) => `Страница ${page}`,
  shown: (count: number) =>
    count === 1 ? "Показан е 1 автомобил" : `Показани са ${count} автомобила`,
  loading: "Зареждане на автомобилите…",
  emptyTitle: "Няма автомобили",
  emptyBody:
    "Все още няма добавени автомобили. Добавете първия автомобил, за да започнете.",
  noResultsTitle: "Няма намерени автомобили",
  noResultsBody: "Променете търсенето.",
  clearFilters: "Изчисти търсенето",
  errorTitle: "Възникна грешка",
  errorBody: "Неуспешно зареждане на автомобилите. Моля, опитайте отново.",
  retry: "Опитай отново",
  create: { title: "Нов автомобил", submit: "Добави автомобил" },
  edit: { title: "Редакция на автомобил", submit: "Запази промените" },
  cancel: "Отказ",
  pending: "Изпращане…",
  fields: {
    plate: "Регистрационен номер",
    platePlaceholder: "СВ 1234 АВ",
    make: "Марка",
    makePlaceholder: "Skoda",
    model: "Модел",
    modelPlaceholder: "Octavia",
    vin: "VIN",
    vinPlaceholder: "17 знака",
    vinHint: "17 знака, без I, O и Q.",
    mileageKm: "Пробег (км)",
    servicedAt: "Последен сервиз",
    optional: "по избор",
  },
  remove: {
    title: "Изтриване на автомобил",
    body: "Сигурни ли сте, че искате да изтриете този автомобил? Назначените шофьори ще бъдат освободени. Това действие е необратимо.",
    confirm: "Изтрий завинаги",
  },
  drivers: {
    title: (plate: string) => `Шофьори на ${plate}`,
    assigned: "Назначени шофьори",
    noneAssigned: "Към автомобила няма назначени шофьори.",
    unassign: "Премахни",
    unassignFor: (name: string) => `Премахни ${name} от автомобила`,
    add: "Назначаване на шофьор",
    searchLabel: "Търсене на шофьор",
    searchPlaceholder: "Име или имейл на шофьор…",
    assign: "Назначи",
    assignFor: (name: string) => `Назначи ${name} към автомобила`,
    loading: "Търсене на шофьори…",
    noCandidates: "Няма намерени активни шофьори.",
    releaseHint:
      "Шофьор, който вече има автомобил, се премахва от него автоматично.",
    assignedNotice: "Шофьорът е назначен.",
    unassignedNotice: "Шофьорът е премахнат от автомобила.",
    searchFailed: "Търсенето на шофьори е неуспешно. Опитайте отново.",
    close: "Затвори",
  },
  notices: {
    created: "Автомобилът е добавен.",
    saved: "Промените са запазени.",
    removed: "Автомобилът е изтрит.",
  },
  dismiss: "Затвори съобщението",
} as const;

export const carFailureText: Record<ApiFailureKind, string> = {
  unauthenticated: apiMessages.sessionEnded,
  forbidden: apiMessages.forbidden,
  notFound: "Автомобилът или шофьорът не е намерен. Може вече да е изтрит.",
  conflict:
    "Регистрационният номер или VIN вече се използват, или данните са променени междувременно. Презаредете и опитайте отново.",
  invalid: apiMessages.invalid,
  size: apiMessages.size,
  throttled: apiMessages.throttled,
  unavailable: apiMessages.unavailable,
  offline: apiMessages.offline,
};

export const carDraftErrorText: Record<DraftErrorKind, string> = {
  plateRequired: "Въведете регистрационен номер.",
  plateInvalid: "Използвайте до 20 букви, цифри или тирета.",
  textTooLong: "Използвайте до 50 знака без управляващи символи.",
  vinInvalid: "VIN трябва да е точно 17 знака (букви и цифри, без I, O, Q).",
  mileageInvalid: "Въведете цяло число до 9 999 999.",
};

export const carPaginationCopy: PaginationCopy = {
  label: carsCopy.pageLabel,
  shown: carsCopy.shown,
  previous: carsCopy.previous,
  next: carsCopy.next,
  currentPage: carsCopy.currentPage,
};

export const carEmptyStateCopy: EmptyStateCopy = {
  title: carsCopy.emptyTitle,
  body: carsCopy.emptyBody,
  create: carsCopy.newCar,
  noResultsTitle: carsCopy.noResultsTitle,
  noResultsBody: carsCopy.noResultsBody,
  clearFilters: carsCopy.clearFilters,
};

export const carRemoveCopy: ConfirmRemoveCopy = {
  title: carsCopy.remove.title,
  body: carsCopy.remove.body,
  confirm: carsCopy.remove.confirm,
  cancel: carsCopy.cancel,
  pending: carsCopy.pending,
};
