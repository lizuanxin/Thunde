import {TypeInfo} from '../UltraCreation/Core';
import {InitializeStorage, TSqliteEngine} from '../UltraCreation/Storage/Engine/cordova.sqlite';
import {TSqlConnection, TSqlQuery} from '../UltraCreation/Storage/Storage.sql';

import {const_data} from './const_data';
import {TApplication} from './application';
import {TAssetService} from './asset';

export namespace Initialization
{
    export async function Execute(): Promise<void>
    {
        const db_version = '27';
        let conn = await InitializeStorage(new TSqliteEngine('ThunderboltDB.sqlite')).GetConnection();

        let DataSet = await conn.ExecQuery('SELECT name FROM sqlite_master WHERE type="table" AND name="Asset"');
        if (DataSet.RecordCount === 1)
        {
            let Value = await conn.Get('db_version').catch(err => 'destroying');
            if (Value !== db_version)
                await Reconstruct();
        }
        else
            await Reconstruct();

        conn.Release();
        await TApplication.Initialize();
        await TAssetService.Initialize();
        // TShell.StartOTG();

        async function Reconstruct()
        {
            console.log('reconstructor all data...');

            await conn.ExecSQL(DestroyTableSQL).catch(() => {});
            await conn.ExecSQL(InitTableSQL);
            await conn.ExecSQL(InitDataSQL);

            await InitMode(conn);
            await InitBody(conn);
            await InitCategory(conn);
            await InitScriptFile(conn);
            await conn.Set('db_version', db_version).catch((err) => console.log(err.message));
            await conn.EnableForeignKeysConstraint();
        }
    }

    function InitMode(conn: TSqlConnection): Promise<void>
    {
        let queries = [];
        for (let iter of const_data.Modes)
        {
            // Id, ObjectName, Name, Desc, ExtraProp
            queries.push(new TSqlQuery(InsertAsset, [iter.Id, 'Mode', iter.Name, null, null]));

            let Icon: any;
            if (TypeInfo.Assigned(iter.Icon))
                Icon = iter.Icon;
            else
                Icon = null;
            queries.push(new TSqlQuery(InsertMode, [iter.Id, Icon]));
        }

        return conn.ExecQuery(queries).then(() => {});
    }

    function InitBody(conn: TSqlConnection): Promise<void>
    {
        let queries = [];
        for (let iter of const_data.BodyParts)
        {
            // Id, ObjectName, Name, Desc, ExtraProp
            queries.push(new TSqlQuery(InsertAsset, [iter.Id, 'Body', iter.Name, iter.Desc, null]));

            let Icon: any;
            if (TypeInfo.Assigned(iter.Icon))
                Icon = iter.Icon;
            else
                Icon = null;
            queries.push(new TSqlQuery(InsertBody, [iter.Id, Icon]));
        }

        return conn.ExecQuery(queries).then(() => {});
    }

    function InitCategory(conn: TSqlConnection): Promise<void>
    {
        let queries = [];
        for (let iter of const_data.Categories)
        {
            // Id, ObjectName, Name, Desc, ExtraProp
            queries.push(new TSqlQuery(InsertAsset, [iter.Id, 'Category', iter.Name, iter.Name + '_desc', null]));

            let Icon: any;
            if (TypeInfo.Assigned(iter.Icon))
                Icon = iter.Icon;
            else
                Icon = null;
            queries.push(new TSqlQuery(InsertCategory, [iter.Id, Icon]));
        }

        return conn.ExecQuery(queries).then(() => {});
    }

    function InitScriptFile(conn: TSqlConnection): Promise<void>
    {
        let queries = [];
        for (let iter of const_data.ScriptFile)
        {
            let Icon: any;
            if (TypeInfo.Assigned(iter.Icon))
                Icon = iter.Icon;
            else
                Icon = null;

            let Content: any;
            if (TypeInfo.Assigned(iter.Content))
                Content = iter.Content;
            else
                Content = null;

            // Id, ObjectName, Name, Desc, ExtraProp
            queries.push(new TSqlQuery(InsertAsset, [iter.Id, 'ScriptFile', iter.Name, iter.Name + '_desc', null]));
            // Id, Category_Id, Mode_Id, Body_Id, Author, Content
            queries.push(new TSqlQuery(InsertScriptFile, [iter.Id, Icon, iter.Category_Id, iter.Mode_Id, iter.Author, Content]));

            if (! iter.BodyParts)
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

        return conn.ExecQuery(queries).then(() => {});
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
            'ObjectName VARCHAR(50) NOT NULL,' +
            'Name VARCHAR(100) NOT NULL,' +
            'Owner VARCHAR(38),' +
            'Desc TEXT,' +
            'ExtraProp TEXT,' +                 // extra properties persist in json
            'Timestamp DATETIME DEFAULT CURRENT_TIMESTAMP);',
        'CREATE INDEX IF NOT EXISTS IDX_Asset_ObjectName ON Asset(ObjectName, Name);',
        'CREATE INDEX IF NOT EXISTS IDX_Asset_Name ON Asset(Name);',
        'CREATE INDEX IF NOT EXISTS IDX_Asset_Owner ON Asset(Owner);',

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
            'Icon INT,' +
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
    const InsertScriptFile = 'INSERT OR REPLACE INTO ScriptFile(Id, Icon, Category_Id, Mode_Id, Author, Content) VALUES(?,?,?,?,?,?)';
    const InsertScriptFile_Body = 'INSERT OR REPLACE INTO ScriptFile_Body(ScriptFile_Id, Body_Id) VALUES(?, ?)';
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
