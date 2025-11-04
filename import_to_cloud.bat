@echo off
REM Script to import SQL files to CLOUD MySQL database
REM You'll need to provide your cloud database connection details

echo ========================================
echo Cloud MySQL Database Import
echo ========================================
echo.

set /p MYSQL_HOST="Enter MySQL Host (e.g., xxx.psdb.cloud or xxx.mysql.database.azure.com): "
set /p MYSQL_USER="Enter MySQL Username: "
set /p MYSQL_PASSWORD="Enter MySQL Password: "
set /p MYSQL_DATABASE="Enter Database Name (default: trading_platform): "

if "%MYSQL_DATABASE%"=="" set MYSQL_DATABASE=trading_platform

set SQL_PATH=C:\Users\1230s\Downloads\attachments

echo.
echo Creating database %MYSQL_DATABASE%...
mysql -h %MYSQL_HOST% -u %MYSQL_USER% -p%MYSQL_PASSWORD% -e "CREATE DATABASE IF NOT EXISTS %MYSQL_DATABASE%;"

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Could not connect to database. Check your credentials.
    pause
    exit /b 1
)

echo.
echo Importing SQL files...
echo.

mysql -h %MYSQL_HOST% -u %MYSQL_USER% -p%MYSQL_PASSWORD% %MYSQL_DATABASE% < "%SQL_PATH%\trading_platform_courses.sql"
mysql -h %MYSQL_HOST% -u %MYSQL_USER% -p%MYSQL_PASSWORD% %MYSQL_DATABASE% < "%SQL_PATH%\trading_platform_course.sql"
mysql -h %MYSQL_HOST% -u %MYSQL_USER% -p%MYSQL_PASSWORD% %MYSQL_DATABASE% < "%SQL_PATH%\trading_platform_course_model.sql"
mysql -h %MYSQL_HOST% -u %MYSQL_USER% -p%MYSQL_PASSWORD% %MYSQL_DATABASE% < "%SQL_PATH%\trading_platform_users.sql"
mysql -h %MYSQL_HOST% -u %MYSQL_USER% -p%MYSQL_PASSWORD% %MYSQL_DATABASE% < "%SQL_PATH%\trading_platform_channel_model.sql"
mysql -h %MYSQL_HOST% -u %MYSQL_USER% -p%MYSQL_PASSWORD% %MYSQL_DATABASE% < "%SQL_PATH%\trading_platform_channels.sql"
mysql -h %MYSQL_HOST% -u %MYSQL_USER% -p%MYSQL_PASSWORD% %MYSQL_DATABASE% < "%SQL_PATH%\trading_platform_message_model.sql"
mysql -h %MYSQL_HOST% -u %MYSQL_USER% -p%MYSQL_PASSWORD% %MYSQL_DATABASE% < "%SQL_PATH%\trading_platform_messages.sql"
mysql -h %MYSQL_HOST% -u %MYSQL_USER% -p%MYSQL_PASSWORD% %MYSQL_DATABASE% < "%SQL_PATH%\trading_platform_user_courses.sql"
mysql -h %MYSQL_HOST% -u %MYSQL_USER% -p%MYSQL_PASSWORD% %MYSQL_DATABASE% < "%SQL_PATH%\trading_platform_user_channel_access.sql"
mysql -h %MYSQL_HOST% -u %MYSQL_USER% -p%MYSQL_PASSWORD% %MYSQL_DATABASE% < "%SQL_PATH%\trading_platform_level_model.sql"
mysql -h %MYSQL_HOST% -u %MYSQL_USER% -p%MYSQL_PASSWORD% %MYSQL_DATABASE% < "%SQL_PATH%\trading_platform_unread_messages.sql"
mysql -h %MYSQL_HOST% -u %MYSQL_USER% -p%MYSQL_PASSWORD% %MYSQL_DATABASE% < "%SQL_PATH%\trading_platform_conversations.sql"
mysql -h %MYSQL_HOST% -u %MYSQL_USER% -p%MYSQL_PASSWORD% %MYSQL_DATABASE% < "%SQL_PATH%\trading_platform_conversation_participants.sql"
mysql -h %MYSQL_HOST% -u %MYSQL_USER% -p%MYSQL_PASSWORD% %MYSQL_DATABASE% < "%SQL_PATH%\trading_platform_direct_messages.sql"
mysql -h %MYSQL_HOST% -u %MYSQL_USER% -p%MYSQL_PASSWORD% %MYSQL_DATABASE% < "%SQL_PATH%\trading_platform_comment_model.sql"
mysql -h %MYSQL_HOST% -u %MYSQL_USER% -p%MYSQL_PASSWORD% %MYSQL_DATABASE% < "%SQL_PATH%\trading_platform_contact_message_model.sql"
mysql -h %MYSQL_HOST% -u %MYSQL_USER% -p%MYSQL_PASSWORD% %MYSQL_DATABASE% < "%SQL_PATH%\trading_platform_message_channels.sql"

echo.
echo ========================================
echo Import Complete!
echo ========================================
echo.
echo Save these values for Vercel:
echo.
echo MYSQL_HOST=%MYSQL_HOST%
echo MYSQL_USER=%MYSQL_USER%
echo MYSQL_PASSWORD=%MYSQL_PASSWORD%
echo MYSQL_DATABASE=%MYSQL_DATABASE%
echo MYSQL_SSL=true
echo.
pause

