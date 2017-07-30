@ECHO OFF

IF NOT EXIST .\src\UltraCreation (
    svn checkout https://svn.code.sf.net/p/ultracreation/code/ .\src\UltraCreation
)ELSE (
    svn update .\src\UltraCreation
)

IF NOT EXIST .\src\providers\shared_service (
    svn checkout https://svn.code.sf.net/p/ultracreation/shared_service/ .\src\providers\shared_service
)ELSE (
    svn update .\src\providers\shared_service
)

svn update
npm config set package-lock false
