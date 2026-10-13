import { apiMessages, brand } from "../../../common/ui/assets/copy";
import type { AuthFailureKind } from "../../domain/models/AuthFailure";
import type { FormErrorKind } from "../../domain/models/FormErrors";

export const bg = {
  login: "Вход",
  welcome: "Добре дошли",
  forgot: "Забравена парола",
  reset: "Нова парола",
  set: "Задаване на парола",
  area: "Административен панел",
  email: "Имейл адрес",
  emailPlaceholder: "example@company.com",
  password: "Парола",
  confirm: "Повторете паролата",
  loginSub: "Влезте в административния панел",
  forgotSub:
    "Ще изпратим линк за нова парола, ако акаунтът може да получи такъв.",
  resetSub: `Изберете парола за вашия акаунт в ${brand.name}.`,
  send: "Изпрати линк",
  save: "Запази паролата",
  pending: "Изпращане…",
  back: "Към входа",
  newLink: "Поискай нов линк",
  forgotLink: "Забравена парола?",
  rememberSession: "Сесията се запазва",
  noRegistration: "Нямате акаунт? Обърнете се към администратор.",
  singleSession: "Нов вход прекратява предишната активна сесия.",
  policy:
    "Поне 12 UTF-16 единици и най-много 72 UTF-8 байта. Кирилицата и емоджитата може да използват повече от един байт на знак.",
  expiry: "Линкът е валиден 30 минути. Нов линк заменя предишния.",
  mailTitle: "Проверете пощата си",
  mailSafe:
    "Ако този имейл е свързан с допустим акаунт, ще получите линк за нова парола. Проверете и папка „Спам“.",
  saved: "Паролата е запазена",
  savedSub: "Вече можете да влезете с имейла и новата си парола.",
  missing: "Линкът липсва или е повреден",
  missingSub: "Отворете целия линк от имейла или поискайте нов.",
  invalidLink: "Линкът не може да се използва",
  invalidLinkSub: "Поискайте нов линк или се обърнете към администратор.",
  credentials:
    "Имейлът или паролата са неправилни. Проверете данните или използвайте „Забравена парола“.",
  unavailable: apiMessages.unavailable,
  throttled: apiMessages.throttled,
  invalid: apiMessages.invalid,
  size: apiMessages.size,
  forbidden: apiMessages.forbidden,
  loginConflict:
    "Входът не е потвърден поради едновременна операция. Опитайте отново или поискайте нова парола.",
  resetConflict:
    "Промяната не е потвърдена поради едновременна операция. Влезте или поискайте нов линк.",
  uncertain:
    "Промяната на паролата не е потвърдена. Не повтаряйте заявката с този линк. Влезте или поискайте нов линк.",
  offline: apiMessages.offline,
  emailError: "Въведете валиден имейл (до 254 знака).",
  requiredPassword: "Въведете парола.",
  mismatch: "Паролите не съвпадат.",
  session: apiMessages.sessionEnded,
  checkingSession: "Проверка на сесията…",
  sessionUnconfirmed: "Сесията не може да бъде потвърдена. Влезте отново.",
  signedOut: "Излязохте от акаунта.",
  localSignout:
    "Изходът не е потвърден. Сесията може да е активна. Опитайте отново или влезте наново.",
  authenticated: "Успешен вход",
  authenticatedSub:
    "Достъпът е потвърден. Вътрешните екрани все още не са реализирани.",
  logout: "Изход",
  integrationPending:
    "Свързването с API очаква потвърждение на договора за сесията. Не е изпратена заявка.",
} as const;

export const failureText: Record<AuthFailureKind, string> = {
  integrationPending: bg.integrationPending,
  credentials: bg.credentials,
  invalidLink: bg.invalidLinkSub,
  loginConflict: bg.loginConflict,
  resetConflict: bg.resetConflict,
  throttled: bg.throttled,
  invalid: bg.invalid,
  size: bg.size,
  forbidden: bg.forbidden,
  uncertain: bg.uncertain,
  unavailable: bg.unavailable,
  offline: bg.offline,
};

export const formErrorText: Record<FormErrorKind, string> = {
  emailInvalid: bg.emailError,
  passwordRequired: bg.requiredPassword,
  passwordPolicy: bg.policy,
  passwordMismatch: bg.mismatch,
};

export function formErrorMessage(kind?: FormErrorKind): string | undefined {
  return kind ? formErrorText[kind] : undefined;
}
