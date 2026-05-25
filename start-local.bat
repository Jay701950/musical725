@echo off
cd /d "%~dp0"
echo Starting shared realtime document server...
echo.
echo Open this URL in your browser:
echo http://127.0.0.1:10000
echo.
echo Keep this window open while using the site.
echo Press Ctrl+C to stop the server.
echo.
npm.cmd start
