import {TypeInfo, EAbort} from '../UltraCreation/Core'
import {TSqliteStorage, TSqlQuery} from '../UltraCreation/Storage'

import {const_data} from './thunderbolt.const'
import {TApplication} from './application'
import {TAssetService} from './asset'
import {TShell} from './loki'

export namespace Initialization
{
    export function Execute(): Promise<void>
    {
        const db_version = '11';
        let Storage = new TSqliteStorage(const_data.DatabaseName);

        return Storage.ExecSQL('SELECT name FROM sqlite_master WHERE type="table" AND name="Asset"')
            .then(result =>
            {
                let Init = Storage.ExecSQL(DestroyTableSQL).catch(() => {});
                /*
                let Init: Promise<any>;
                if (result.rows.length !== 0)
                {
                    Init = Storage.Get('db_version')
                        .catch(err => 'destroying')
                        .then(Value =>
                        {
                            if (Value === db_version)
                            {
                                console.log('skipping init data');
                                return Promise.reject(new EAbort())
                            }
                            else
                                return Storage.ExecSQL(DestroyTableSQL).catch(() => {});
                        })
                }
                else
                    Init = Storage.ExecSQL(DestroyTableSQL).catch(() => {});
                */

                return Init.then(() => Storage.ExecSQL(InitTableSQL));
            })
            .then(() => Storage.ExecSQL(InitDataSQL))
            .then(() => InitMode(Storage))
            .then(()=> InitBody(Storage))
            .then(()=> InitCategory(Storage))
            .then(()=> InitScriptFile(Storage))
            .then(() => Storage.Set('db_version', db_version))
            .catch((err) => console.log(err.message))       // data initialization ends here
            .then(() => TApplication.Initialize(Storage))
            .then(()=> TAssetService.Initialize(Storage))
            .then(() => TShell.StartOTG())
            .catch((err) => console.log(err.message));
    }

    function InitMode(Storage: TSqliteStorage): Promise<void>
    {
        let queries = [];
        for (let iter of const_data.Modes)
        {
            // Id, ObjectName, Name, Desc, ExtraProp
            queries.push(new TSqlQuery(InsertAsset, [iter.Id, 'Mode', iter.Name, null, null]));

            let Icon: any;
            if (TypeInfo.Assigned(iter.Icon))
                Icon = iter.Icon
            else
                Icon = null;
            queries.push(new TSqlQuery(InsertMode, [iter.Id, Icon]));
        }

        return Storage.ExecQuery(queries).then(() => {});
    }

    function InitBody(Storage: TSqliteStorage): Promise<void>
    {
        let queries = [];
        for (let iter of const_data.BodyParts)
        {
            // Id, ObjectName, Name, Desc, ExtraProp
            queries.push(new TSqlQuery(InsertAsset, [iter.Id, 'Body', iter.Name, iter.Desc, null]));

            let Icon: any;
            if (TypeInfo.Assigned(iter.Icon))
                Icon = iter.Icon
            else
                Icon = null;
            queries.push(new TSqlQuery(InsertBody, [iter.Id, Icon]));
        }

        return Storage.ExecQuery(queries).then(() => {});
    }

    function InitCategory(Storage: TSqliteStorage): Promise<void>
    {
        let queries = [];
        for (let iter of const_data.Categories)
        {
            // Id, ObjectName, Name, Desc, ExtraProp
            queries.push(new TSqlQuery(InsertAsset, [iter.Id, 'Category', iter.Name, iter.Name + '_desc', null]));

            let Icon: any;
            if (TypeInfo.Assigned(iter.Icon))
                Icon = iter.Icon
            else
                Icon = null;
            queries.push(new TSqlQuery(InsertCategory, [iter.Id, Icon]));
        }

        return Storage.ExecQuery(queries).then(() => {});
    }

    function InitScriptFile(Storage: TSqliteStorage): Promise<void>
    {
        let queries = [];
        for (let iter of const_data.ScriptFile)
        {
            // Id, ObjectName, Name, Desc, ExtraProp
            queries.push(new TSqlQuery(InsertAsset, [iter.Id, 'ScriptFile', iter.Name, iter.Name + '_desc', null]));
            // Id, Category_Id, Mode_Id, Body_Id, Author, Content
            queries.push(new TSqlQuery(InsertScriptFile, [iter.Id, iter.Category_Id, iter.Mode_Id, iter.Author, iter.Content]));

            if (iter.BodyParts.length === 0)
            {
                for (let body of const_data.BodyParts)
                    queries.push(new TSqlQuery(InsertScriptFile_Body, [iter.Id, body.Id]));
            }
            else
            {
                for (let body of iter.BodyParts)
                    queries.push(new TSqlQuery(InsertScriptFile_Body, [iter.Id, body.Id]));
            }
        }

        return Storage.ExecQuery(queries).then(() => {});
    }

/*
Profile ER Diagram
    User(Id)

    Profile(Id)
        Id <--> User.Id

    Mode(Id)
        Id  <--> Asset.Id
    Body(Id)
        Id  <--> Asset.Id
    Category(Id)
        Id  <--> Asset.Id

    ScriptFile(Id)
        Id  <--> Asset.Id
        Category_Id ---> Category.Id
        Mode_Id ---> Mode.Id
    ScriptFile_Body
        ScriptFile_Id ---> ScriptFile.Id
        Body_Id ---> Body.Id

    ScriptFileDesc(Id)
        Id  <--> Asset.Id
        ScriptFile_Id ---> ScriptFile.Id
*/

    const InitTableSQL: string[] =
    [
    // User Profile
        'CREATE TABLE IF NOT EXISTS User(' +
            'Id VARCHAR(38) NOT NULL PRIMARY KEY, ' +
            'Email VARCHAR(50) NOT NULL UNIQUE,' +
            'FirstName VARCHAR(50) NOT NULL,' +
            'SurName VARCHAR(50),' +
            'Professional INT);',

        'CREATE TABLE IF NOT EXISTS Profile(' +
            'Id VARCHAR(38) NOT NULL PRIMARY KEY,' +
            'Token TEXT,' +
            'Conf TEXT,' +
            'Role VARCHAR(50),' +
            'Expires DATETIME,' +
            'Timestamp DATETIME,' +
            'FOREIGN KEY(Id) REFERENCES User(Id) ON UPDATE CASCADE ON DELETE CASCADE);',

    // Assets
        'CREATE TABLE IF NOT EXISTS Asset(' +
            'Id VARCHAR(38) NOT NULL PRIMARY KEY,' +
            'ObjectName VARCHAR(20) NOT NULL,' +
            'Name VARCHAR(50) NOT NULL,' +
            'Desc VARCHAR(50), ' +
            'ExtraProp TEXT);',                 // extra properties persist in json
        'CREATE INDEX IF NOT EXISTS IDX_Asset_ObjectName ON Asset(ObjectName, Name);',

        'CREATE TABLE IF NOT EXISTS Mode(' +
            'Id VARCHAR(38) NOT NULL PRIMARY KEY,' +
            'Icon INT,' +
            'FOREIGN KEY(Id) REFERENCES Asset(Id) ON UPDATE CASCADE ON DELETE CASCADE);',

        'CREATE TABLE IF NOT EXISTS Body(' +
            'Id VARCHAR(38) NOT NULL PRIMARY KEY,' +
            'Icon INT,' +
            'FOREIGN KEY(Id) REFERENCES Asset(Id) ON UPDATE CASCADE ON DELETE CASCADE);',

        'CREATE TABLE IF NOT EXISTS Category(' +
            'Id VARCHAR(38) NOT NULL PRIMARY KEY,' +
            'Icon INT,' +
            'FOREIGN KEY(Id) REFERENCES Asset(Id) ON UPDATE CASCADE ON DELETE CASCADE);',

        'CREATE TABLE IF NOT EXISTS ScriptFile(' +
            'Id VARCHAR(38) NOT NULL PRIMARY KEY,' +
            'Category_Id VARCHAR(38) NOT NULL,' +
            'Mode_Id VARCHAR(38),' +
            'Author VARCHAR(100),' +
            'Duration INT,' +
            'Md5 CHAR(32),' +
            'Content TEXT,' +
            'Professional BOOLEAN DEFAULT(0),' +
            'Timestamp DATETIME DEFAULT(0),' +
            'FOREIGN KEY(Id) REFERENCES Asset(Id) ON UPDATE CASCADE ON DELETE CASCADE,' +
            'FOREIGN KEY(Category_Id) REFERENCES Category(Id) ON UPDATE CASCADE ON DELETE CASCADE,' +
            'FOREIGN KEY(Mode_Id) REFERENCES Mode(Id) ON UPDATE CASCADE ON DELETE CASCADE);',

        'CREATE TABLE IF NOT EXISTS ScriptFile_Body(' +
            'ScriptFile_Id VARCHAR(38) NOT NULL,' +
            'Body_Id VARCHAR(38) NOT NULL,' +
            'FOREIGN KEY(ScriptFile_Id) REFERENCES ScriptFile(Id) ON UPDATE CASCADE ON DELETE CASCADE,' +
            'FOREIGN KEY(Body_Id) REFERENCES Body(Id) ON UPDATE CASCADE ON DELETE CASCADE);',

        'CREATE TABLE IF NOT EXISTS ScriptFileDesc(' +
            'Id VARCHAR(38) NOT NULL PRIMARY KEY,' +
            'ScriptFile_Id VARCHAR(38) NOT NULL,' +
            'Idx INT NOT NULL,' +
            'Professional BOOLEAN DEFAULT(0),' +
            'FOREIGN KEY(Id) REFERENCES Asset(Id) ON UPDATE CASCADE ON DELETE CASCADE,' +
            'FOREIGN KEY(ScriptFile_Id) REFERENCES ScriptFile(Id) ON UPDATE CASCADE ON DELETE CASCADE);',
    ];

    const DestroyTableSQL: string [] =
    [
        'DROP TABLE IF EXISTS ScriptFile_Body',
        'DROP TABLE IF EXISTS ScriptFileDesc',
        'DROP TABLE IF EXISTS ScriptFile',
        'DROP TABLE IF EXISTS Favorite',
        'DROP TABLE IF EXISTS Mode',
        'DROP TABLE IF EXISTS Body',
        'DROP TABLE IF EXISTS Category',
        'DROP TABLE IF EXISTS Asset',

        'DROP TABLE IF EXISTS Profile',
        'DROP TABLE IF EXISTS User',
    ];

    const InitDataSQL: string[] =
    [
    // anonymous
        'INSERT OR REPLACE INTO User(Id, FirstName, Email) VALUES("' +
            const_data.Anonymous.Id + '","' + const_data.Anonymous.Name + '","' + const_data.Anonymous.Email + '");',
        'INSERT OR REPLACE INTO Profile(Id) VALUES("' + const_data.Anonymous.Id + '");'
    ];

    const InsertAsset = 'INSERT OR REPLACE INTO Asset(Id, ObjectName, Name, Desc, ExtraProp) VALUES(?,?,?,?,?)';
    const InsertBody = 'INSERT OR REPLACE INTO Body(Id, Icon) VALUES(?,?)';
    const InsertMode = 'INSERT OR REPLACE INTO Mode(Id, Icon) VALUES(?,?)';
    const InsertCategory = 'INSERT OR REPLACE INTO Category(Id, Icon) VALUES(?, ?)';
    const InsertScriptFile = 'INSERT OR REPLACE INTO ScriptFile(Id, Category_Id, Mode_Id, Author, Content) VALUES(?,?,?,?,?)';
    const InsertScriptFile_Body = 'INSERT OR REPLACE INTO ScriptFile_Body(ScriptFile_Id, Body_Id) VALUES(?, ?)'
}

/* drop tables
    DROP TABLE IF EXISTS ScriptFileDesc;
    DROP TABLE IF EXISTS ScriptFile;
    DROP TABLE IF EXISTS Favorite;
    DROP TABLE IF EXISTS Mode;
    DROP TABLE IF EXISTS Body;
    DROP TABLE IF EXISTS Category;
    DROP TABLE IF EXISTS Asset;

    DROP TABLE IF EXISTS Profile;
    DROP TABLE IF EXISTS User;
*/
