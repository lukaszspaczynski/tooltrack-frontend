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
  manual: { en: ['manual', 'manuals', 'manuals'], pl: ['instrukcję', 'instrukcje', 'instrukcji'] },
  photo: { en: ['photo', 'photos', 'photos'], pl: ['zdjęcie', 'zdjęcia', 'zdjęć'] },
  place: { en: ['place', 'places', 'places'], pl: ['miejsce', 'miejsca', 'miejsc'] },
  item: { en: ['item', 'items', 'items'], pl: ['narzędzie', 'narzędzia', 'narzędzi'] },
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
  'Usuń miejsce {width} na {height}': 'Delete the {width} by {height} place',
  'Zmiana nazwy poprawi ją też na {items}.': 'Renaming corrects it on {items} as well.',
  '{items} zostaną w katalogu i zachowają nazwę producenta jako tekst — stracą tylko powiązanie z tą pozycją.':
    '{items} stay in the catalog and keep the maker’s name as text — they lose only the link to this entry.',
  'brak narzędzi': 'no items',
  pusty: 'empty',
  'bez narzędzi': 'no items',
  'Dodaj rozmiar na karcie skrzynki „{name}”, a potem wróć tutaj.':
    'Add a size on the case card for “{name}”, then come back here.',
  'Układ „{name}” zniknie. Narzędzia i skrzynka zostają — przestaną tylko być ze sobą powiązane.':
    'The arrangement “{name}” will disappear. The items and the case stay — they simply stop being linked.',
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
    'An unattached photo moves onto the card. Another item’s photo stays where it is — a copy of it appears here.',
  'Znaleziono {n}, ale żaden podgląd się nie wczytał. Spróbuj innego zapytania.':
    'Found {n}, but no preview loaded. Try another query.',
  'Niedostępne bez klucza: {methods} — konfiguruje je administrator w Ustawieniach.':
    'Unavailable without a key: {methods} — an administrator configures them in Settings.',
  'Ustaw metodę i kliknij „Generuj podgląd”. Nic nie zostanie zapisane, dopóki nie potwierdzisz.':
    'Choose a method and press “Generate a preview”. Nothing is saved until you confirm.',
  'Różdżka przy zdjęciu otwiera ekran wycinania tła, gdzie metodę wybiera się dla każdego zdjęcia osobno, widząc oryginał obok wyniku. Tutaj decyduje się,':
    'The wand on a photo opens the cutout screen, where the method is chosen per photo with the original beside the result. What is decided here is',
  '. Wycinka zawsze powstaje jako nowe zdjęcie — oryginał zostaje.':
    '. A cutout is always a new photo — the original stays.',
  'Punkt wyjścia dla metody lokalnej na ekranie wycinania tła (1–765)':
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
    'The account {email} loses access. The item cards it added stay in the catalog.',

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
  'Strona producenta': "The maker's page",
  Opcje: 'Options',
  Opis: 'Description',
  Plik: 'File',
  Pobierz: 'Download',
  Podpis: 'Caption',
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
  Narzędzia: 'Items',
  Katalog: 'Catalog',
  Organizer: 'Organiser',
  Producenci: 'Manufacturers',
  'Przełącz motyw': 'Switch theme',
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
  'Nic tu jeszcze nie zapisano.': 'Nothing has been recorded here yet.',
  'Konto wyłączone': 'Account disabled',
  'Nie udało się odczytać zaimportowanej karty': 'The imported card could not be read back',
  'Baza danych jest chwilowo niedostępna. Spróbuj ponownie.':
    'The database is briefly unavailable. Try again.',
  'Sesja wygasła. Zaloguj się ponownie.': 'Your session has expired. Sign in again.',
  'Ten adres nie prowadzi do żadnego ekranu.': 'This address does not lead to any screen.',
  'Wróć do katalogu': 'Back to the catalog',
  Źródło: 'Source',
  'Typ obiektu': 'Kind',

  // Places the kit is kept
  'Adres usunięty.': 'Address deleted.',
  'Adres usunięty. {n} pozycji straciło lokalizację.':
    'Address deleted. {n} items no longer say where they are.',
  Adresy: 'Addresses',
  Kolor: 'Colour',

  // Parameter names the catalog writes for itself — the importer and the
  // migration that turned a box's measurement columns into rows. A name
  // somebody typed is shown as typed; these are the ones nobody typed.
  // See features/cases/attributeLabels.ts.
  'Długość zewnętrzna': 'Outer length',
  'Szerokość zewnętrzna': 'Outer width',
  'Wysokość zewnętrzna': 'Outer height',
  'Długość wewnętrzna': 'Inner length',
  'Szerokość wewnętrzna': 'Inner width',
  'Wysokość wewnętrzna': 'Inner height',
  Przekątna: 'Diagonal',
  Pojemność: 'Volume',
  Ładowność: 'Load',
  Waga: 'Weight',
  'Ilość na palecie': 'Per pallet',
  Narzędzie: 'Tool',
  Rodzaj: 'Kind',
  'RTV/AGD': 'Appliance',
  'Po nim rozpoznasz miejsce na liście narzędzi.':
    'It is how you recognise the place on a list of items.',
  'Brak adresów': 'No addresses yet',
  'Dodaj adres': 'Add an address',
  'Dodaj pierwsze miejsce, a potem przypiszesz do niego narzędzia i organizery.':
    'Add the first place, then assign items and arrangements to it.',
  'Edytuj adres': 'Edit the address',
  'Klucz u kierownika, wjazd od podwórza…': 'Key with the foreman, entrance from the yard…',
  'Kod pocztowy': 'Postcode',
  Lokal: 'Unit',
  'Magazyn, Budowa Mokotów…': 'Workshop, Mokotów site…',
  'Miejsca, w których stoi sprzęt: magazyn, plac, budowa.':
    'Where the kit stands: a workshop, a yard, a site.',
  Miejsce: 'Place',
  'Miejsce „{name}” zniknie z listy.': 'The place “{name}” will disappear from the list.',
  'Przeniesiono do „{name}”': 'Moved to “{name}”',
  'Karta nie ma już miejsca': 'The card no longer has a place',
  Miejscowość: 'Town',
  'Nic nie pasuje': 'Nothing matches',
  'Nic tu nie stoi.': 'Nothing is kept here.',
  'Nie ma jeszcze żadnego adresu': 'No address yet',
  'Nie podano': 'Not given',
  'Nie udało się wczytać adresów': 'The addresses could not be loaded',
  'Nowy adres': 'New address',
  Numer: 'Number',
  Pusto: 'Empty',
  'Szukaj po nazwie, mieście, ulicy…': 'Search by name, town, street…',
  'To, jak mówicie o tym miejscu. Po tym się je wybiera.':
    'What you call this place. It is what you pick it by.',
  Ulica: 'Street',
  'Usunąć adres?': 'Delete the address?',
  'Wczytywanie…': 'Loading…',
  '{n} organizerów': '{n} arrangements',
  '{things} stracą lokalizację. Zostaną w katalogu.':
    '{things} will stop saying where they are. They stay in the catalog.',

  // Signing in
  Hasło: 'Password',
  'Zarejestruj się': 'Sign up',
  'Załóż konto': 'Create an account',
  'Podaj poprawny adres e-mail': 'Enter a valid email address',
  'Jak mamy Cię podpisywać': 'What we should call you',
  'Opcjonalne — domyślnie część adresu przed @':
    'Optional — the part of the address before @ by default',
  'Katalog narzędzi budowlanych. Wiesz, co masz i w jakim jest stanie.':
    'A catalog of construction items. You know what you have and what state it is in.',

  // Reading the page again into a card that exists
  Aktualizuj: 'Update',
  'Aktualizuj z karty produktu': 'Update from the product page',
  'Zostanie nadpisane': 'Will be overwritten',
  'Marka, model, kategoria i opis': 'Make, model, category and description',
  'Parametry — wszystkie, łącznie z dopisanymi ręcznie':
    'Parameters — all of them, including the ones typed by hand',
  'Instrukcje — stare znikają, przychodzą te ze strony':
    'Manuals — the old ones go, the page’s come in',
  'Zostaje bez zmian': 'Left alone',
  'Nazwa, numer seryjny i stan': 'The name, the serial number and the condition',
  'Zdjęcia — także te wgrane ręcznie': 'Photos — including the ones uploaded by hand',
  'Zaktualizowano: {attributes} parametrów, {manuals}':
    'Updated: {attributes} parameters, {manuals}',
  'Nie udało się zaktualizować narzędzia': 'The item could not be updated',

  // Importing a card from a shop's page
  Importuj: 'Import',
  'Importuj ze strony sklepu': 'Import from a shop page',
  'Adres strony produktu': 'Product page address',
  'Wklej adres strony produktu. Obsługiwane źródła:':
    'Paste the address of a product page. Supported sources:',
  'Ten sklep nie jest obsługiwany': 'That shop is not supported',
  'Import pobiera wszystkie zdjęcia i parametry, więc może potrwać kilkanaście sekund.':
    'The import fetches every photo and parameter, so it can take a good few seconds.',
  'Zaimportowano: {photos} zdjęć, {attributes} parametrów, {manuals}':
    'Imported: {photos} photos, {attributes} parameters, {manuals}',
  'Zaimportowano: {photos} zdjęć, {attributes} parametrów':
    'Imported: {photos} photos, {attributes} parameters',
  'Nie udało się zaimportować narzędzia': 'The item could not be imported',

  // The library of documents
  'Dodaj instrukcję': 'Add a manual',
  'Plik z dysku': 'A file on this device',
  'Adres PDF': 'A PDF address',
  'Adres pliku PDF': 'Address of the PDF',
  'Karta produktu': 'A product page',
  'Adres karty produktu': 'Address of the product page',
  'Pobierze wszystkie instrukcje, które ta strona udostępnia':
    'Fetches every manual that page publishes',
  'Obsługiwane źródła:': 'Supported sources:',
  'Pobrano {manuals}, nie udało się: {failed}': 'Fetched {manuals}, {failed} failed',
  Pozycja: 'Item',
  'Do którego narzędzia należy ten plik': 'Which item this file belongs to',
  'Wybierz plik PDF': 'Choose a PDF',
  'Wszystkie pliki w systemie, niezależnie od narzędzia.':
    'Every file in the model, whichever item it belongs to.',
  'Brak instrukcji': 'No manuals',
  'Nie udało się wczytać instrukcji': 'The manuals could not be loaded',
  'Nazwa instrukcji, narzędzie, model…': 'Manual title, item, model…',
  'Po nazwie pliku albo po narzędziu, do którego należy':
    'By the file’s name, or by the item it belongs to',
  'Nie dodano jeszcze żadnej instrukcji. Robi się to na karcie narzędzia.':
    'No manual has been added yet. They are added on an item’s card.',
  'Bez narzędzia': 'On no item',
  'Zaznacz instrukcję {title}': 'Select the manual {title}',
  'Usunąć instrukcje?': 'Delete the manuals?',
  '{manuals} zniknie z katalogu i z dysku. Tej operacji nie da się cofnąć.':
    '{manuals} will disappear from the catalog and from the disk. This cannot be undone.',
  'Zniknie też z kart narzędzi': 'It goes off these item cards too',
  'Usunięto {manuals}': 'Deleted {manuals}',
  'Usunięto {manuals} z {n} kart': 'Deleted {manuals} from {n} cards',

  // The manuals kept beside an item
  Instrukcje: 'Manuals',
  'Instrukcja dodana': 'Manual added',
  'Nazwa instrukcji': 'Manual title',
  'Zmień nazwę': 'Rename',
  'Zmień nazwę instrukcji {title}': 'Rename the manual {title}',
  'Usuń instrukcję': 'Delete manual',
  'Usuń instrukcję {title}': 'Delete the manual {title}',
  'Wgraj PDF': 'Upload a PDF',
  'Albo wklej adres pliku PDF': 'Or paste the address of a PDF',
  'Pobierz ze strony producenta': 'Fetch from the maker’s page',
  'Pobrano {manuals}': 'Fetched {manuals}',
  'Brak instrukcji. Wgraj plik PDF, wklej adres albo pobierz ze strony producenta.':
    'No manuals. Upload a PDF, paste an address, or fetch them from the maker’s page.',
  'Nikt nie dodał jeszcze instrukcji do tego narzędzia.':
    'Nobody has added a manual to this item yet.',

  // What an item is: the parameters off its rating plate
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
  'Nikt nie zapisał jeszcze parametrów tej pozycji.':
    'Nobody has written down what this one is yet.',

  // Items
  'Nowe narzędzie': 'New item',
  'Dodaj narzędzie': 'Add an item',
  'Dodaj narzędzia': 'Add items',
  'Szukaj narzędzia': 'Search for an item',
  'Nazwa, marka, model, numer seryjny…': 'Name, make, model, serial number…',
  'Nazwa, marka, model…': 'Name, make, model…',
  'Nazwa jest wymagana': 'A name is required',
  'Numer seryjny': 'Serial number',
  'Katalog jest pusty': 'The catalog is empty',
  'Nikt jeszcze nie dodał żadnego narzędzia.': 'Nobody has added an item yet.',
  'Dodaj pierwsze narzędzie, żeby zacząć ewidencję.': 'Add the first item to start the record.',
  'Nic nie pasuje do filtrów': 'Nothing matches the filters',
  'Zmień wyszukiwanie albo wyczyść filtry.': 'Change the search or clear the filters.',
  'Nie udało się wczytać katalogu': 'The catalog could not be loaded',
  'Nie ma takiej karty': 'There is no such card',
  'Karta usunięta': 'Card deleted',
  'Usunąć kartę?': 'Delete the card?',
  'Zniknie z nią {photos} — te, których nie pokazuje żadna inna karta.':
    '{photos} go with it — the ones no other card shows.',
  'Ostatnio dodane': 'Recently added',
  'Ostatnio zmienione': 'Recently changed',

  // Condition of an item
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
    'Reads the catalog, and adds, edits and deletes items.',
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
  'Szukaj skrzynki': 'Search for a case',
  'Nazwa, producent…': 'Name, manufacturer…',
  'Wymiary wewnętrzne': 'Inside dimensions',
  'Wymiary zewnętrzne': 'Outside dimensions',
  Szerokość: 'Width',
  Wysokość: 'Height',
  'Zniknie też organizer tej skrzynki': "The case's arrangement goes with it",
  'Zniknie też {n} organizerów tej skrzynki': "{n} of the case's arrangements go with it",
  'Ta skrzynka nie ma miejsc na etykiety': 'This case has no places for labels',
  'Dodaj miejsce': 'Add a place',
  'Miejsca na etykiety': 'Places for labels',
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
    'This manufacturer will be left without a logo. The entry itself and its items stay.',
  'Ci producenci zostaną bez logo. Same pozycje i ich narzędzia zostają.':
    'These manufacturers will be left without a logo. The entries themselves and their items stay.',
  'Nic tu nie ma. Wgraj logo na ekranie Zdjęcia, a potem wróć tutaj.':
    'Nothing here. Upload a logo on the Photos screen, then come back.',
  'Żadne narzędzie jej nie używa.': 'No item uses it.',

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
  'Wszystkie narzędzia są już w organizerach.': 'Every item is already in an arrangement.',
  'Nic nie pasuje — albo te narzędzia są już w innych organizerach.':
    'Nothing matches — or those items are already in other arrangements.',
  'Nic tu jeszcze nie leży.': 'Nothing lies here yet.',
  'Same narzędzia zostają w katalogu — znika tylko informacja, co w czym leżało.':
    'The items themselves stay in the catalog — only the record of what lay in what goes.',
  'Musi być wolny': 'Must be free',
  'Musi być unikalny — dwa razy ten sam numer to duplikat karty':
    'Must be unique — the same number twice is a duplicate card',
  'Zostaw puste, żeby dostać kolejny wolny': 'Leave empty to get the next free one',
  'Narzędzia w tym organizerze nie mają zdjęć.': 'The items in this arrangement have no photos.',

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
  'Nazwy narzędzi': 'Item names',
  'Modele urządzeń': 'Machine models',
  'Jeśli nie mieszczą się wszystkie, etykieta pokaże ile zostało':
    'If they do not all fit, the label says how many are left',
  'Żadne narzędzie tutaj nie ma wpisanego modelu': 'No item here has a model written down',
  'Duży numer organizera na tle w kolorach producentów. Opcjonalnie z ich logo.':
    'A large arrangement number on a ground in the makers’ colours. With their logos if you like.',
  'Do trzech zdjęć narzędzi, pod nimi nazwa organizera i nazwy narzędzi.':
    'Up to three item photos, with the arrangement’s name and the item names beneath them.',
  'Gotowy do druku': 'Ready to print',
  'Sama grafika': 'Artwork only',
  'Margines ze znacznikami cięcia w rogach, linia cięcia wzdłuż etykiety i linijka kontrolna — zmierz ją po wydruku, żeby sprawdzić, czy drukarka nie przeskalowała pliku':
    'A margin with crop marks in the corners, a cut line along the label and a control ruler — measure it after printing to check the printer did not rescale the file',
  'Strona dokładnie w rozmiarze etykiety, bez żadnych linii. Do wstawienia gdzie indziej albo do obejrzenia':
    'A page exactly the size of the label, with no lines at all. For placing elsewhere, or for looking at',
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
    'The items themselves stay in the catalog — you are deleting photos only.',
  'Jedno z nich to zdjęcie główne — kartę zacznie ilustrować inne zdjęcie, a jeśli innych nie ma, karta zostanie bez zdjęcia.':
    'One of them is a main photo — another will take its place on the card, and if there is no other the card is left without one.',
  'Wszystkie zdjęcia w systemie, niezależnie od narzędzia.':
    'Every photo in the model, whichever item it belongs to.',
  'Zdjęcie nie ma własnej nazwy — szukamy po narzędziu':
    'A photo has no name of its own — we search by item',
  'Nazwa karty, do której zdjęcie należy…': 'The name of the card the photo belongs to…',
  'Przypisane do narzędzia': 'Attached to an item',
  'Zdjęcie jest przypisane do karty': 'The photo is attached to a card',
  'To zdjęcie nie jest przypisane do niczego.': 'This photo is not attached to anything.',
  'Żadne z tych zdjęć nie jest do niczego przypisane.':
    'None of these photos is attached to anything.',
  'Nieprzypisane zdjęcia nie należą do narzędzia, więc nie ma czego szukać':
    'Unattached photos belong to no item, so there is nothing to search by',
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
  'Z karty produktu': 'From the product page',
  'Zdjęcia producenta tego właśnie modelu, zamiast wyników wyszukiwania':
    'The maker’s photographs of this exact model, instead of search results',
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

  // Cutting the background out of a photo
  'Wytnij tło': 'Cut out the background',
  'Metody wycinania tła': 'Background removal methods',
  'Nie udało się wyciąć tła': 'The background could not be cut out',
  'Nie udało się wczytać ustawień wycinania tła':
    'The background removal settings could not be loaded',
  'Wycinanie tła jest wyłączone w Ustawieniach.': 'Background removal is switched off in Settings.',
  'Zdjęcie bez tła zapisane jako nowe': 'The photo without its background was saved as a new one',
  'Zapisz bez tła': 'Save without the background',
  'Zapis tworzy nowe zdjęcie. Oryginał zostaje nietknięty.':
    'Saving makes a new photo. The original is left untouched.',
  'Z tego zdjęcia już wycięto tło': 'The background has been cut out of this photo already',
  Oryginał: 'Original',
  'Po wycięciu tła': 'After the background',
  'bez tła': 'no background',
  'z wyszukiwarki': 'from a search',
  'z adresu': 'from an address',
  wgrane: 'uploaded',
  Wgrane: 'Uploaded',
  Nieprzypisane: 'Unassigned',
  'Żadna metoda nie jest dostępna, więc różdżka przy zdjęciach nie zadziała.':
    'No method is available, so the wand on the photos will not work.',
  'Wyłączona metoda nie pojawia się na ekranie wycinania tła':
    'A method that is switched off does not appear on the background removal screen',
  'Lokalny skrypt': 'Local script',
  'Bez klucza i natychmiast. Wymaga jasnego, jednolitego tła.':
    'No key, and immediate. Needs a light, even background.',
  'Usługa do wycinania tła — radzi sobie ze zdjęciami z warsztatu.':
    'A background removal service — it copes with photographs taken in a workshop.',
  'Model ogólny — przedmiot na białym tle, bez przezroczystości.':
    'A general model — the object on a white ground, with no transparency.',
  'Próg jasności tła': 'Background brightness threshold',
  'Domyślny próg jasności tła': 'Default background brightness threshold',
  'Suma składowych RGB, od której piksel liczy się jako tło. 735 to średnio 245 na kanał. Obniż przy szarawym tle, podnieś, gdy jasny przedmiot gubi fragmenty.':
    'The sum of the RGB components at which a pixel counts as background. 735 is 245 per channel on average. Lower it for a greyish ground; raise it when a light item loses pieces.',
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
  'brak klucza': 'no key',
  skonfigurowana: 'configured',
  'tylko administrator': 'admin only',
  'nie ustawiono': 'not set',
  'wklej klucz': 'paste the key',
  'wklej identyfikator': 'paste the ID',
  'Zapisany: {hint}': 'Saved: {hint}',

  // Phrases that were written into the screens before they went through t()
  'Dodano „{name}"': 'Added “{name}”',
  'Dodano {created} · ostatnia zmiana {updated}': 'Added {created} · last changed {updated}',
  'bez kategorii': 'no category',
  Wiertarki: 'Drills',
  'Nowego dodasz na ekranie': 'Add a new one on the screen',
  'https://…/instrukcja.pdf': 'https://…/manual.pdf',
  'Organizer {number}': 'Organiser {number}',
  'Organizer {number} · {case}': 'Organiser {number} · {case}',
  'Marka „{name}" zniknie z listy.': 'The manufacturer “{name}” will leave the list.',
  '#122447 albo 18 36 71': '#122447 or 18 36 71',
  'albo wklej adres https://…': 'or paste an address https://…',
  'bez przypisania': 'unassigned',
  'Logo producenta {name}': 'Logo of {name}',
  Przypisz: 'Attach',
  'Zaznacz wszystkie ({n})': 'Select all ({n})',
  'tylko z:': 'only from:',
  'Wyniki z: {providers}': 'Results from: {providers}',
  'zaznaczono {n}': '{n} selected',
  'Utworzono organizer {number}': 'Organiser {number} created',
  'Zmieniono {date}': 'Changed {date}',
  '{name} (skrzynka)': '{name} (case)',
  'Wybierz {name}': 'Select {name}',
  'Wyjmij {name}': 'Take out {name}',
  'nie wybrano': 'not chosen',
  'wybrano {n}': '{n} chosen',
  opcjonalnie: 'optional',
  'kolejny wolny': 'next free',
  numer: 'number',
  'do druku': 'print-ready',
  'sama grafika': 'artwork only',
  'Nazwa organizera („{name}")': 'Organiser name (“{name}”)',
  'np. Akumulatory': 'e.g. Batteries',
  'Na tej etykiecie: „{models}"': 'On this label: “{models}”',
  'np. 18 V + 12 V, Li-Ion': 'e.g. 18 V + 12 V, Li-Ion',
  'Etykieta {width} × {height} mm': 'Label {width} × {height} mm',
  'Wszystkie ({n})': 'All ({n})',
  'Narysowano od nowa: {n}': 'Redrawn: {n}',
  'Wygenerowano etykiety: {n}': 'Labels generated: {n}',
  'Zapisano zmiany dla {email}': 'Changes saved for {email}',
  'ty@example.com': 'you@example.com',
}
