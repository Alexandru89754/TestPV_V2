# Patient virtuel (front-end)

## Lancer en local

Aucun build n’est requis : ouvrez simplement les pages HTML dans un navigateur.

1. Ouvrez `index.html` pour l’authentification.
2. Après connexion, l’app charge `app.html`.
3. Les pages `chat.html` et `home.html` sont des écrans secondaires (chat autonome et layout alternatif).

## Configuration

Le fichier central de configuration est : `js/config.js`.

Vous y trouverez :
- **`API_BASE_URL`** + routes d’API (`API_ENDPOINTS`).
- **Clés de stockage** (`STORAGE_KEYS`).
- **Routes/pages** (`ROUTES`).
- **Assets** (`ASSETS`).

## Structure rapide des fichiers

```
.
├── index.html         # page d’entrée (auth)
├── app.html           # application principale
├── chat.html          # chat autonome
├── home.html          # layout alternative
├── style.css          # styles globaux
├── asset/             # assets (images)
└── js/
    ├── api.js         # HTTP JSON standardisé
    ├── session.js     # gestion session
    ├── config.js      # configuration unique
    ├── auth.js        # logique login/register
    ├── app.js         # logique app principale
    ├── chat.js        # logique chat autonome
    ├── welcome.js     # logique écran welcome (si utilisé)
    ├── home.js        # logique home.html
    └── script.js      # logique legacy (si utilisé)
```

## Commandes utiles

- Inventaire rapide : `find . -maxdepth 2 -type f | sort`

## Checklist debug

- **Console** : erreurs JS, `CONFIG`/`API`/`SESSION` non chargés.
- **Network** : 4xx/5xx sur les endpoints, CORS.
- **404** : chemins `asset/` et scripts `js/`.
- **Storage** : token manquant → redirection login.
