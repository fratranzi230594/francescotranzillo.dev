export const languages = { en: 'EN', it: 'IT', de: 'DE' } as const;
export type Lang = keyof typeof languages;
export const defaultLang: Lang = 'en';

export const ui = {
  en: {
    'meta.title': 'Francesco Tranzillo — Cloud Consultant, AWS Developer & DevOps',
    'meta.description':
      'Cloud consultant in Berlin. I design, build and run workloads on AWS. Also: film photography, travel, crochet and cooking.',
    'nav.blog': 'Blog',
    'hero.k0': 'Cloud Consultant · AWS Developer & DevOps · Berlin',
    'hero.h0': "Hi, I'm Francesco.",
    'hero.hint': 'scroll',
    'hero.k1': '01 — Work',
    'hero.h1': 'I design, build and run cloud architectures.',
    'hero.p1': 'Every particle is a request: watch it travel from the edge to the database.',
    'hero.k2': '02 — Analog',
    'hero.h2': 'I shoot on film.',
    'hero.p2': 'Morocco, 35mm. Fès · Marrakech · Chefchaouen · Volubilis.',
    'hero.k3': '03 — Crochet',
    'hero.h3': 'One thread, many loops.',
    'hero.p3': 'Crochet is just a network of stitches. Turns out I like both kinds.',
    'hero.k4': '04 — Travel',
    'hero.h4': 'From Lioni to Berlin, and further.',
    'hero.p4': "Where I've lived and travelled, next to the AWS regions I work with.",
    'hero.k5': '05 — Contact',
    'hero.h5': "Let's build something.",
    'hero.top': 'Back to top ↑',
    'blog.title': 'Blog',
    'blog.intro': 'Notes on AWS, DevOps and infrastructure as code.',
    'blog.back': '← All posts',
    'blog.onlyEn': 'Posts are written in English.',
  },
  it: {
    'meta.title': 'Francesco Tranzillo — Cloud Consultant, AWS Developer & DevOps',
    'meta.description':
      'Cloud consultant a Berlino. Progetto, sviluppo e gestisco workload su AWS. E poi: fotografia analogica, viaggi, uncinetto e cucina.',
    'nav.blog': 'Blog',
    'hero.k0': 'Cloud Consultant · AWS Developer & DevOps · Berlino',
    'hero.h0': 'Ciao, sono Francesco.',
    'hero.hint': 'scorri',
    'hero.k1': '01 — Lavoro',
    'hero.h1': 'Progetto, costruisco e gestisco architetture cloud.',
    'hero.p1': "Ogni particella è una richiesta: guardala viaggiare dall'edge al database.",
    'hero.k2': '02 — Analogico',
    'hero.h2': 'Scatto in pellicola.',
    'hero.p2': 'Marocco, 35mm. Fès · Marrakech · Chefchaouen · Volubilis.',
    'hero.k3': '03 — Crochet',
    'hero.h3': 'Un filo, mille anelli.',
    'hero.p3': "L'uncinetto è una rete di punti. A quanto pare mi piacciono tutte e due le reti.",
    'hero.k4': '04 — Viaggi',
    'hero.h4': 'Da Lioni a Berlino, e oltre.',
    'hero.p4': 'Dove ho vissuto e viaggiato, accanto alle region AWS con cui lavoro.',
    'hero.k5': '05 — Contatti',
    'hero.h5': 'Costruiamo qualcosa insieme.',
    'hero.top': 'Torna su ↑',
    'blog.title': 'Blog',
    'blog.intro': 'Appunti su AWS, DevOps e infrastructure as code.',
    'blog.back': '← Tutti gli articoli',
    'blog.onlyEn': 'Gli articoli sono in inglese.',
  },
  de: {
    'meta.title': 'Francesco Tranzillo — Cloud Consultant, AWS Developer & DevOps',
    'meta.description':
      'Cloud Consultant in Berlin. Ich konzipiere, entwickle und betreibe Workloads auf AWS. Außerdem: analoge Fotografie, Reisen, Häkeln und Kochen.',
    'nav.blog': 'Blog',
    'hero.k0': 'Cloud Consultant · AWS Developer & DevOps · Berlin',
    'hero.h0': 'Hallo, ich bin Francesco.',
    'hero.hint': 'scrollen',
    'hero.k1': '01 — Arbeit',
    'hero.h1': 'Ich entwerfe, baue und betreibe Cloud-Architekturen.',
    'hero.p1': 'Jedes Partikel ist ein Request: sieh zu, wie es vom Edge zur Datenbank wandert.',
    'hero.k2': '02 — Analog',
    'hero.h2': 'Ich fotografiere auf Film.',
    'hero.p2': 'Marokko, 35mm. Fès · Marrakesch · Chefchaouen · Volubilis.',
    'hero.k3': '03 — Häkeln',
    'hero.h3': 'Ein Faden, viele Maschen.',
    'hero.p3': 'Häkeln ist ein Netzwerk aus Maschen. Offenbar mag ich beide Arten von Netzwerken.',
    'hero.k4': '04 — Reisen',
    'hero.h4': 'Von Lioni nach Berlin, und weiter.',
    'hero.p4': 'Wo ich gelebt habe und gereist bin, neben den AWS-Regionen, mit denen ich arbeite.',
    'hero.k5': '05 — Kontakt',
    'hero.h5': 'Lass uns etwas bauen.',
    'hero.top': 'Nach oben ↑',
    'blog.title': 'Blog',
    'blog.intro': 'Notizen zu AWS, DevOps und Infrastructure as Code.',
    'blog.back': '← Alle Beiträge',
    'blog.onlyEn': 'Die Beiträge sind auf Englisch.',
  },
} as const;

export type UiKey = keyof (typeof ui)['en'];

export function t(lang: Lang) {
  return (key: UiKey) => ui[lang][key] ?? ui[defaultLang][key];
}

/** URL of the home page in a given language ("/" for English, "/it/" etc.). */
export function homeHref(lang: Lang) {
  return lang === defaultLang ? '/' : `/${lang}/`;
}
