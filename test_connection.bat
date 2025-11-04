@echo off
echo Testing FreeSQLDatabase connection...
echo.
echo Trying without SSL...
mysql -h sql8.freesqldatabase.com -u sql8806090 -pDGqFQx5FTd --ssl-mode=DISABLED sql8806090 -e "SELECT 'Connection OK' as status;"
echo.
echo Exit code: %ERRORLEVEL%
echo.
pause

