# Wanvil

**Wanvil** est une web-app libre et gratuite pour **rédiger, organiser et analyser** des romans. Elle facilite la gestion de collections, sagas et tomes, tout en offrant des outils avancés : fiches personnages/lieux/objets/événements, frises chronologiques, auto-complétion contextuelle, statistiques, annotations et navigation dynamique entre les éléments.

> 🚧 **Statut** : projet **en cours de développement**. Des fonctionnalités sont ajoutées en continu.
>
> ✍️ **Éditeur de texte** : [TinyMCE (Tiny Cloud) – plan gratuit](https://www.tiny.cloud/) via une clé d’API.

---

## Sommaire

- [Fonctionnalités](#fonctionnalités)
- [Philosophie & objectifs](#philosophie--objectifs)
- [Captures d’écran](#captures-décran)
- [Feuille de route (Roadmap)](#feuille-de-route-roadmap)
- [Stack & architecture (bref)](#stack--architecture-bref)
- [Prise en main](#prise-en-main)
  - [Prérequis](#prérequis)
  - [Configuration](#configuration)
  - [Lancement (exemple Docker)](#lancement-exemple-docker)
  - [Lancement (exemple sans Docker)](#lancement-exemple-sans-docker)
- [Déploiement](#déploiement)
- [Contribuer](#contribuer)
- [Sécurité & confidentialité](#sécurité--confidentialité)
- [FAQ](#faq)
- [Licence](#licence)
- [Crédits](#crédits)

---

## Fonctionnalités

- **Rédaction riche**
  - Éditeur WYSIWYG (TinyMCE / Tiny Cloud – gratuit)
  - Chapitres, sections, notes
  - Sauvegarde et organisation par **collections → sagas → tomes → chapitres**

- **Fiches & base de connaissances**
  - **Personnages, lieux, objets, événements**
  - Champs personnalisables (descriptions, rôles, relations, etc.)
  - Liens croisés entre fiches et chapitres

- **Chronologie & continuité**
  - **Frises chronologiques** des événements
  - Aide à la **cohérence** (dates, intervalles, ordre)

- **Auto-complétion contextuelle**
  - Suggestions basées sur les **éléments définis** (personnages, lieux, etc.)
  - Références rapides pendant la rédaction

- **Analyse & statistiques**
  - **Compteur de mots** par chapitre / tome
  - **Occurrences** de personnages/lieux mentionnés
  - Indicateurs de progression

- **Annotations & relecture**
  - **Notes** et **commentaires** sur les chapitres
  - Système d’annotations internes (to-do, questions, relectures)

- **Navigation dynamique**
  - Liens internes **bidirectionnels** entre chapitres et fiches
  - Recherche globale

- **Ouvert & auto-hébergeable**
  - **Libre & gratuit**
  - Fonctionne **localement** ou sur **serveur**
  - Web-app compatible multi-plateforme

---

## Philosophie & objectifs

- **Être l’outil des auteurs** : simple pour démarrer, puissant pour grandir.
- **Préserver la propriété** : vos données restent chez vous (auto-hébergement possible).
- **Interopérabilité** (à terme) : export/import, formats ouverts quand c’est possible.
- **Évolution continue** : itérations rapides, feedback de la communauté bienvenu.
- **Accessibilité** : web-app légère, fonctionnelle sur la plupart des navigateurs modernes et sur tous les appareils.

---

## Feuille de route (Roadmap)

- [x] Éditeur de chapitres (TinyMCE / Tiny Cloud)
- [x] Modèles de **fiches** (personnages, lieux, objets, événements)  
- [x] **Auto-complétion** basée sur les fiches
- [ ] **Statistiques** (mots/chapitre, occurrences d’entités)
- [x] **Annotations** et notes de relecture
      ![En cours](https://img.shields.io/badge/statut-en%20cours-yellow)
- [x] **Navigation**: liens dynamiques entre fiches et chapitres
- [ ] **Frise chronologique** et gestion de dates
- [ ] Export/Import de projets
- [ ] Authentification & rôles (si collaboration)
- [ ] Internationalisation (i18n)

> 💡 Cette liste peut être amenée à évoluer.

---

## Stack & architecture (bref)

> Cette section est volontairement générale et pourra être précisée avec la stack finale du projet.

- **Front-end** : Web app moderne, intégration **TinyMCE Cloud**
- **Back-end** : API REST (Flask)
- **Base de données** : **SQLite** (léger, simple à configurer, idéal pour un usage local ou MVP)
- **Infra** : Docker (optionnel), déploiement sur VM/PAAS (à préciser)

---

## Prise en main

### Prérequis

- Accès à une **clé d’API Tiny Cloud** (TinyMCE) gratuite
- **Docker** & **Docker Compose** *ou* votre environnement runtime habituel
- Fichier d’environnement `.env`

---

## Contribuer

Les contributions sont bienvenues ✨

1. **Fork** du repo & branche de feature : `feature/ma-feature`
2. **Commits** clairs (Conventional Commits recommandé)
3. **Tests** si possible
4. **PR** avec description et captures si pertinent

---

## Sécurité & confidentialité

- Minimum de permissions : seules les clés strictement nécessaires (Tiny Cloud).
- Données **locales** par défaut ; en hébergement, chiffrer transports (HTTPS).
- Rapport de vulnérabilité : ouvrir une **issue privée** ou contacter les mainteneurs.

---

## FAQ

**Pourquoi Tiny Cloud ?**  
Pour bénéficier rapidement d’un éditeur riche, stable et maintenu. La clé gratuite suffit pour le MVP.

**Puis-je l’utiliser hors-ligne ?**  
L’app fonctionne localement ; l’éditeur requiert l’accès Tiny Cloud. Une alternative auto-hébergeable pourra être évaluée.

**Puis-je importer un projet existant ?**  
L’import/export est prévu dans la roadmap.

---

## Licence

Ce projet est sous licence **MIT**. Consultez le fichier [LICENSE](LICENSE) pour plus de détails.

---

## Crédits

- Auteurs & mainteneurs : Nathan Fourny
