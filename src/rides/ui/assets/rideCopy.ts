import type { ApiFailureKind } from "../../../common/domain/models/ApiFailure";
import { apiMessages } from "../../../common/ui/assets/copy";
import type { ConfirmRemoveCopy } from "../../../common/ui/components/ConfirmRemoveDialog";
import type { PaginationCopy } from "../../../common/ui/components/Pagination";
import type { RideStatus, RideType } from "../../domain/models/Ride";
import type { RideDraftErrorKind } from "../../domain/models/RideDraft";
import type { DriverAvailability } from "../../domain/models/RideDriver";

export const ridesCopy = {
  title: "Поръчки",
  subtitle:
    "Създавайте и управлявайте поръчките, назначавайте шофьори и следете статусите им.",
  newRide: "Нова поръчка",
  searchLabel: "Търсене на поръчки",
  searchPlaceholder: "Търсене по телефон или адрес…",
  statusFilter: "Филтър по статус",
  allStatuses: "Всички статуси",
  typeFilter: "Филтър по тип",
  allTypes: "Всички типове",
  driverFilter: "Филтър по шофьор",
  allDrivers: "Всички шофьори",
  filtersSoon:
    "Търсенето и филтрите по тип и шофьор все още не са налични: сървърът още не ги поддържа.",
  tableCaption: "Списък с поръчки",
  columns: {
    number: "№",
    phone: "Телефон",
    route: "Маршрут",
    type: "Тип",
    status: "Статус",
    driver: "Шофьор",
    distance: "Ориентировъчно разстояние",
    created: "Създадена на",
    actions: "Действия",
  },
  noValue: "—",
  noAddresses: "Без адреси",
  noDriver: "Не е назначен",
  driverUnknown: "Назначен шофьор",
  actionsFor: (number: string) => `Действия за поръчка № ${number}`,
  menu: {
    view: "Преглед",
    edit: "Редактирай",
    assign: "Назначи шофьор",
    reassign: "Смени шофьор",
    reject: "Откажи",
    reopen: "Отвори отново",
    remove: "Изтрий",
  },
  unavailable: "Все още не е налично",
  numberLabel: (number: string) => `№ ${number}`,
  distanceKm: (value: string) => `${value} км`,
  loading: "Зареждане на поръчките…",
  emptyTitle: "Още няма поръчки",
  emptyBody: "Когато създадете първата поръчка, тя ще се появи тук.",
  noResultsTitle: "Няма намерени поръчки",
  noResultsBody: (status?: string) =>
    status
      ? `Няма поръчки със статус „${status}“. Променете или изчистете филтрите.`
      : "Променете или изчистете филтрите.",
  clearFilters: "Изчисти филтрите",
  errorTitle: "Възникна грешка",
  errorBody: "Неуспешно зареждане на поръчките. Моля, опитайте отново.",
  retry: "Опитай отново",
  reload: "Презареди",
  previous: "Предишна",
  next: "Следваща",
  pageLabel: "Странициране",
  currentPage: (page: number) => `Страница ${page}`,
  shown: (count: number) =>
    count === 1 ? "Показана е 1 поръчка" : `Показани са ${count} поръчки`,
  statuses: {
    PENDING: "Изчаква",
    ACCEPTED: "Приета",
    FINISHED: "Завършена",
    REJECTED: "Отказана",
  } satisfies Record<RideStatus, string>,
  types: {
    NORMAL: "Обикновена",
    BUSINESS: "Бизнес",
  } satisfies Record<RideType, string>,
  availability: {
    AVAILABLE: "Свободен",
    BUSY: "Зает",
    OFFLINE: "Офлайн",
  } satisfies Record<DriverAvailability, string>,
  optional: "по избор",
  cancel: "Отказ",
  back: "Назад",
  close: "Затвори",
  dismiss: "Затвори съобщението",
  details: {
    title: "Данни за поръчка",
    number: "№ / ID",
    status: "Статус",
    type: "Тип",
    phone: "Телефон",
    pickup: "Адрес за вземане",
    destination: "Дестинация",
    distance: "Ориентировъчно разстояние",
    period: "Планиран период",
    driver: "Шофьор",
    dispatcher: "Диспечер",
    createdAt: "Създадена на",
    acceptedAt: "Приета на",
    finishedAt: "Завършена на",
    noPhone: "Няма телефон",
    noAddress: "Без адрес",
    noDistance: "Няма оценка",
    noDispatcher: "Няма диспечер",
    you: "Вие",
    otherDispatcher: "Друг потребител",
    edit: "Редактирай",
  },
  create: {
    title: "Нова поръчка",
    submit: "Създай поръчка",
    pending: "Създаване…",
    failedSummary:
      "Поръчката не е създадена. Поправете маркираните полета и опитайте отново. Въведените данни са запазени.",
  },
  edit: {
    title: (number: string) => `Редактиране на поръчка № ${number}`,
    submit: "Запази",
    pending: "Запазване…",
    failedSummary:
      "Промените не са запазени. Поправете маркираните полета и опитайте отново. Въведените данни са запазени.",
    addressNotice: (driver: string | undefined) =>
      driver
        ? `Промяната на адрес на приета поръчка уведомява шофьора ${driver}.`
        : "Промяната на адрес на приета поръчка уведомява шофьора.",
    addressNoticeSilent: (driver: string | undefined) =>
      driver
        ? `Поръчката е приета от шофьор ${driver}. Системата все още не уведомява шофьора за промени, съобщете му за новия адрес.`
        : "Системата все още не уведомява шофьора за промени, съобщете му за новия адрес.",
    driverHint: "Сменя се от „Смени шофьор“.",
    driverHintUnavailable: "Шофьорът ще се сменя от „Смени шофьор“.",
  },
  form: {
    typeGroup: "Тип на поръчката",
    normalTitle: "Обикновена",
    normalBody: "Телефонна заявка. Предлага се на свободните шофьори.",
    businessTitle: "Бизнес",
    businessBody:
      "Договорна работа с ръчно назначен шофьор и планиран период.",
    businessUnavailable: "Все още не се поддържа от сървъра.",
    phone: "Телефон на клиента",
    contactPhone: "Телефон за контакт",
    phonePrefix: "Код на държавата",
    phonePlaceholder: "888 123 456",
    phoneHint: "Формат: +359 и още 9 цифри.",
    pickup: "Адрес за вземане",
    destination: "Дестинация",
    addressPlaceholder: "Въведете адрес",
    addressSearchPlaceholder: "Търсене на адрес…",
    driver: "Шофьор",
    noDriver: "Без шофьор",
    driverHintNormal:
      "Без избран шофьор поръчката се създава със статус „Изчаква“ и се предлага на свободните шофьори.",
    driverHintBusiness:
      "Бизнес поръчката се назначава ръчно. Шофьорът е задължителен.",
    plannedFrom: "Планиран период — от",
    plannedTo: "Планиран период — до",
    businessNote:
      "Бизнес поръчката е запис за проследяване на договорна работа. Планираният период е само за информация и не стартира нищо автоматично.",
    distanceTitle: "Ориентировъчно разстояние",
    distanceBody:
      "Ориентир за маршрута по пътищата. Не е цена и не е реален пробег.",
    distanceNone: "Още не е изчислено",
  },
  addresses: {
    searching: "Търсене на адреси…",
    none: "Няма намерени адреси.",
    failed:
      "Търсенето на адреси е неуспешно. Можете да въведете адреса ръчно.",
    hint: "Показани са най-подходящите адреси. Продължете да пишете, за да стесните резултатите.",
  },
  assign: {
    title: "Назначи шофьор",
    reassignTitle: "Смени шофьор",
    currentDriver: "Текущ шофьор",
    searchLabel: "Търсене на шофьор",
    searchPlaceholder: "Търсене по име или имейл…",
    listLabel: "Шофьори",
    holdsRide: (number: string) => `Вече има приета поръчка № ${number}`,
    availabilityNote:
      "Наличността (Свободен, Зает, Офлайн) се променя само от самия шофьор. Тук тя е само за информация.",
    submit: (name: string) => `Назначи ${name}`,
    pending: "Назначаване…",
    loading: "Зареждане на шофьорите…",
    conflict:
      "Назначаването не е записано: поръчката или шофьорът са променени (например шофьорът вече има приета поръчка). Презаредете и опитайте отново.",
    none: "Няма намерени шофьори.",
    failed: "Списъкът с шофьори не може да бъде зареден. Опитайте отново.",
    retry: "Опитай отново",
  },
  reject: {
    title: "Отказване на поръчка",
    question: "Сигурни ли сте, че искате да откажете тази поръчка?",
    notifiesDriver: (name: string | undefined) =>
      name
        ? `Шофьорът ${name} ще бъде уведомен.`
        : "Назначеният шофьор ще бъде уведомен.",
    notNotified:
      "Системата все още не уведомява шофьора, съобщете му за отказа.",
    keepsAvailability: "Наличността на шофьора не се променя.",
    reopenable: "Отказаната поръчка може да бъде отворена отново.",
    confirm: "Откажи поръчката",
    pending: "Отказване…",
  },
  reopen: {
    title: "Отваряне на поръчка",
    question: "Сигурни ли сте, че искате да отворите тази поръчка отново?",
    currentStatus: "Сегашен статус:",
    note: (status: string) =>
      `Поръчката излиза от статус „${status}“ и отново може да се редактира, назначава и отказва.`,
    confirm: "Отвори отново",
    pending: "Отваряне…",
  },
  remove: {
    title: "Изтриване на поръчка",
    body: "Сигурни ли сте, че искате да изтриете тази поръчка? Това действие е необратимо.",
    confirm: "Изтрий завинаги",
    pending: "Изтриване…",
  },
  notices: {
    pendingTitle: "Записване на промените…",
    pendingBody: "Изчакване на потвърждение от сървъра.",
    created: (number: string) => `Поръчка № ${number} е създадена.`,
    createdBody: (status: string) => `Статус: ${status}.`,
    saved: "Промените са запазени.",
    savedBody: (number: string) => `Поръчка № ${number}.`,
    assigned: "Шофьорът е назначен.",
    assignedBody: (name: string, number: string) =>
      `${name} · поръчка № ${number}.`,
    rejected: "Поръчката е отказана.",
    rejectedBody: (number: string) => `№ ${number}.`,
    reopened: "Поръчката е отворена отново.",
    reopenedBody: (number: string) => `№ ${number}.`,
    removed: "Поръчката е изтрита.",
    removedBody: (number: string) => `№ ${number} е премахната за постоянно.`,
  },
} as const;

/** Wording per transport outcome; a stale or conflicting ride asks for a reload, never a blind retry. */
export const rideFailureText: Record<ApiFailureKind, string> = {
  unauthenticated: apiMessages.sessionEnded,
  forbidden: apiMessages.forbidden,
  notFound:
    "Поръчката не е намерена. Може вече да е изтрита. Презаредете списъка.",
  conflict:
    "Поръчката е променена от друг потребител. Презаредете, за да видите актуалните данни. Вашите промени не са записани.",
  invalid:
    "Данните са отхвърлени от сървъра. Проверете телефона и адресите и опитайте отново.",
  size: apiMessages.size,
  throttled: apiMessages.throttled,
  unavailable: apiMessages.unavailable,
  offline:
    "Няма връзка със сървъра. Въведените данни са запазени, опитайте отново.",
};

/** Failures after which the visible list is probably stale and should be reloaded. */
export const STALE_FAILURES: readonly ApiFailureKind[] = [
  "conflict",
  "notFound",
];

export const rideDraftErrorText: Record<RideDraftErrorKind, string> = {
  phoneRequired: "Въведете телефон на клиента.",
  phoneInvalid:
    "Въведете валиден номер: +359 и още 9 цифри, напр. +359 888 123 456.",
  pickupRequired: "Въведете адрес за вземане.",
  destinationRequired: "Въведете адрес на дестинация.",
  addressTooLong: "Адресът може да е до 200 знака.",
  addressInvalid: "Адресът съдържа недопустими символи.",
  driverRequired: "Изберете шофьор.",
  periodInvalid: "Краят на периода трябва да е след началото.",
};

export const ridePaginationCopy: PaginationCopy = {
  label: ridesCopy.pageLabel,
  shown: ridesCopy.shown,
  previous: ridesCopy.previous,
  next: ridesCopy.next,
  currentPage: ridesCopy.currentPage,
};

export const rideRemoveCopy: ConfirmRemoveCopy = {
  title: ridesCopy.remove.title,
  body: ridesCopy.remove.body,
  confirm: ridesCopy.remove.confirm,
  cancel: ridesCopy.cancel,
  pending: ridesCopy.remove.pending,
};
