export const MONTHS_PL = [
  "styczeń", "luty", "marzec", "kwiecień", "maj", "czerwiec",
  "lipiec", "sierpień", "wrzesień", "październik", "listopad", "grudzień",
] as const;

export const MONTHS_PL_TITLE = MONTHS_PL.map(
  (m) => m.charAt(0).toUpperCase() + m.slice(1),
);

export const MONTHS_PL_SHORT = [
  "Sty", "Lut", "Mar", "Kwi", "Maj", "Cze",
  "Lip", "Sie", "Wrz", "Paź", "Lis", "Gru",
] as const;

export const TAJEMNICE_LONG: Record<"Ś" | "B" | "CH" | "R", string> = {
  "Ś":  "Światła",
  "B":  "Bolesna",
  "CH": "Chwalebna",
  "R":  "Radosna",
};

export const T = {
  appName: "Tajemniczka",
  vacant: "(wakat)",
  showPhones: "Pokaż numery",
  hidePhones: "Ukryj numery",
  login: {
    title: "Zaloguj",
    passwordLabel: "Hasło",
    submit: "Zaloguj",
    invalid: "Nieprawidłowe hasło.",
    rateLimited: "Zbyt wiele prób. Spróbuj ponownie później.",
  },
  nav: {
    tablica: "Tablica",
    czlonkowie: "Członkowie",
    historia: "Historia",
    ustawienia: "Ustawienia",
    logout: "Wyloguj",
  },
  members: {
    title: "Członkowie",
    add: "Dodaj członka",
    name: "Imię i nazwisko",
    phone: "Numer telefonu",
    save: "Zapisz",
    cancel: "Anuluj",
    remove: "Usuń członka",
    confirmRemove: "Czy na pewno usunąć tego członka?",
    invalidPhone: "Nieprawidłowy numer telefonu.",
    nameRequired: "Imię i nazwisko jest wymagane.",
  },
  history: {
    title: "Historia",
    noRuns: "Brak wysłanych przypomnień.",
    sentCount: (sent: number, total: number) => `Wysłano ${sent}/${total}`,
    statuses: {
      success: "Sukces",
      partial_failure: "Częściowo niepowodzenie",
      fatal_error: "Błąd",
      paused: "Wstrzymano",
      in_progress: "W trakcie",
    },
    retry: "Spróbuj ponownie",
    details: "Szczegóły",
  },
  settings: {
    title: "Ustawienia",
    pauseLabel: "Pauza wysyłki",
    pauseHelp: "Gdy włączone, najbliższa wysyłka SMS zostanie pominięta.",
    sendTest: "Wyślij testowy SMS",
    testSent: "SMS testowy wysłany.",
    testSentTestMode: "Tryb testowy — smsapi przyjęło żądanie, ale nic nie wysłało. Ustaw SMSAPI_TEST_MODE=0 w .env, aby wysłać naprawdę.",
    testFailed: "Nie udało się wysłać:",
    testBody: "Tajemniczka — test wysyłki. Jeśli to widzisz, wszystko działa.",
    changePassword: "Zmień hasło",
    currentPassword: "Obecne hasło",
    newPassword: "Nowe hasło",
    confirmPassword: "Potwierdź nowe hasło",
    passwordsDoNotMatch: "Hasła nie są zgodne.",
    passwordChanged: "Hasło zmienione.",
  },
  failureSms: (groupLabel: string, names: string[]) =>
    `Tajemniczka (${groupLabel}): nie wysłano SMS do: ${names.join(", ")}. Sprawdź aplikację.`,
  monthLabel: (year: number, month: number) =>
    `${MONTHS_PL_TITLE[month - 1]} ${year}`,
} as const;
