// The English side. Keys are the Polish phrases exactly as the screens say
// them; a phrase missing from here shows in Polish, which is the right thing
// for a crew that reads Polish and an honest thing for anybody else.
//
// The interface was written in Polish for a Polish building site. English is
// what it says to somebody who is not from there — a subcontractor, a new
// hire, the person reading over a shoulder — so it aims for the same short,
// spoken register rather than a literal rendering.

import type { CountForms } from './lang'

// Counted nouns, in the forms each language needs: one, few, many. English
// repeats its plural in the last slot.
export const COUNTS = {
  case: { en: ['case', 'cases', 'cases'], pl: ['skrzynka', 'skrzynki', 'skrzynek'] },
  label: { en: ['label', 'labels', 'labels'], pl: ['etykieta', 'etykiety', 'etykiet'] },
  photo: { en: ['photo', 'photos', 'photos'], pl: ['zdjęcie', 'zdjęcia', 'zdjęć'] },
  place: { en: ['place', 'places', 'places'], pl: ['miejsce', 'miejsca', 'miejsc'] },
  tool: { en: ['tool', 'tools', 'tools'], pl: ['narzędzie', 'narzędzia', 'narzędzi'] },
} satisfies Record<string, CountForms>

export const EN: Record<string, string> = {
  // Phrases that carry a number or a name
  Zaloguj: 'Sign in',
  'Nie masz konta?': 'No account yet?',
  '— katalog widzisz od razu, o prawo do edycji poproś administratora.':
    '— you see the catalog at once; ask an administrator for the right to edit.',
  'Hasło musi mieć co najmniej {n} znaków': 'The password must be at least {n} characters',
  'Twoja rola to {role}. Poproś administratora o wyższe uprawnienia, jeśli potrzebujesz tej sekcji.':
    'Your role is {role}. Ask an administrator for more access if you need this section.',
  'Utworzono kopię „{name}”': 'Copy made: “{name}”',
  'Karta „{name}” zniknie z katalogu. Tej operacji nie da się cofnąć.':
    'The card “{name}” will disappear from the catalog. This cannot be undone.',
  'Skrzynka „{name}” zniknie z listy razem ze swoimi zdjęciami. Tej operacji nie da się cofnąć.':
    'The case “{name}” will disappear from the list along with its photos. This cannot be undone.',
  'Zniknie też {n} organizerów tej skrzynki': '{n} arrangements of this case go with it',
  'Usuń miejsce {width} na {height}': 'Delete the {width} by {height} place',
  'Zmiana nazwy poprawi ją też na {tools}.': 'Renaming corrects it on {tools} as well.',
  '{tools} zostaną w katalogu i zachowają nazwę producenta jako tekst — stracą tylko powiązanie z tą pozycją.':
    '{tools} stay in the catalog and keep the maker’s name as text — they lose only the link to this entry.',
  'brak narzędzi': 'no tools',
  pusty: 'empty',
  skrzynka: 'case',
  narzędzie: 'tool',
  'bez narzędzi': 'no tools',
  'Dodaj rozmiar na karcie skrzynki „{name}”, a potem wróć tutaj.':
    'Add a size on the case card for “{name}”, then come back here.',
  'Układ „{name}” zniknie. Narzędzia i skrzynka zostają — przestaną tylko być ze sobą powiązane.':
    'The arrangement “{name}” will disappear. The tools and the case stay — they simply stop being linked.',
  'Odśwież zaznaczone': 'Refresh the selected ones',
  'Narysowano od nowa: {done}': 'Drawn again: {done}',
  'Narysowano od nowa: {done}. Nie udało się: {reasons}': 'Drawn again: {done}. Failed: {reasons}',
  'Narysowano od nowa: {done}. Nie udało się ({count}): {reasons}':
    'Drawn again: {done}. Failed ({count}): {reasons}',
  'Wygenerowano: {done}. Nie udało się: {reasons}': 'Generated: {done}. Failed: {reasons}',
  'Zaznacz etykietę organizera {number}': 'Select the label of arrangement {number}',
  'Zaznacz etykietę {width} × {height} mm': 'Select the {width} × {height} mm label',
  '{shown} z {total} etykiet — resztę widać po stronach':
    '{shown} of {total} labels — the rest are on the pages',
  'Usunięto {n}': 'Deleted {n}',
  'Usunięto {n} z {asked} — reszty już nie było': 'Deleted {n} of {asked} — the rest were gone',
  'Usuń zaznaczone': 'Delete the selected ones',
  'Zaznacz zdjęcie {id}': 'Select photo {id}',
  'Zaznaczono {n}. Zostaną trwale usunięte z dysku.':
    '{n} selected. They will be permanently deleted from the disk.',
  'Zdjęcia są przypisane do {n} kart': 'The photos are attached to {n} cards',
  '{n} z nich to zdjęcia główne — te karty zaczną pokazywać inne zdjęcia, a te bez zapasu zostaną bez zdjęcia.':
    '{n} of them are main photos — those cards will start showing others, and the ones with nothing spare are left without a photo.',
  'Do tego {n} bez przypisania.': 'And {n} attached to nothing.',
  'Zdjęcia są logo {n} producentów': 'The photos are the logos of {n} manufacturers',
  'Zdjęcie główne: {cards}': 'Main photo of: {cards}',
  'Zapisano {n}': 'Saved {n}',
  'Zapisano {n}, nie udało się {failed}': 'Saved {n}, failed {failed}',
  'Przypisano {n}': 'Attached {n}',
  'Przypisano {n}, pominięto {skipped}': 'Attached {n}, skipped {skipped}',
  'Nieprzypisane zdjęcie przenosi się na kartę. Zdjęcie innego narzędzia zostaje tam, gdzie jest — tutaj pojawia się jego kopia.':
    'An unattached photo moves onto the card. Another tool’s photo stays where it is — a copy of it appears here.',
  'Znaleziono {n}, ale żaden podgląd się nie wczytał. Spróbuj innego zapytania.':
    'Found {n}, but no preview loaded. Try another query.',
  'Niedostępne bez klucza: {methods} — konfiguruje je administrator w Ustawieniach.':
    'Unavailable without a key: {methods} — an administrator configures them in Settings.',
  'Ustaw metodę i kliknij „Generuj podgląd”. Nic nie zostanie zapisane, dopóki nie potwierdzisz.':
    'Choose a method and press “Generate a preview”. Nothing is saved until you confirm.',
  'Różdżka przy zdjęciu otwiera ekran wycinania, gdzie metodę wybiera się dla każdego zdjęcia osobno, widząc oryginał obok wyniku. Tutaj decyduje się,':
    'The wand on a photo opens the cutout screen, where the method is chosen per photo with the original beside the result. What is decided here is',
  '. Wycinka zawsze powstaje jako nowe zdjęcie — oryginał zostaje.':
    '. A cutout is always a new photo — the original stays.',
  'Punkt wyjścia dla metody lokalnej na ekranie wycinania (1–765)':
    'The starting point for the local method on the cutout screen (1–765)',
  'Włącz {name}': 'Switch {name} on',
  'Włącz {name} globalnie': 'Switch {name} on for everyone',
  'Używaj {name}': 'Use {name}',
  'Ile zdjęć ta wyszukiwarka dokłada do jednego wyszukiwania (1–{max})':
    'How many photos this engine contributes to one search (1–{max})',
  'Ile zdjęć ta wyszukiwarka dokłada do jednego wyszukiwania. Nie więcej niż {max} — tyle oddaje jej API.':
    'How many photos this engine contributes to one search. No more than {max} — that is all its API returns.',
  'Żadna wyszukiwarka nie jest dla Ciebie aktywna, więc przycisk „Znajdź w internecie” jest nieaktywny.':
    'No search engine is active for you, so the “Search the web” button is disabled.',
  'Dotyczy tylko Twojego konta. Wyłączona wyszukiwarka nie jest odpytywana przy Twoich wyszukiwaniach.':
    'This is about your account only. An engine switched off here is not asked during your searches.',
  'Konfiguracja wspólna dla całej instalacji. Klucze nie są nigdy odsyłane z serwera — widać tylko cztery ostatnie znaki. Puste pole zapisane przyciskiem usuwa klucz.':
    'Shared configuration for the whole installation. Keys are never sent back from the server — only the last four characters show. Saving an empty field deletes the key.',
  'Usuń konto {email}': 'Delete account {email}',
  'Konto {email} straci dostęp. Karty narzędzi, które dodało, zostają w katalogu.':
    'The account {email} loses access. The tool cards it added stay in the catalog.',

  // Single words that a form, a filter or a button leans on
  Aktywne: 'Active',
  Dalej: 'Next',
  Dodaj: 'Add',
  Dowolne: 'Any',
  Dowolny: 'Any',
  Duplikuj: 'Duplicate',
  'E-mail': 'Email',
  Edytuj: 'Edit',
  Kategoria: 'Category',
  Konto: 'Account',
  Logo: 'Logo',
  Logowanie: 'Signing in',
  Margines: 'Margin',
  Marka: 'Make',
  Metoda: 'Method',
  Model: 'Model',
  'Młotowiertarka SDS': 'SDS rotary hammer',
  Nazwa: 'Name',
  Notatki: 'Notes',
  Opcje: 'Options',
  Opis: 'Description',
  Plik: 'File',
  Pobierz: 'Download',
  Podpis: 'Caption',
  Producent: 'Manufacturer',
  Przypisanie: 'Attachment',
  Rejestracja: 'Signing up',
  Rola: 'Role',
  Rozmiar: 'Size',
  'Serwis, przedstawiciel, cokolwiek warto pamiętać': 'Service, dealer, anything worth remembering',
  Skrzynka: 'Case',
  Sortowanie: 'Sorting',
  Stan: 'Condition',
  Szablon: 'Template',
  'Szczotki do wymiany, walizka bez zamka…': 'Brushes to replace, case with no lock…',
  Szukaj: 'Search',
  Wgraj: 'Upload',
  'Wiertarki i wkrętarki': 'Drills and drivers',
  Wszystkie: 'All',
  Wycinka: 'Cutout',

  // The shell and the words that appear on every screen
  Anuluj: 'Cancel',
  'Ciemny motyw': 'Dark theme',
  Etykiety: 'Labels',
  'Jasny motyw': 'Light theme',
  Język: 'Language',
  Narzędzia: 'Tools',
  Katalog: 'Catalog',
  Organizer: 'Organiser',
  Producenci: 'Manufacturers',
  'Przełącz motyw': 'Switch theme',
  Skrzynki: 'Cases',
  Ustawienia: 'Settings',
  Układy: 'Arrangements',
  Użytkownicy: 'Users',
  Wyloguj: 'Sign out',
  Zdjęcia: 'Photos',
  'Zmień język': 'Change language',
  Zapisz: 'Save',
  'Zapisz zmiany': 'Save changes',
  'Zapisano zmiany': 'Changes saved',
  Usuń: 'Delete',
  Utwórz: 'Create',
  Zmień: 'Change',
  Zwiń: 'Collapse',
  Podgląd: 'Viewer',
  Błąd: 'Error',
  'Nieznany błąd': 'Something went wrong',
  'Coś poszło nie tak.': 'Something went wrong.',
  'Nie ma tu nic': 'Nothing here',
  'Nie znaleziono.': 'Not found.',
  'Brak uprawnień': 'No access',
  'Brak uprawnień do tej operacji.': 'You do not have access to this.',
  'Brak połączenia z serwerem': 'No connection to the server',
  'Baza danych jest chwilowo niedostępna. Spróbuj ponownie.':
    'The database is briefly unavailable. Try again.',
  'Sesja wygasła. Zaloguj się ponownie.': 'Your session has expired. Sign in again.',
  'Ten adres nie prowadzi do żadnego ekranu.': 'This address does not lead to any screen.',
  'Wróć do katalogu': 'Back to the catalog',
  Źródło: 'Source',
  'Typ obiektu': 'Kind',

  // Signing in
  Hasło: 'Password',
  'Zarejestruj się': 'Sign up',
  'Załóż konto': 'Create an account',
  'Podaj poprawny adres e-mail': 'Enter a valid email address',
  'Jak mamy Cię podpisywać': 'What we should call you',
  'Opcjonalne — domyślnie część adresu przed @':
    'Optional — the part of the address before @ by default',
  'Katalog narzędzi budowlanych. Wiesz, co masz i w jakim jest stanie.':
    'A catalog of construction tools. You know what you have and what state it is in.',

  // What a tool is: the parameters off its rating plate
  Parametry: 'Parameters',
  'Nazwa parametru': 'Parameter name',
  Wartość: 'Value',
  'Razem z jednostką': 'With its unit',
  'np. Napięcie sieciowe': 'e.g. Mains voltage',
  'np. 230 V': 'e.g. 230 V',
  'Parametr dodany': 'Parameter added',
  'Edytuj parametr': 'Edit parameter',
  'Edytuj parametr {name}': 'Edit the parameter {name}',
  'Usuń parametr': 'Delete parameter',
  'Usuń parametr {name}': 'Delete the parameter {name}',
  'Nic tu jeszcze nie zapisano. Wpisz to, co stoi na tabliczce znamionowej.':
    'Nothing written down yet. Put in what the rating plate says.',
  'Nikt nie zapisał jeszcze parametrów tego narzędzia.':
    'Nobody has written down this tool’s parameters yet.',

  // Tools
  'Nowe narzędzie': 'New tool',
  'Dodaj narzędzie': 'Add a tool',
  'Dodaj narzędzia': 'Add tools',
  'Szukaj narzędzia': 'Search for a tool',
  'Nazwa, marka, model, numer seryjny…': 'Name, make, model, serial number…',
  'Nazwa, marka, model…': 'Name, make, model…',
  'Nazwa jest wymagana': 'A name is required',
  'Producent jest wymagany': 'A manufacturer is required',
  'Numer seryjny': 'Serial number',
  'Katalog jest pusty': 'The catalog is empty',
  'Nikt jeszcze nie dodał żadnego narzędzia.': 'Nobody has added a tool yet.',
  'Dodaj pierwsze narzędzie, żeby zacząć ewidencję.': 'Add the first tool to start the record.',
  'Nic nie pasuje do filtrów': 'Nothing matches the filters',
  'Zmień wyszukiwanie albo wyczyść filtry.': 'Change the search or clear the filters.',
  'Nie udało się wczytać katalogu': 'The catalog could not be loaded',
  'Nie ma takiej karty': 'There is no such card',
  'Karta usunięta': 'Card deleted',
  'Usunąć kartę?': 'Delete the card?',
  'Ostatnio dodane': 'Recently added',
  'Ostatnio zmienione': 'Recently changed',

  // Condition of a tool
  Dobry: 'Good',
  'Do naprawy': 'Needs repair',
  Nowe: 'New',
  Wycofane: 'Retired',
  Zużyte: 'Worn',

  // Roles
  Administrator: 'Administrator',
  Edytor: 'Editor',
  'Wszystko co edytor, plus zarządzanie użytkownikami i rolami.':
    'Everything an editor can do, plus managing users and roles.',
  'Przegląda katalog oraz dodaje, edytuje i usuwa narzędzia.':
    'Reads the catalog, and adds, edits and deletes tools.',
  'Tylko przegląda katalog.': 'Reads the catalog only.',

  // Users
  'Nowe konta dostają rolę': 'New accounts get the role',
  'Nowe konta dostają rolę Podgląd. Rolę i dostęp zmieniasz tutaj.':
    'New accounts get the Viewer role. Roles and access are changed here.',
  'Własnej roli nie zmienisz — poproś innego administratora':
    'You cannot change your own role — ask another administrator',
  'Usunąć konto?': 'Delete the account?',
  'Usuń konto': 'Delete account',
  'Konto usunięte': 'Account deleted',
  'Nie udało się wczytać użytkowników': 'The users could not be loaded',

  // Cases
  'Nowa skrzynka': 'New case',
  'Szukaj skrzynki': 'Search for a case',
  'Nazwa, producent, system, EAN, SKU…': 'Name, manufacturer, system, EAN, SKU…',
  'Nazwa, producent…': 'Name, manufacturer…',
  'Co jest w środku, gdzie stoi, co się w niej zepsuło…':
    'What is inside, where it stands, what broke in it…',
  'Wymiary wewnętrzne': 'Inside dimensions',
  'Wymiary zewnętrzne': 'Outside dimensions',
  Szerokość: 'Width',
  Wysokość: 'Height',
  Długość: 'Length',
  Przekątna: 'Diagonal',
  Pojemność: 'Capacity',
  Ładowność: 'Load capacity',
  'Kod produktu — dwie takie same skrzynki mają ten sam':
    'Product code — two identical cases share it',
  'Nie ma jeszcze żadnych skrzynek.': 'There are no cases yet.',
  'Nie ma takiej skrzynki.': 'There is no such case.',
  'Nie udało się wczytać skrzynek': 'The cases could not be loaded',
  'Nie udało się wczytać skrzynki': 'The case could not be loaded',
  'Usunąć skrzynkę?': 'Delete the case?',
  'Skrzynka usunięta': 'Case deleted',
  'samą skrzynkę': 'the case itself',
  'Zniknie też organizer tej skrzynki': "The case's arrangement goes with it",
  'Ta skrzynka nie ma miejsc na etykiety': 'This case has no places for labels',
  'Dodaj miejsce': 'Add a place',
  'Nie ma jeszcze żadnego miejsca.': 'There are no places yet.',

  // Manufacturers
  'Nowa marka': 'New manufacturer',
  'Dodaj markę': 'Add a manufacturer',
  'Edytuj markę': 'Edit manufacturer',
  'Usuń markę': 'Delete manufacturer',
  'Usunąć markę?': 'Delete the manufacturer?',
  'Marka usunięta': 'Manufacturer deleted',
  'Nazwa marki…': 'Manufacturer name…',
  'Marki, które robią to, co mamy': 'The makers of what we own',
  'Nie ma jeszcze żadnej marki.': 'There are no manufacturers yet.',
  'Nie ma takiego producenta': 'There is no such manufacturer',
  'Nie udało się wczytać producentów': 'The manufacturers could not be loaded',
  'Wiodący kolor': 'Leading colour',
  'Wybierz producenta': 'Choose a manufacturer',
  'Wybierz logo': 'Choose a logo',
  'Ustaw logo': 'Set the logo',
  'Zmień logo': 'Change the logo',
  'Marki bez logo są pomijane': 'Manufacturers without a logo are skipped',
  'Umieść logo producentów': 'Place the manufacturers’ logos',
  'Zdjęcie jest logo producenta': 'The photo is a manufacturer’s logo',
  'Jedno zdjęcie może być logo tylko jednej marki.':
    'One photo can be the logo of one manufacturer only.',
  'Ten producent zostanie bez logo. Sama pozycja i jej narzędzia zostają.':
    'This manufacturer will be left without a logo. The entry itself and its tools stay.',
  'Ci producenci zostaną bez logo. Same pozycje i ich narzędzia zostają.':
    'These manufacturers will be left without a logo. The entries themselves and their tools stay.',
  'Nic tu nie ma. Wgraj logo na ekranie Zdjęcia, a potem wróć tutaj.':
    'Nothing here. Upload a logo on the Photos screen, then come back.',
  'Żadne narzędzie jej nie używa.': 'No tool uses it.',

  // Organiser
  'Nowy organizer': 'New arrangement',
  'Nazwa organizera': 'Arrangement name',
  'Nazwa organizera, opis, skrzynka…': 'Arrangement name, description, case…',
  'Szukaj organizera': 'Search for an arrangement',
  'Co leży w której skrzynce': 'What lies in which case',
  'Co i dlaczego jest w tym układzie': 'What is in this arrangement, and why',
  'Nie ma jeszcze żadnego organizera. Zacznij od wybrania skrzynki.':
    'There are no arrangements yet. Start by choosing a case.',
  'Nie ma takiego organizera.': 'There is no such arrangement.',
  'Nie udało się wczytać organizera': 'The arrangement could not be loaded',
  'Nie udało się wczytać organizerów': 'The arrangements could not be loaded',
  'Usunąć organizer?': 'Delete the arrangement?',
  'Organizer usunięty': 'Arrangement deleted',
  'Wyjmij z organizera': 'Take out of the arrangement',
  'Wszystkie narzędzia są już w organizerach.': 'Every tool is already in an arrangement.',
  'Nic nie pasuje — albo te narzędzia są już w innych organizerach.':
    'Nothing matches — or those tools are already in other arrangements.',
  'Nic tu jeszcze nie leży.': 'Nothing lies here yet.',
  'Same narzędzia zostają w katalogu — znika tylko informacja, co w czym leżało.':
    'The tools themselves stay in the catalog — only the record of what lay in what goes.',
  'Musi być wolny': 'Must be free',
  'Musi być unikalny — dwa razy ten sam numer to duplikat karty':
    'Must be unique — the same number twice is a duplicate card',
  'Zostaw puste, żeby dostać kolejny wolny': 'Leave empty to get the next free one',
  'Narzędzia w tym organizerze nie mają zdjęć.': 'The tools in this arrangement have no photos.',

  // Labels
  'Wszystkie etykiety': 'All labels',
  'Nowa etykieta': 'New label',
  'Brak etykiet': 'No labels',
  'Usuń etykietę': 'Delete label',
  'Etykieta wygenerowana': 'Label generated',
  'Generuj ponownie': 'Generate again',
  'Generuj tę etykietę ponownie': 'Generate this label again',
  'Generuj podgląd': 'Generate a preview',
  'Wygeneruj PDF': 'Generate a PDF',
  'Wszystkie wygenerowane etykiety, niezależnie od organizera.':
    'Every label that has been generated, whichever arrangement made it.',
  'Etykieta nie ma własnej nazwy — szukamy po organizerze i skrzynce':
    'A label has no name of its own — we search by arrangement and case',
  'Nie ma jeszcze żadnej etykiety.': 'There are no labels yet.',
  'Nie wygenerowano jeszcze żadnej etykiety. Robi się je na stronie organizera.':
    'No label has been generated yet. They are made on the arrangement’s page.',
  'Nie udało się wczytać etykiet': 'The labels could not be loaded',
  'Nic nie pasuje do tych filtrów.': 'Nothing matches these filters.',
  'Zaznacz wszystkie': 'Select all',
  'Zaznacz wszystkie na tej stronie': 'Select all on this page',
  'Po stronach': 'By pages',
  'Arkusz do druku': 'Print sheet',
  'Numer porządkowy': 'Number',
  Zawartość: 'Contents',
  zawartość: 'contents',
  Wzór: 'Template',
  'Duży napis nad linią': 'Large text above the line',
  'Mniejszy napis pod linią, wersalikami': 'Smaller text below the line, in capitals',
  'Własna nazwa na etykiecie': 'Your own name on the label',
  'Własny podpis na etykiecie': 'Your own caption on the label',
  'Własny tekst': 'Your own text',
  'Nazwy narzędzi': 'Tool names',
  'Modele urządzeń': 'Machine models',
  'Jeśli nie mieszczą się wszystkie, etykieta pokaże ile zostało':
    'If they do not all fit, the label says how many are left',
  'Żadne narzędzie tutaj nie ma wpisanego modelu': 'No tool here has a model written down',
  'Duży numer organizera na tle w kolorach producentów. Opcjonalnie z ich logo.':
    'A large arrangement number on a ground in the makers’ colours. With their logos if you like.',
  'Do trzech zdjęć narzędzi, pod nimi nazwa organizera i nazwy narzędzi.':
    'Up to three tool photos, with the arrangement’s name and the tool names beneath them.',
  'Gotowy do druku': 'Ready to print',
  'Sama grafika': 'Artwork only',
  'Margines ze znacznikami cięcia w rogach, linia cięcia wzdłuż etykiety i linijka kontrolna — zmierz ją po wydruku, żeby sprawdzić, czy drukarka nie przeskalowała pliku':
    'A margin with crop marks in the corners, a cut line along the label and a control ruler — measure it after printing to check the printer did not rescale the file',
  'Strona dokładnie w rozmiarze etykiety, bez żadnych linii. Do wstawienia gdzie indziej albo do obejrzenia':
    'A page exactly the size of the label, with no lines at all. For placing elsewhere, or for looking at',
  'Z czym się składa': 'What it is made of',
  'Uzupełnij brakujące': 'Fill in what is missing',

  // Photos
  'Wgraj zdjęcie': 'Upload a photo',
  'Zdjęcie dodane': 'Photo added',
  'Zdjęcie dodane do biblioteki': 'Photo added to the library',
  'Nie udało się wgrać zdjęcia': 'The photo could not be uploaded',
  'Nie udało się wczytać zdjęć': 'The photos could not be loaded',
  'Brak zdjęć': 'No photos',
  'Brak zdjęć.': 'No photos.',
  'Brak zdjęć do wyboru.': 'There are no photos to choose from.',
  'Brak zdjęć. Wgraj z telefonu, wklej adres albo poszukaj w internecie.':
    'No photos. Upload from your phone, paste an address, or search the web.',
  'Albo wklej adres zdjęcia': 'Or paste the photo’s address',
  'Z adresu': 'From an address',
  'Wybierz istniejące': 'Choose an existing one',
  'Wybierz istniejące zdjęcie': 'Choose an existing photo',
  'Ustaw jako główne': 'Make it the main photo',
  'To jest zdjęcie główne': 'This is the main photo',
  główne: 'main',
  'Usuń zdjęcie': 'Delete photo',
  'Usunąć zdjęcia?': 'Delete the photos?',
  'To zdjęcie zostanie trwale usunięte z dysku.':
    'This photo will be permanently deleted from the disk.',
  'Same narzędzia zostają w katalogu — usuwasz wyłącznie zdjęcia.':
    'The tools themselves stay in the catalog — you are deleting photos only.',
  'Jedno z nich to zdjęcie główne — kartę zacznie ilustrować inne zdjęcie, a jeśli innych nie ma, karta zostanie bez zdjęcia.':
    'One of them is a main photo — another will take its place on the card, and if there is no other the card is left without one.',
  'Wszystkie zdjęcia w systemie, niezależnie od narzędzia.':
    'Every photo in the system, whichever tool it belongs to.',
  'Zdjęcie nie ma własnej nazwy — szukamy po narzędziu':
    'A photo has no name of its own — we search by tool',
  'Nazwa karty, do której zdjęcie należy…': 'The name of the card the photo belongs to…',
  'Przypisane do narzędzia': 'Attached to a tool',
  'Zdjęcie jest przypisane do karty': 'The photo is attached to a card',
  'To zdjęcie nie jest przypisane do niczego.': 'This photo is not attached to anything.',
  'Żadne z tych zdjęć nie jest do niczego przypisane.':
    'None of these photos is attached to anything.',
  'Nieprzypisane zdjęcia nie należą do narzędzia, więc nie ma czego szukać':
    'Unattached photos belong to no tool, so there is nothing to search by',
  'Nie ma nieprzypisanych zdjęć. Wgraj je na ekranie Zdjęcia albo przełącz na „Wszystkie”.':
    'There are no unattached photos. Upload some on the Photos screen, or switch to “All”.',
  'To zdjęcie już tu było': 'This photo was already here',
  'jedno zdjęcie': 'one photo',
  'bez tytułu': 'untitled',
  'bez wymiarów': 'no dimensions',
  'Nic nie pasuje.': 'Nothing matches.',
  'Nic nie pasuje do tego wyszukiwania.': 'Nothing matches this search.',

  // Searching the web for photos
  'Znajdź w internecie': 'Search the web',
  'Znajdź zdjęcia w internecie': 'Search the web for photos',
  'Czego szukamy': 'What we are looking for',
  'Domyślnie marka i model — to one identyfikują maszynę':
    'The make and model by default — those are what identify a machine',
  'Nic nie znaleziono. Spróbuj innego zapytania — na przykład samej marki.':
    'Nothing found. Try another query — the make on its own, for instance.',
  'Zapisz zaznaczone': 'Save the selected ones',
  'Z wyszukiwarki': 'From a search engine',
  'Wyszukiwanie niedostępne': 'Search unavailable',
  'Wyszukiwanie zdjęć jest wyłączone': 'Photo search is switched off',
  'Część wyszukiwarek nie odpowiedziała': 'Some search engines did not answer',
  'Żadna wyszukiwarka nie jest włączona — sprawdź Ustawienia':
    'No search engine is switched on — see Settings',
  'Włącz którąś poniżej albo uzupełnij jej klucz.': 'Switch one on below, or fill in its key.',
  'Włącz którąś poniżej lub poproś administratora o skonfigurowanie kluczy.':
    'Switch one on below, or ask an administrator to configure the keys.',

  // Cutting a tool out of its photo
  'Wytnij samo narzędzie': 'Cut out the tool alone',
  'Wytnij sam przedmiot': 'Cut out the object alone',
  'samo narzędzie': 'the tool alone',
  'Metody wycinania': 'Cutout methods',
  'Nie udało się wyciąć': 'The cutout failed',
  'Nie udało się wczytać ustawień wycinania': 'The cutout settings could not be loaded',
  'Wycinanie jest wyłączone w Ustawieniach.': 'Cutting out is switched off in Settings.',
  'Wycinka zapisana jako nowe zdjęcie': 'The cutout was saved as a new photo',
  'Zapisz wycinkę': 'Save the cutout',
  'Zapis tworzy nowe zdjęcie. Oryginał zostaje nietknięty.':
    'Saving makes a new photo. The original is left untouched.',
  'To zdjęcie już jest wycięte': 'This photo has been cut out already',
  Oryginał: 'Original',
  'Po wycięciu': 'After the cutout',
  wycięte: 'cut out',
  'Żadna metoda nie jest dostępna, więc różdżka przy zdjęciach nie zadziała.':
    'No method is available, so the wand on the photos will not work.',
  'Wyłączona metoda nie pojawia się na ekranie wycinania':
    'A method that is switched off does not appear on the cutout screen',
  'Lokalny skrypt': 'Local script',
  'Bez klucza i natychmiast. Wymaga jasnego, jednolitego tła.':
    'No key, and immediate. Needs a light, even background.',
  'Usługa do wycinania — radzi sobie ze zdjęciami z warsztatu.':
    'A cutout service — it copes with photographs taken in a workshop.',
  'Model ogólny — narzędzie na białym tle, bez przezroczystości.':
    'A general model — the tool on a white ground, with no transparency.',
  'Próg jasności tła': 'Background brightness threshold',
  'Domyślny próg jasności tła': 'Default background brightness threshold',
  'Suma składowych RGB, od której piksel liczy się jako tło. 735 to średnio 245 na kanał. Obniż przy szarawym tle, podnieś, gdy jasne narzędzie gubi fragmenty.':
    'The sum of the RGB components at which a pixel counts as background. 735 is 245 per channel on average. Lower it for a greyish ground; raise it when a light tool loses pieces.',
  'Zapisz próg': 'Save the threshold',
  'Zapisano próg': 'Threshold saved',
  'Wykryj sam': 'Detect it',
  'pikseli wokół': 'pixels around',

  // Settings
  'Nie udało się wczytać ustawień': 'The settings could not be loaded',
  'Moje wyszukiwarki': 'My search engines',
  'Klucze wyszukiwarek': 'Search engine keys',
  'Wyszukiwarki zdjęć używane przy „Znajdź w internecie”.':
    'The photo search engines used by “Search the web”.',
  'Limit wyników': 'Result limit',
  'Zapisz klucz': 'Save the key',
  'Klucz pochodzi ze zmiennej środowiskowej serwera. Zapisanie go tutaj przykryje tamtą wartość.':
    'The key comes from a server environment variable. Saving one here covers that value.',
  'Brak klucza — poproś administratora o konfigurację':
    'No key — ask an administrator to configure it',
  'Wyłącza tę wyszukiwarkę dla wszystkich kont': 'Switches this engine off for every account',
  'Wyłączona globalnie przez administratora': 'Switched off for everyone by an administrator',
  'Nie ustawiono': 'Not set',
  'ze środowiska': 'from the environment',
  'podpowiedź dla usługi': 'a hint for the service',
  'które metody są tam do wyboru': 'which methods are on offer there',
  dostępna: 'available',
  niedostępna: 'unavailable',
  wyłączona: 'switched off',
}
