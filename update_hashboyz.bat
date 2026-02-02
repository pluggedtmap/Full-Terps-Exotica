@echo off
setlocal EnableDelayedExpansion
echo ==========================================
echo      MISE A JOUR DE HASHBOYZ75.SITE
echo ==========================================

:: 1. Envoi vers GitHub
echo [1/2] Envoi des modifications vers GitHub...
call git add .
set /p commitMsg="Message de la mise a jour (Entree pour 'Update'): "
if "!commitMsg!"=="" set commitMsg=Update
call git commit -m "!commitMsg!"
call git push origin main

:: 2. Génération de la commande VPS
echo.
echo [2/2] Generation de la commande a coller...
echo.

:: La commande magique (sans echappement excessif car on utilise DelayedExpansion mais on doit faire attention)
:: On met tout dans une variable
set "CMD=cd /var/www/hashboyz75 && git pull origin main && npm install --production && pm2 restart hashboyz75-app --update-env"

:: Copie dans le presse-papier sans executer
echo | set /p="!CMD!" | clip

echo ========================================================
echo  ✅ COMMANDE COPIEE DANS LE PRESSE-PAPIER !
echo.
echo  1. Connecte-toi a ton VPS.
echo  2. Fais un Clic Droit pour coller.
echo  3. Appuie sur Entree.
echo ========================================================
echo.
echo Commande (au cas ou) :
echo !CMD!
echo.
pause
