if [ -d ./src/UltraCreation ];
then
    svn update ./src/UltraCreation
else
    svn checkout https://svn.code.sf.net/p/ultracreation/code/ ./src/UltraCreation
fi

if [ -d ./src/providers/shared_service ];
then
    svn update ./src/providers/shared_service
else
    svn checkout https://svn.code.sf.net/p/ultracreation/shared_service/ ./src/providers/shared_service
fi

svn update ./
