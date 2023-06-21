# Cloud VM Dylan

# Requis

Node.js

# Installation

Au démarage de l'application, écrire `npm install` dans la console pour installer les dépendances.

Pour démarrer l'application, écrire `npm start` dans la console.
Ouvrir [http://localhost:3000](http://localhost:3000) pour voir l'application dans le navigateur.

# Env

Créer un fichier .env et mettres les variables suivantes :

```
AZURE_TENANT_ID=your_tenant_id
AZURE_CLIENT_ID=your_client_id
AZURE_CLIENT_SECRET=your_client_secret
AZURE_SUBSCRIPTION_ID=your_subscription_id
```

# Identifiants de connexion

| Utilisateur                             | Username       | Password   |
| :-------------------------------------- | :------------- | :--------- |
| Utilisateur sans crédit                 | `userNoCredit` | `password` |
| Utilisateur avec crédit et une vm       | `userOneVM`    | `password` |
| Utilisateur avec crédit et plusieurs vm | `userManyVM`   | `password` |

L'utilisateur `userNoCredit` n'a pas de crédit et ne peut donc pas créer de VM.

L'utilisateur `userOneVM` peut créer une VM. Donc lorsque la VM est créee, il doit attendre 10min avant de pouvoir en créer une autre. Lorsqu'il sera sur la page des informations de la VM, au bout de 10min la page s'actualisera automatiquement pour afficher la page de création de VM.

L'utilisateur `userManyVM` peut créer plusieurs VM. Lorsqu'il sera sur la page d'informations de la VM, il aura un bouton pour créer une nouvelle VM. Chaque VM sera supprimé au bout de 10min. **IL EST LIMITÉ À 3 VM.**
